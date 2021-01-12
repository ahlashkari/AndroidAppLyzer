## Static and Dynamic Android App Analyzer and Classifier

This research focuses on classifying android samples using static and dynamic analysis. The first version of this package covers the data collection and static feature extraction. The second version will focus on developing a classification model using AI for static features. The third version will add the dynamic analysis module and related features to improve the classifier.
 
This project has been supported by Mitacs Globalink Program (providing a research internship from Tunisia) and Harrison McCain Foundation Young Scholar Awards (providing enough fund for a 4-months coop student). The 200K Android malware samples provided by the Communication Security Establishment (CSE) and the Canadian Center for Cyber Security (CCCS). 

-------------------------------------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------------------------------
## Static Analyzer: 

--> Feature Extraction: The static analysis for android malware detection has proven a very quick and effective way to deal with the code. We extract these static features: permissions, Intents (Actions and Categories), Services, The number of activities, meta-data, Icons, Pictures, audios, videos and the size of the app. Then these features are collected to create a binary vector for each app.
#### Features Extraction is the second step :
We used apktool to reverse engineer the apks, then with the "grep" http://man7.org/linux/man-pages/man1/grep.1.html 
command of shell we extracted the static features from AndroidManifest.xml file, finally a binary vectors with these features are creted 
to each apk.

#### Prerequisites :
Download apktool https://ibotpeaches.github.io/Apktool/

#### Commands to run the scripts :
```
$ sudo; for dir in <Input Folder>/*; do Static_Capturing_Code.sh "$(basename "$dir")" <Output Folder> ;done
$ for i in <Output_Folder>/*/*.txt; do python Create_Unique_Listes.py $i; done
$ for i in <Output_Folder>/*/*.txt; do python Create_Vector.py $i <Output_Folder_1>/; done 
```

---------------------------------------------------------------------------------------------------------------------------------------------------------
## Dynamic Analyzer: 

### Android-Sandbox

### Prerequisite

- Python 3.6+
- NodeJS 12 LTS
- MongoDB

### Installation & Configuration

Download the package at: https://github.com/ahlashkari/AndroidApplyzer.

For installing dependency for analysis server and configuring please refer to [set up guide](docs/Analysis-server-set-up.md).

### Running the analysis server

Execute `npm start` under `android-sandbox/analysis-server`.

### Usage

#### Create new job(s)

```
python android-sandbox/utils/submit-job.py android-sandbox/analysis-server/configuration.json <apk-dir-or-file> <user>
```

#### List jobs that matches a specific state or all jobs at once

```
python android-sandbox/utils/jobtool.py android-sandbox/analysis-server/configuration.json list [state=<error|pending_approval|queued|running|done>] [verbose]
```

#### Show information about a specific job

```
python android-sandbox/utils/jobtool.py android-sandbox/analysis-server/configuration.json info <apk-sha256sum>
```

#### Delete job(s)

```
python android-sandbox/utils/jobtool.py android-sandbox/analysis-server/configuration.json delete <apk-sha256sum|state=<error|pending_approval|queued|running|done>>
```

#### Delete all jobs

```
python android-sandbox/utils/jobtool.py android-sandbox/analysis-server/configuration.json empty
```

#### Use the feature extractor on a single pass of a capture

```
python feature-extractor/parser.py /your/capture/dir/2020_01_01T00_00_00.000Z-package.name-1234abcd..../n-pass <csv-output>
```

`n-pass` will be either `2-before-reboot` or `3-after-reboot`.

### Captured features

#### Memory and Object Statistics

```
Memory_PssTotal
Memory_PssClean
Memory_SharedDirty
Memory_PrivateDirty
Memory_SharedClean
Memory_PrivateClean
Memory_SwapPssDirty
Memory_HeapSize
Memory_HeapAlloc
Memory_HeapFree
Memory_Views
Memory_ViewRootImpl
Memory_AppContexts
Memory_Activities
Memory_Assets
Memory_AssetManagers
Memory_LocalBinders
Memory_ProxyBinders
Memory_ParcelMemory
Memory_ParcelCount
Memory_DeathRecipients
Memory_OpenSSLSockets
Memory_WebViews
```

#### API

