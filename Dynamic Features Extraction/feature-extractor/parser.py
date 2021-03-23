#!/usr/bin/env python3
import re
import enum
import json
import os
import sys
import csv
import itertools


class MemoryFeatureEntry(enum.IntEnum):
    PssTotal = 1
    PssClean = 2
    SharedDirty = 3
    PrivateDirty = 4
    SharedClean = 5
    PrivateClean = 6
    SwapPssDirty = 7
    HeapSize = 8
    HeapAlloc = 9
    HeapFree = 10


class ObjectCountEntry(enum.IntEnum):
    Views = 1
    ViewRootImpl = 2
    AppContexts = 3
    Activities = 4
    Assets = 5
    AssetManagers = 6
    LocalBinders = 7
    ProxyBinders = 8
    ParcelMemory = 9
    ParcelCount = 10
    DeathRecipients = 11
    OpenSSLSockets = 12
    WebViews = 13


class NetworkTrafficCountEntry(enum.IntEnum):
    TotalReceivedBytes = 1
    TotalReceivedPackets = 2
    TotalTransmittedBytes = 3
    TotalTransmittedPackets = 4


API_FEAURES = (
    "Process_android.os.Process_start",
    "Process_android.app.ActivityManager_killBackgroundProcesses",
    "Process_android.os.Process_killProcess",
    "Command_java.lang.Runtime_exec",
    "Command_java.lang.ProcessBuilder_start",
    "JavaNativeInterface_java.lang.Runtime_loadLibrary",
    "JavaNativeInterface_java.lang.Runtime_load",
    "WebView_android.webkit.WebView_loadUrl",
    "WebView_android.webkit.WebView_loadData",
    "WebView_android.webkit.WebView_loadDataWithBaseURL",
    "WebView_android.webkit.WebView_addJavascriptInterface",
    "WebView_android.webkit.WebView_evaluateJavascript",
    "WebView_android.webkit.WebView_postUrl",
    "WebView_android.webkit.WebView_postWebMessage",
    "WebView_android.webkit.WebView_savePassword",
    "WebView_android.webkit.WebView_setHttpAuthUsernamePassword",
    "WebView_android.webkit.WebView_getHttpAuthUsernamePassword",
    "WebView_android.webkit.WebView_setWebContentsDebuggingEnabled",
    "FileIO_libcore.io.IoBridge_open",
    "FileIO_android.content.ContextWrapper_openFileInput",
    "FileIO_android.content.ContextWrapper_openFileOutput",
    "FileIO_android.content.ContextWrapper_deleteFile",
    "Database_android.content.ContextWrapper_openOrCreateDatabase",
    "Database_android.content.ContextWrapper_databaseList",
    "Database_android.content.ContextWrapper_deleteDatabase",
    "Database_android.database.sqlite.SQLiteDatabase_execSQL",
    "Database_android.database.sqlite.SQLiteDatabase_deleteDatabase",
    "Database_android.database.sqlite.SQLiteDatabase_getPath",
    "Database_android.database.sqlite.SQLiteDatabase_insert",
    "Database_android.database.sqlite.SQLiteDatabase_insertOrThrow",
    "Database_android.database.sqlite.SQLiteDatabase_insertWithOnConflict",
    "Database_android.database.sqlite.SQLiteDatabase_openDatabase",
    "Database_android.database.sqlite.SQLiteDatabase_openOrCreateDatabase",
    "Database_android.database.sqlite.SQLiteDatabase_query",
    "Database_android.database.sqlite.SQLiteDatabase_queryWithFactory",
    "Database_android.database.sqlite.SQLiteDatabase_rawQuery",
    "Database_android.database.sqlite.SQLiteDatabase_rawQueryWithFactory",
    "Database_android.database.sqlite.SQLiteDatabase_update",
    "Database_android.database.sqlite.SQLiteDatabase_updateWithOnConflict",
    "Database_android.database.sqlite.SQLiteDatabase_compileStatement",
    "Database_android.database.sqlite.SQLiteDatabase_create",
    "IPC_android.content.ContextWrapper_sendBroadcast",
    "IPC_android.content.ContextWrapper_sendStickyBroadcast",
    "IPC_android.content.ContextWrapper_startActivity",
    "IPC_android.content.ContextWrapper_startService",
    "IPC_android.content.ContextWrapper_stopService",
    "IPC_android.content.ContextWrapper_registerReceiver",
    "Binder_android.app.ContextImpl_registerReceiver",
    "Binder_android.app.ActivityThread_handleReceiver",
    "Binder_android.app.Activity_startActivity",
    "Crypto_javax.crypto.spec.SecretKeySpec_$init",
    "Crypto_javax.crypto.Cipher_doFinal",
    "Crypto-Hash_java.security.MessageDigest_digest",
    "Crypto-Hash_java.security.MessageDigest_update",
    "DeviceInfo_android.telephony.TelephonyManager_getDeviceId",
    "DeviceInfo_android.telephony.TelephonyManager_getSubscriberId",
    "DeviceInfo_android.telephony.TelephonyManager_getLine1Number",
    "DeviceInfo_android.telephony.TelephonyManager_getNetworkOperator",
    "DeviceInfo_android.telephony.TelephonyManager_getNetworkOperatorName",
    "DeviceInfo_android.telephony.TelephonyManager_getSimOperatorName",
    "DeviceInfo_android.net.wifi.WifiInfo_getMacAddress",
    "DeviceInfo_android.net.wifi.WifiInfo_getBSSID",
    "DeviceInfo_android.net.wifi.WifiInfo_getIpAddress",
    "DeviceInfo_android.net.wifi.WifiInfo_getNetworkId",
    "DeviceInfo_android.telephony.TelephonyManager_getSimCountryIso",
    "DeviceInfo_android.telephony.TelephonyManager_getSimSerialNumber",
    "DeviceInfo_android.telephony.TelephonyManager_getNetworkCountryIso",
    "DeviceInfo_android.telephony.TelephonyManager_getDeviceSoftwareVersion",
    "DeviceInfo_android.os.Debug_isDebuggerConnected",
    "DeviceInfo_android.content.pm.PackageManager_getInstallerPackageName",
    "DeviceInfo_android.content.pm.PackageManager_getInstalledApplications",
    "DeviceInfo_android.content.pm.PackageManager_getInstalledModules",
    "DeviceInfo_android.content.pm.PackageManager_getInstalledPackages",
    "Network_java.net.URL_openConnection",
    "Network_org.apache.http.impl.client.AbstractHttpClient_execute",
    "Network_com.android.okhttp.internal.huc.HttpURLConnectionImpl_getInputStream",
    "Network_com.android.okhttp.internal.http.HttpURLConnectionImpl_getInputStream",
    "DexClassLoader_dalvik.system.BaseDexClassLoader_findResource",
    "DexClassLoader_dalvik.system.BaseDexClassLoader_findResources",
    "DexClassLoader_dalvik.system.BaseDexClassLoader_findLibrary",
    "DexClassLoader_dalvik.system.DexFile_loadDex",
    "DexClassLoader_dalvik.system.DexFile_loadClass",
    "DexClassLoader_dalvik.system.DexClassLoader_$init",
    "Base64_android.util.Base64_decode",
    "Base64_android.util.Base64_encode",
    "Base64_android.util.Base64_encodeToString",
    "SystemManager_android.app.ApplicationPackageManager_setComponentEnabledSetting",
    "SystemManager_android.app.NotificationManager_notify",
    "SystemManager_android.telephony.TelephonyManager_listen",
    "SystemManager_android.content.BroadcastReceiver_abortBroadcast",
    "SMS_android.telephony.SmsManager_sendTextMessage",
    "SMS_android.telephony.SmsManager_sendMultipartTextMessage",
    "DeviceData_android.content.ContentResolver_query",
    "DeviceData_android.content.ContentResolver_registerContentObserver",
    "DeviceData_android.content.ContentResolver_insert",
    "DeviceData_android.content.ContentResolver_delete",
    "DeviceData_android.accounts.AccountManager_getAccountsByType",
    "DeviceData_android.accounts.AccountManager_getAccounts",
    "DeviceData_android.location.Location_getLatitude",
    "DeviceData_android.location.Location_getLongitude",
    "DeviceData_android.media.AudioRecord_startRecording",
    "DeviceData_android.media.MediaRecorder_start",
    "DeviceData_android.os.SystemProperties_get",
    "DeviceData_android.app.ApplicationPackageManager_getInstalledPackages",
)


