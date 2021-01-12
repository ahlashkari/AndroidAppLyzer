## Analysis

| Field | Type | Description |
|-|-|-|
| `_id` | `ObjectId` | The MongoDB ID for the analysis |
| `sha256` | `String` | The SHA-256 hash of the analysis file |
| `sha1` | `String` | The SHA-1 hash of the analysis file |
| `md5` | `String` | The MD5 hash of the analysis file |
| `path` | `String` | The path to the APK file |
| `fileName` | `String` | The original file name |
| `packageName` | `String` | The extracted APK package name |
| `permissions` | `Object` | The extracted permission data |
| `batteryCSV` | `Array` | The static analysis battery data |
| `intentCSV` | `Array` | The static analysis intent data |
| `permCSV` | `Array` | The static analysis permission data |
| `screenshotPath` | `String` | The path to the screenshot |
| `deviceType` | `String` | The type of device used to analyse the sample |
| `family` | `String` | The associated malware family |
| `category` | `String` | The associated malware category |
| `owner` | `ObjectId` | The user who originally created the analysis |
| `state` | `Number` | The state of the analysis, detailed below |
| `error` | `String` | The error associated with the analysis, if one was thrown |

Analysis state is described as below.

| State | Description |
|-|-|
| `0` | Error |
| `1` | Awaiting approval |
| `2` | Queued |
| `3` | In progress |
| `4` | Completed |

## User

| Field | Type | Description |
|-|-|-|
| `_id` | `ObjectId` | The MongoDB ID for the user |
| `email` | `String` | The users email |
| `username` | `String` | The users username |
| `tags` | `Array` | The users tags, detailed below |
| `salt` | `String` | The password PBKDF2 salt |
| `hash` | `String` | The password PBKDF2 key |

Users can contain multiple string tags, each signifying a different property about the user.

| Tag | Description |
|-|-|
| `administrator` | The user can perform administrative actions
| `banned` | The user cannot log-in