```
API_Process_android.os.Process_start
API_Process_android.app.ActivityManager_killBackgroundProcesses
API_Process_android.os.Process_killProcess
API_Command_java.lang.Runtime_exec
API_Command_java.lang.ProcessBuilder_start
API_JavaNativeInterface_java.lang.Runtime_loadLibrary
API_JavaNativeInterface_java.lang.Runtime_load
API_WebView_android.webkit.WebView_loadUrl
API_WebView_android.webkit.WebView_loadData
API_WebView_android.webkit.WebView_loadDataWithBaseURL
API_WebView_android.webkit.WebView_addJavascriptInterface
API_WebView_android.webkit.WebView_evaluateJavascript
API_WebView_android.webkit.WebView_postUrl
API_WebView_android.webkit.WebView_postWebMessage
API_WebView_android.webkit.WebView_savePassword
API_WebView_android.webkit.WebView_setHttpAuthUsernamePassword
API_WebView_android.webkit.WebView_getHttpAuthUsernamePassword
API_WebView_android.webkit.WebView_setWebContentsDebuggingEnabled
API_FileIO_libcore.io.IoBridge_open
API_FileIO_android.content.ContextWrapper_openFileInput
API_FileIO_android.content.ContextWrapper_openFileOutput
API_FileIO_android.content.ContextWrapper_deleteFile
API_Database_android.content.ContextWrapper_openOrCreateDatabase
API_Database_android.content.ContextWrapper_databaseList
API_Database_android.content.ContextWrapper_deleteDatabase
API_Database_android.database.sqlite.SQLiteDatabase_execSQL
API_Database_android.database.sqlite.SQLiteDatabase_deleteDatabase
API_Database_android.database.sqlite.SQLiteDatabase_getPath
API_Database_android.database.sqlite.SQLiteDatabase_insert
API_Database_android.database.sqlite.SQLiteDatabase_insertOrThrow
API_Database_android.database.sqlite.SQLiteDatabase_insertWithOnConflict
API_Database_android.database.sqlite.SQLiteDatabase_openDatabase
API_Database_android.database.sqlite.SQLiteDatabase_openOrCreateDatabase
API_Database_android.database.sqlite.SQLiteDatabase_query
API_Database_android.database.sqlite.SQLiteDatabase_queryWithFactory
API_Database_android.database.sqlite.SQLiteDatabase_rawQuery
API_Database_android.database.sqlite.SQLiteDatabase_rawQueryWithFactory
API_Database_android.database.sqlite.SQLiteDatabase_update
API_Database_android.database.sqlite.SQLiteDatabase_updateWithOnConflict
API_Database_android.database.sqlite.SQLiteDatabase_compileStatement
API_Database_android.database.sqlite.SQLiteDatabase_create
API_IPC_android.content.ContextWrapper_sendBroadcast
API_IPC_android.content.ContextWrapper_sendStickyBroadcast
API_IPC_android.content.ContextWrapper_startActivity
API_IPC_android.content.ContextWrapper_startService
API_IPC_android.content.ContextWrapper_stopService
API_IPC_android.content.ContextWrapper_registerReceiver
API_Binder_android.app.ContextImpl_registerReceiver
API_Binder_android.app.ActivityThread_handleReceiver
API_Binder_android.app.Activity_startActivity
API_Crypto_javax.crypto.spec.SecretKeySpec_$init
API_Crypto_javax.crypto.Cipher_doFinal
API_Crypto-Hash_java.security.MessageDigest_digest
API_Crypto-Hash_java.security.MessageDigest_update
API_DeviceInfo_android.telephony.TelephonyManager_getDeviceId
API_DeviceInfo_android.telephony.TelephonyManager_getSubscriberId
API_DeviceInfo_android.telephony.TelephonyManager_getLine1Number
API_DeviceInfo_android.telephony.TelephonyManager_getNetworkOperator
API_DeviceInfo_android.telephony.TelephonyManager_getNetworkOperatorName
API_DeviceInfo_android.telephony.TelephonyManager_getSimOperatorName
API_DeviceInfo_android.net.wifi.WifiInfo_getMacAddress
API_DeviceInfo_android.net.wifi.WifiInfo_getBSSID
API_DeviceInfo_android.net.wifi.WifiInfo_getIpAddress
API_DeviceInfo_android.net.wifi.WifiInfo_getNetworkId
API_DeviceInfo_android.telephony.TelephonyManager_getSimCountryIso
API_DeviceInfo_android.telephony.TelephonyManager_getSimSerialNumber
API_DeviceInfo_android.telephony.TelephonyManager_getNetworkCountryIso
API_DeviceInfo_android.telephony.TelephonyManager_getDeviceSoftwareVersion
API_DeviceInfo_android.os.Debug_isDebuggerConnected
API_DeviceInfo_android.content.pm.PackageManager_getInstallerPackageName
API_DeviceInfo_android.content.pm.PackageManager_getInstalledApplications
API_DeviceInfo_android.content.pm.PackageManager_getInstalledModules
API_DeviceInfo_android.content.pm.PackageManager_getInstalledPackages
API_Network_java.net.URL_openConnection
API_Network_org.apache.http.impl.client.AbstractHttpClient_execute
API_Network_com.android.okhttp.internal.huc.HttpURLConnectionImpl_getInputStream
API_Network_com.android.okhttp.internal.http.HttpURLConnectionImpl_getInputStream
API_DexClassLoader_dalvik.system.BaseDexClassLoader_findResource
API_DexClassLoader_dalvik.system.BaseDexClassLoader_findResources
API_DexClassLoader_dalvik.system.BaseDexClassLoader_findLibrary
API_DexClassLoader_dalvik.system.DexFile_loadDex
API_DexClassLoader_dalvik.system.DexFile_loadClass
API_DexClassLoader_dalvik.system.DexClassLoader_$init
API_Base64_android.util.Base64_decode
API_Base64_android.util.Base64_encode
API_Base64_android.util.Base64_encodeToString
API_SystemManager_android.app.ApplicationPackageManager_setComponentEnabledSetting
API_SystemManager_android.app.NotificationManager_notify
API_SystemManager_android.telephony.TelephonyManager_listen
API_SystemManager_android.content.BroadcastReceiver_abortBroadcast
API_SMS_android.telephony.SmsManager_sendTextMessage
API_SMS_android.telephony.SmsManager_sendMultipartTextMessage
API_DeviceData_android.content.ContentResolver_query
API_DeviceData_android.content.ContentResolver_registerContentObserver
API_DeviceData_android.content.ContentResolver_insert
API_DeviceData_android.content.ContentResolver_delete
API_DeviceData_android.accounts.AccountManager_getAccountsByType
API_DeviceData_android.accounts.AccountManager_getAccounts
API_DeviceData_android.location.Location_getLatitude
API_DeviceData_android.location.Location_getLongitude
API_DeviceData_android.media.AudioRecord_startRecording
API_DeviceData_android.media.MediaRecorder_start
API_DeviceData_android.os.SystemProperties_get
API_DeviceData_android.app.ApplicationPackageManager_getInstalledPackages
API__sessions
```

