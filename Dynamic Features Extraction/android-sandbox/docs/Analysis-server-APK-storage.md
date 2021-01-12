APK storage is used to store some APKs that are used in the analysis process. Doing so cuts down the system complexity and time to download these APKs from third-party marketplaces like Google Play.

## index.json format

`index.json` is a simple key-value pair that consists the package name and the path to the APK.

```
{
    <package-name>: <path-to-apk-relative-to-storage-root>
}
```

For example,

```
{
    "com.antivirus": "avg.apk",
    "com.bitdefender.security": "bitdefender.apk",
}
```

contains 2 packages, `com.antivirus` and `com.bitdefender.security`, in which the APK file is named `avg.apk` and `bitdefender.apk` respectively.