BATTERY_FEATURES = ('wakelock', 'service',)

LOGCAT_LEVELS = {
    'V': 'verbose',
    'D': 'debug',
    'I': 'info',
    'W': 'warning',
    'E': 'error',
}

RE_MEMORY = re.compile(r'\s+TOTAL' + 10 * r'\s+(\d+)')
RE_OBJS = re.compile(r'\sObjects\n'
                     r'\s+Views:\s+(\d+)\s+ViewRootImpl:\s+(\d+)\n'
                     r'\s+AppContexts:\s+(\d+)\s+Activities:\s+(\d+)\n'
                     r'\s+Assets:\s+(\d+)\s+AssetManagers:\s+(\d+)\n'
                     r'\s+Local Binders:\s+(\d+)\s+Proxy Binders:\s+(\d+)\n'
                     r'\s+Parcel memory:\s+(\d+)\s+Parcel count:\s+(\d+)\n'
                     r'\s+Death Recipients:\s+(\d+)\s+OpenSSL Sockets:\s+(\d+)\n'
                     r'\s+WebViews:\s+(\d+)')
RE_USERNAME = re.compile(r'^u(\d+)a(\d+)$')
RE_USERNAME_TAG = re.compile(r'^  u\d+a\d+:$')
RE_NETWORK_UID_SET = re.compile(r'\suid=(\d+)\sset=([A-Z]+)\s')
RE_NETWORK_STATS_PER_BUCKET = re.compile(r'^st=(?:\d+)\srb=(\d+)\srp=(\d+)\stb=(\d+)\stp=(\d+)\sop=(?:\d+)$')
RE_ID = re.compile(r'^u\d+_a\d+$')
RE_SERVICE_APK_TEMPLATE = r'^    Apk {escaped_package_name}:$'
# This does not verify the header strictly.
RE_LOGCAT_ENTRY_HEADER = re.compile(r'^\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\s+\d+\s+\d+\s+([VDIWE])\s')