### OS-reported Network Statistics

```
Network_TotalReceivedBytes
Network_TotalReceivedPackets
Network_TotalTransmittedBytes
Network_TotalTransmittedPackets
```

#### Battery Usage Estimations

**NOTE**: as the emulator cannot emulate battery, wakelocks and services are used to reflect how the battery usage profile would look like on a real device with a battery.

```
Battery_wakelock
Battery_service
```

#### Logcat entry count

```
Logcat_verbose
Logcat_debug
Logcat_info
Logcat_warning
Logcat_error
Logcat_total
```

### Processes count

```
Process_total
```

------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------

In each folder, there is a ReadMe.md file on how to run the scripts. 

Every script can be used independently.

## Contributors:
* [**Arash Habibi Lashkari:**](https://www.cs.unb.ca/~alashkar/) Founder and Project Leader

* Abir Rahali: Researcher and developer of the Static Analyzer, 
(Supported by Mitacs Globalink Research Internship - https://www.mitacs.ca/en/programs/globalink/globalink-research-internship)

* Beiqi Li: Researcher and developer of the Dynamic Analyzer, 
(Supported by the coop program of the University of New Brunswick (UNB) - https://www.unb.ca/academics/experientialeducation/work-integrated-learning/co-op-internships.html)

* Gurdip Kaur: Researcher (Postdoctorall fellow) 

For testing this package, we used the Androzoo dataset for collecting 200K Benign samples (https://androzoo.uni.lu/) and received 200K malware samples from CSE/CCCS.
Thanks, Francois Gagnon from CSE/CCCS for all his support and help in this part of the project. 

