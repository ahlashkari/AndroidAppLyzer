The Android-Sandbox analysis server is a Node.js application. It acts as the controller for Android devices connected to Android-Sandbox, performing analysis and recovery tasks in parallel.

## Before you begin

In some cases it might be desirable to use a [virtual environment](https://docs.python.org/3/library/venv.html) to manage all the dependencies. Thanks to the awesome `nodeenv` project it is also possible to install the correct version of NodeJS into the virtual environment with just one simple command. Refer to [this guide](./Setting-up-virtualenv.md) for how to set up one that provides both Python and NodeJS environment.

## Prerequisites

### MongoDB

Android-Sandbox uses MongoDB as the backend for storing job states.

To install and configure MongoDB, refer to [MongoDB Installation](https://docs.mongodb.com/manual/installation/). Pick one method that suits your environment best.

For some added security, it is recommended to [set up authentication](https://docs.mongodb.com/manual/tutorial/create-users/) (only username+password is supported by Android-Sandbox). Change the MongoDB port to only listen on localhost might also be desireable if the database runs on the same machine as the analysis server.

### Install Android Studio
The Android-Sandbox analysis server environment requires the Android SDK to be installed, for ADB and emulator use. The best way to do this is through installing [Android Studio](https://developer.android.com/studio/).

It is also possible to use the headless SDK Tools instead. Note that package `platform-tools`, `build-tools;<target-sdk-version>` must be installed via the `sdkmanager` tool for proper operation of analysis server. For a working device emulator `emulator` and the appropriate `system-images;*` and `platforms;*` packages also needs to be installed and at least one emulator profile needs to be set up via `avdmanager create avd`.

### Install Apktool
The Android-Sandbox analysis server environment requires [Apktool](https://ibotpeaches.github.io/Apktool/) for decompiling APK metadata.

### Install DroidBot

To prepare the DroidBot code for Android-Sandbox, first switch to a clean directory, then execute:

```sh
git clone https://github.com/honeynet/droidbot.git
cd droidbot

# The patch was originally based on this commit
git checkout 6153a31c9478dcf581f2871492e37f0ff4b77146
git apply --verbose /path/to/AndroidAppLyzer/Dynamic\ Features\ Extraction/android-sandbox/patches/droidbot/00-retry-logcat-c.diff

# Optional
git commit -am 'Patches for android-sandbox.'
```

A bug in the current release (3.3.5 as of September 8, 2021) of androguard may cause some APKs to not work with DroidBot. ([#662](https://github.com/androguard/androguard/issues/662)) Therefore it's strongly advised to install the master branch of androguard via `pip install -U git+https://github.com/androguard/androguard.git`.

Install the DroidBot with `pip install /path/to/droidbot/source`

### Install required libraries for Python

```
# frida
pip install frida
# pymongo
pip install pymongo
```

### Frida scripts for API capturing
By default Android-Sandbox uses `api_monitor.js` from MobSF for API capturing. The specific version used for the paper is available [here](https://github.com/MobSF/Mobile-Security-Framework-MobSF/blob/595c534576297d30d7b37befda185e1966d085e6/DynamicAnalyzer/tools/frida_scripts/default/api_monitor.js). To use it, download and place it in a directory, then modify `pathFridaScripts` in `configuration.json` so that it points to that directory. Note that loading multiple frida scripts that are placed under the same directory is possible and they will be **concatenated** together before loaded. All the data that are sent via `send()` call from all frida scripts will be logged to the corresponding `api.log` file, which can then be processed by the feature extractor.

### Web server instance

**NOTE**: The web server is not used in the paper and it is currently broken. The following is mostly for the sake of completeness and for future developers who are interested in extending Android-Sandbox.

When running the analysis server with `noWeb` option, web server is not required. Otherwise, follow the [set up an Android-Sandbox web server](./Set-up-web-server) guide to set up the web server.

## Installation
```
cd android-sandbox/analysis-server
npm install
npm run start
```

## Configuration

### Change `configuration.json` parameters
Before continuing, you must [change configuration parameters](./Analysis-server-configuration-parameters) to match your desired configuration.

### Fix udev (for real devices)
You must [fix udev](./Fix-udev) for each device you wish to use.

### Device backup (for real devices)
You must [prepare a device backup](./Creating-a-device-backup) for each device you wish to use.

### Emulator console authentication token (for emulators)
In order to obtain this, start an emulator manually. Then use `telnet localhost <emulator-console-port>` or `nc localhost <emulator-console-port>` to connect to the console. You should then see a hint about the authentication and the path to the `.emulator_console_auth_token` file (e.g. `/home/johndoe/.emulator_console_auth_token`). Open that file and copy-paste the first line to parameter `emulatorConsoleToken` in `android-sandbox/analysis-server/configuration.json`.

### Create a dummy user (if running with `noWeb`)

Assuming the username you wish to use is `nobody`, run

```
python utils/create_dummy_user.py analysis-server/configuration.json nobody
```

This only needs to be done once.