def count_wakelock_service(batterystats, username, package_name):
    if RE_USERNAME.match(username) is None:
        raise ValueError('Username must be in the format of u?a?')
    _username_tag = '  {}:'.format(username)
    capture = False
    in_service = False
    counts = dict()
    counts['Battery_wakelock'] = 0
    counts['Battery_service'] = 0
    re_service_apk = re.compile(RE_SERVICE_APK_TEMPLATE.format(escaped_package_name=re.escape(package_name)))
    for line in batterystats:
        indent = len(line) - len(line.lstrip())
        line_with_indent = line.rstrip()
        if line_with_indent == _username_tag:
            capture = True
        elif capture and RE_USERNAME_TAG.match(line_with_indent) is not None:
            capture = False
        elif capture:
            if in_service and indent <= 4:
                in_service = False
            if line_with_indent.startswith('    Wake lock '):
                counts['Battery_wakelock'] += 1
            elif re_service_apk.match(line_with_indent) is not None:
                in_service = True
            elif in_service and line_with_indent.startswith('      Service'):
                counts['Battery_service'] += 1
    return counts

def count_memory_object(meminfo):
    raw = meminfo.read()
    m_memory_info = RE_MEMORY.search(raw)
    m_obj_count = RE_OBJS.search(raw)

    memory_info = {'Memory_{}'.format(i.name): int(m_memory_info.group(i)) for i in MemoryFeatureEntry}
    obj_count = {'Memory_{}'.format(i.name): int(m_obj_count.group(i)) for i in ObjectCountEntry}
    return memory_info, obj_count

def count_api_frequency(apilog):
    restart = False
    # Initialize counter fields
    counts = {'API_{}'.format(f): 0 for f in API_FEAURES}
    counts['API__sessions'] = 0
    for line in apilog:
        line = line.strip()
        if (line == '#NEW SESSION#' or line.startswith('[API Monitor] ')) and not restart:
            restart = True
        elif line.startswith('MobSF-API-Monitor: {') and line.endswith('},'):
            if restart:
                counts['API__sessions'] += 1
                restart = False
            entry = json.loads(line[19:-1])
            entry_name = '_'.join(('API', entry['name'].replace(' ', ''), entry['class'], entry['method']))
            if entry_name not in counts:
                print('WARNING: Excluding unknown feature', entry_name)
            else:
                counts[entry_name] += 1
    return counts

