## Description
All configurable parameters for the analysis server can be found in `android-sandbox/analysis-server/configuration.json` after the server has started for the first time.

## Setting parameters
* You must set the `db` prefixed parameters to match your MongoDB database configuration.
* You must set the `path` prefixed parameters to point to the various described tools, primarily in the Android SDK and Apktool. You can likely find these paths at a directory similar to the default value on your machine.
* You must set `urlWeb` parameter to the URL to the android-sandbox web server instance, ensuring that this URL is reachable by this machine. It should not be suffixed with a forward slash.

## Parameter list
| Parameter | Default value | Description |
|-|-|-|
| `dbHost` | `example.com` | MongoDB host
| `dbPort` | `61337` | MongoDB port (only for old driver)
| `dbUser` | `johndoe` | MongoDB database username
| `dbPassword` | `hunter2` | MongoDB database password 
| `dbReplicaSet` | `replicasetname` | MongoDB replica set (only for new driver)
| `dbName` | `exampledatabase` | MongoDB database name
| `dbNewDriver` | `false` | New driver uses `mongodb+srv://`, old uses `mongodb://`
| `pathTemporary` | `/tmp` | Path for temporary analysis file storage
| `captureOnly` | `true` | Save captures under a dedicated directory instead of the analysis working directory. Useful in standalong mode.
| `pathCapture` | `"/home/johndoe/captures"` | Path to save captures. Only works when `captureOnly` is true.
| `pathAndroidSDK` | `/home/johndoe/Android/Sdk` | Path to Android SDK root
| `pathAAPT` | `/home/johndoe/Android/Sdk/build-tools/27.0.3/aapt` | Path to `aapt` executable
| `pathADB` | `/home/johndoe/Android/Sdk/platform-tools/adb` | Path to `adb` executable
| `pathFastboot` | `/home/johndoe/Android/Sdk/platform-tools/fastboot` | Path to `fastboot` executable
| `pathFridaServer` | `/home/johndoe/android-sandbox-extras/frida-server` | Path to frida-server directory
| `pathAPKTool` | `/home/johndoe/apktool/apktool` | Path to `apktool` executable
| `pathEmulator` | `/home/johndoe/Android/Sdk/emulator/emulator` | Path to AVD `emulator` executable
| `pathFridaScripts` | `/home/johndoe/android-sandbox-extras/frida-scripts` | Path to frida scripts for API capturing
| `pathAPKStore` | `/home/johndoe/android-sandbox-extras/apk` | Path to local apk storage (for antiviruses, etc.)
| `noWeb` | `true` | If set to `true`, the analysis server will run in standadalone mode. All APK samples will be read locally and no result will be uploaded to the web interface.
| `urlWeb` | `https://android-sandbox.example` | URL of web server
| `execMaxBuffer` | `1024000` | Max buffer size (bytes) for exec operations performed during analysis
| `execTimeout` | `300000` | Max time (ms) to wait for an exec operation before considering it failed
| `startPackageWaitTime` | `10000` | Time (ms) to wait after starting a package on a device
| `deleteAnalysisDir` | `true` | If `true`, analyses temporary folders are deleted from `pathTemporary` after analyses completes
| `emulatorConsoleToken` | `""` | Token for the AVD emulator console. Must match the value in the `.emulator_console_auth_token` file
| `hideEmulatorWindow` | `true` | Whether or not to hide the emulator GUI (does nothing if `emulator/emulator-headless` is used instead, which does not have the GUI)
| `droidBotEventCount` | `100` | Maximum droidbot events
| `droidBotTimeout` | `180` | Maximum droidbot execution time (in seconds)
| `droidBotFailsafeTimeout` | `200` | Timeout before terminating droidbot (in seconds)
| `behaviorCapture` | `"frida"` | Set behavior capture mathod (either "frida" or "syscall". "syscall" is not throughly tested and unused in our study)
| `noConsole` | `true` | If set to `true`, start the analysis server without the interactive console (i.e. logs only)
