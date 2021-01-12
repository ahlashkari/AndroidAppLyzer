const deviceUtilities = require("../device-utilities");

module.exports.closeAppsGoHome = async (job) => {
    //deviceUtilities.closeAppsByActiveWindow(job, [
    //    "com.android.systemui", // System UI
    //    "com.google.android.apps.nexuslauncher", // Launcher window
    //    job.packageName // AUT so we don't need to attach frida again.
    //]);
    // Press the home key
    await deviceUtilities.sendKeyEvent(job, deviceUtilities.keycodes.HOME);
}

module.exports.sendSMS = async(job, number, text) => {
	await deviceUtilities.wakeScreen(job);
    await deviceUtilities.sendSMS(job, number, text);
	await module.exports.closeAppsGoHome(job);
}

module.exports.makeCall = async(job, number) => {
	await deviceUtilities.wakeScreen(job);
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	await deviceUtilities.adb(job, ["shell", "am", "start", "-a", "android.intent.action.CALL", "-d" ,"tel:" + number]);
	await new Promise(resolve => setTimeout(resolve, 10000)); //Wait 10s
	await deviceUtilities.sendKeyEvent(job, "KEYCODE_ENDCALL") //End call
	await module.exports.closeAppsGoHome(job);
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

// module.exports.addContact = async(job, firstName, lastName, number) => {
//     await deviceUtilities.wakeScreen(job);
//     await deviceUtilities.adb(job, [
//         'shell',
//         'am', 'start', '-a', 'android.intent.action.INSERT',
//         '-t', 'vnd.android.cursor.dir/contact',
//         '-e', 'name', deviceUtilities.quoteString(firstName + ' ' + lastName),
//         '-e', 'phone', deviceUtilities.quoteString(number)
//     ]);
//     await new Promise(resolve => setTimeout(resolve, 1000)); //Wait 1s
//     await deviceUtilities.sendKeyEvent(job, 'KEYCODE_BACK');
//     await deviceUtilities.sendKeyEvent(job, 'KEYCODE_BACK');
// }

module.exports.importVCard = async function (job, vcfPath) {
    await deviceUtilities.wakeScreen(job);
    await deviceUtilities.adb(job, ['push', vcfPath, '/data/local/tmp/contacts.vcf']);
    await deviceUtilities.grantSdk23Permission(job, 'com.android.contacts', 'android.permission.READ_EXTERNAL_STORAGE');
    await deviceUtilities.adb(job, [
		"shell",
		"am", "start",
		"-a", "android.intent.action.VIEW",
        "-d", "file:///data/local/tmp/contacts.vcf",
        "-t", "text/x-vcard",
        "com.android.contacts"
    ]);
    await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	await deviceUtilities.sendKeyEvent(job, 'KEYCODE_TAB');
    await new Promise(resolve => setTimeout(resolve, 200)); //Wait 0.2s
    await deviceUtilities.sendKeyEvent(job, 'KEYCODE_TAB');
    await new Promise(resolve => setTimeout(resolve, 200)); //Wait 0.2s
	await deviceUtilities.sendKeyEvent(job, 'KEYCODE_ENTER');
}