def count_network_traffic(networkusage, username):
    parsed_username = RE_USERNAME.match(username)
    if parsed_username is None:
        raise ValueError('Username must be in the format of u?a?')
    uid = int(parsed_username.group(1)) * 100000 + 10000 + int(parsed_username.group(2))
    capture = False
    in_uid_stats = False
    match_set = None
    in_counts = False
    counts = {'Network_{}'.format(i.name): 0 for i in NetworkTrafficCountEntry}

    for line in networkusage:
        indent = len(line) - len(line.lstrip())
        line = line.strip()

        # Exit conditions for:
        ## Bucket data -> bucket header
        if indent < 6 and in_counts:
            in_counts = False
        ## Bucket header -> Monitor instance header
        if indent < 4 and match_set is not None:
            match_set = None
        ## Monitor instance header -> Stats tag
        if indent < 2 and in_uid_stats:
            in_uid_stats = False

        # Enter conditions for:
        ## <something> Stats tag -> Monitor instance header
        if indent == 0 and line == 'UID stats:':
            # Matches UID stats header and set `in_uid_stats` flag
            in_uid_stats = True
        ## Per-user per-network monitor instance header (ident=... uid=...) -> Bucket header
        elif indent == 2 and in_uid_stats and line.startswith('ident=[{') and match_set is None:
            # Sets `match_set` if the line starts with 'ident=[{' and UID matches. Clears `match_set` otherwise.
            uid_set = RE_NETWORK_UID_SET.search(line)
            if uid_set is not None and int(uid_set.group(1)) == uid:
                match_set = uid_set.group(2)
                if match_set not in ('DEFAULT', 'FOREGROUND'):
                    print('WARNING: Unknown network traffic set', match_set)
                    match_set = None
        ## Bucket header (NetworkStatsHistory: bucketDuration=...) -> Bucket data
        elif indent == 4 and match_set is not None and line.startswith('NetworkStatsHistory: bucketDuration='):
            in_counts = True
        ## Bucket data
        elif indent == 6 and in_counts:
            stats_per_bucket = RE_NETWORK_STATS_PER_BUCKET.match(line)
            for i in NetworkTrafficCountEntry:
                counts['Network_{}'.format(i.name)] += int(stats_per_bucket.group(int(i)))
    return counts

def count_logcat_entries(logcat_files):
    counter = {'Logcat_{}'.format(e): 0 for e in LOGCAT_LEVELS.values()}
    counter['Logcat_total'] = 0
    for logcat in logcat_files:
        for line in logcat:
            m = RE_LOGCAT_ENTRY_HEADER.match(line)
            if m is not None:
                counter['Logcat_total'] += 1
                counter['Logcat_{}'.format(LOGCAT_LEVELS[m.group(1)])] += 1
    return counter

def count_lines(list_file, entry_name, header_size=0):
    return {entry_name: sum(1 for _ in list_file) - header_size}

def read_id(id_):
    fields = id_.read().strip().split()
    if len(fields) == 9 and RE_ID.match(fields[0]) is not None:
        return fields[0].replace('_', ''), fields[8]
    else:
        return None, None

def to_csv(outfile, header, dict_):
    writer = csv.DictWriter(outfile, fieldnames=header)
    writer.writeheader()
    writer.writerow(dict_)

def extract_all_dynamic_features(analysis_dir, output_file):
    # Read username and package name
    with open(os.path.join(analysis_dir, 'id'), 'r') as f:
        username, package_name = read_id(f)
        if username is None or package_name is None:
            raise RuntimeError('ID file does not contain valid username')
    header_memory = ('Memory_{}'.format(e.name) for e in itertools.chain(MemoryFeatureEntry, ObjectCountEntry))
    header_api = ('API_{}'.format(e) for e in itertools.chain(API_FEAURES, ('_sessions',)))
    header_network = ('Network_{}'.format(e.name) for e in NetworkTrafficCountEntry)
    header_battery = ('Battery_{}'.format(e) for e in BATTERY_FEATURES)
    header_logcat = ('Logcat_{}'.format(e) for e in itertools.chain(LOGCAT_LEVELS.values(), ('total',)))
    header_process = ('Process_total', )

    all_features = {}
    # Dump memory usage and object count features
    with open(os.path.join(analysis_dir, 'all.ramUsage')) as fin:
        meminfo, objinfo = count_memory_object(fin)
        all_features.update(meminfo)
        all_features.update(objinfo)
    # Dump API features
    with open(os.path.join(analysis_dir, 'api.log')) as fin:
        all_features.update(count_api_frequency(fin))
    # Dump network features
    with open(os.path.join(analysis_dir, 'networkUsage')) as fin:
        all_features.update(count_network_traffic(fin, username))
    # Dump "batery usage" (count of wakelocks and services) features
    with open(os.path.join(analysis_dir, 'battery')) as fin:
        all_features.update(count_wakelock_service(fin, username, package_name))
    # Dump logcat counts
    with open(os.path.join(analysis_dir, 'adb.log'), 'r') as logcat_after_boot, open(os.path.join(analysis_dir, 'droidbot', 'logcat.txt'), 'r') as logcat_droidbot:
        all_features.update(count_logcat_entries((logcat_after_boot, logcat_droidbot)))
    # Count number of processes running on the Android environment
    with open(os.path.join(analysis_dir, 'processes'), 'r') as fin:
        all_features.update(count_lines(fin, 'Process_total', 1))
    # Write CSV file
    with open(output_file, 'w') as fout:
        to_csv(fout, tuple(itertools.chain(header_memory, header_api, header_network, header_battery, header_logcat, header_process)), all_features)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: {} analysis-step-dir csv-file'.format(sys.argv[0]))
        sys.exit(1)
    extract_all_dynamic_features(sys.argv[1], sys.argv[2])
