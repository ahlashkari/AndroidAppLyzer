#!/usr/bin/env python3

import json
import sys

import pymongo

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage {} <web-or-analysis-server-config>'.format(sys.argv[0]))
        sys.exit(1)

    with open(sys.argv[1], 'r') as f:
        config = json.load(f)

    client = pymongo.MongoClient(
        config['dbHost'],
        port=config['dbPort'],
        username=config['dbUser'],
        password=config['dbPassword'],
        authSource=config['dbName'],
        serverSelectionTimeoutMS=60*1000
    )
    while True:
        try:
            # https://api.mongodb.com/python/current/api/pymongo/mongo_client.html#pymongo.mongo_client.MongoClient
            client.admin.command('ismaster')
        except pymongo.errors.ConnectionFailure:
            print('Timeout waiting for database to be available')
            client.close()
            sys.exit(1)
        else:
            print('Database is available')
            client.close()
            sys.exit(0)
