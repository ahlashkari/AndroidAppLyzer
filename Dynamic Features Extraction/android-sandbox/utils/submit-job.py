# Turns web-server into a headless job dispatcher. A simple workaround before a proper API service gets implemented.
# Only works when both the database and the web-server are deployed on the same system.
import os
import sys
import hashlib
import datetime
import json
import traceback

from pymongo import MongoClient
import pymongo.errors
from bson.objectid import ObjectId

APK_MAGIC = b'PK\x03\x04'

def submit_job(db, uid, apkFileName):
    with open(apkFileName, 'rb') as f:
        fBytes = f.read(4)

        # Simple header check. More sophisticated checks are done on analysis server.
        if(APK_MAGIC != fBytes):
            raise RuntimeError("The file specified is not an APK file.")

        f.seek(0)
        hashes = (hashlib.sha256(), hashlib.sha1(), hashlib.md5())

        while True:
            buf = f.read(1*1024*1024)
            if len(buf) == 0:
                break
            for h in hashes:
                h.update(buf)

        fHashSHA256 = hashes[0].hexdigest()
        fHashSHA1 = hashes[1].hexdigest()
        fHashMD5 = hashes[2].hexdigest()

        # Skip copying to compensate for huge sample population
        fOrigName = os.path.basename(apkFileName)
        fTempPath = os.path.abspath(apkFileName)

        curDate = datetime.datetime.utcnow()

        analysis = {
            "owner": ObjectId(uid),
            "permissions" : {
                "usesPermission": [],
                "usesPermissionSdk23": [],
                "permission": []
            },
            "batteryCSV": [],
            "intentCSV": [],
            "permCSV": [],
            "sha256":  fHashSHA256,
            "sha1": fHashSHA1,
            "md5": fHashMD5,
            "path": fTempPath,
            "fileName": fOrigName,
            "deviceType" : "emulator",
            "state": 2,
            "createdAt": curDate,
            "updatedAt": curDate,
            "__v": 0
        }

        result=db.analyses.insert_one(analysis)
        print("Created analysis for {0}, ObjectID is {1}".format(apkFileName, result.inserted_id))

def _submit_or_print_error(db, uid, apkFileName):
    try:
        submit_job(db, uid, apkFileName)
    except pymongo.errors.DuplicateKeyError:
        print("Analysis for {0} already exists".format(apkFileName))
    except Exception:
        print("Unknown error occurred")
        traceback.print_exc()

if len(sys.argv) < 4:
    print('Usage: {0} web-server-config apk user'.format(sys.argv[0]))
    sys.exit(1)

argServerConfig = sys.argv[1]
argFilename = sys.argv[2]
argUsername = sys.argv[3]

# DB connection
with open(argServerConfig, 'r') as fConf:
    config = json.load(fConf)
client = MongoClient(config['dbHost'], port=config['dbPort'], username=config['dbUser'], password=config['dbPassword'], authSource=config['dbName'])
db = client[config['dbName']]

# Resolve user
user = db.users.find_one({'username': argUsername})
if user is None:
    print('User {0} does not exist.'.format(argUsername))
    client.close()
    sys.exit(1)
uid = user['_id']

try:
    if os.path.isfile(argFilename):
        _submit_or_print_error(db, uid, argFilename)
    else:
        for root, _, files in os.walk(argFilename):
            for fn in files:
                if not fn.endswith('.apk'):
                    continue
                apkFileName = os.path.join(root, fn)
                _submit_or_print_error(db, uid, apkFileName)
finally:
    client.close()
