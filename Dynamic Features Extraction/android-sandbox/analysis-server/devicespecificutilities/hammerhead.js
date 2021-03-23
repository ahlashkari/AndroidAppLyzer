const deviceUtilities = require("../device-utilities");

module.exports.closeAppsGoHome = async (job) => {
    deviceUtilities.closeAppsByActiveWindow(job, [
        "com.android.systemui", // System UI
        "com.google.android.googlequicksearchbox", // Google Search Widget
        job.packageName // AUT so we don't need to attach frida again
    ]);
    // Press the home key
    await deviceUtilities.sendKeyEvent(job, deviceUtilities.keycodes.HOME);
}

module.exports.sendSMS = async(job, number, text) => {
    // TODO
}

module.exports.makeCall = async(job, number) => {
    // TODO
}

module.exports.browseURL = async(job, url) => {
    await deviceUtilities.wakeScreen(job);
    await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
    await deviceUtilities.openURL(job, url);
    await new Promise(resolve => setTimeout(resolve, 5000)); //Wait 5s
    await module.exports.closeAppsGoHome(job);
}

module.exports.installPackageFromPlayStore = async(job, packageID) => {
    // TODO
}

module.exports.addContact = async(job, firstName, lastName, number) => {
    // TODO
}