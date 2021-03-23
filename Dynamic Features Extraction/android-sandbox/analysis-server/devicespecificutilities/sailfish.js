const deviceUtilities = require("../device-utilities");

module.exports.closeAppsGoHome = async (job) => {
	await deviceUtilities.tap(job, [839, 1845]); //Tap recent apps button
	await deviceUtilities.tap(job, [950, 146]); //Tap close all
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	await deviceUtilities.tap(job, [537, 1864]); //Go to primary home screen if not already
}

module.exports.sendSMS = async(job, number, text) => {
	const escapedText = text.replace(/ /g, "\\ ");
	await deviceUtilities.wakeScreen(job);
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	await deviceUtilities.adb(job, "shell am start -a android.intent.action.SENDTO -d sms:" + number + " --es sms_body \"" + escapedText + "\" --ez exit_on_sent true");
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s
	await deviceUtilities.tap(job, [984, 1725]); //Tap send key
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	await module.exports.closeAppsGoHome(job);
}

module.exports.makeCall = async(job, number) => {
	await deviceUtilities.wakeScreen(job);
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	await deviceUtilities.adb(job, "shell am start -a android.intent.action.CALL -d tel:" + number);
	await new Promise(resolve => setTimeout(resolve, 10000)); //Wait 10s
	await deviceUtilities.tap(job, [538, 1614]); //End call
	await module.exports.closeAppsGoHome(job);
}

module.exports.browseURL = async(job, url) => {
	await deviceUtilities.wakeScreen(job);
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	deviceUtilities.openURL(job, url);
	await new Promise(resolve => setTimeout(resolve, 5000)); //Wait 5s
	await module.exports.closeAppsGoHome(job);
}

module.exports.installPackageFromPlayStore = async(job, packageID) => {
	await deviceUtilities.wakeScreen(job);
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s

	await deviceUtilities.openURL(job, "https://play.google.com/store/apps/details?id=" + packageID);
	await new Promise(resolve => setTimeout(resolve, 5000)); //Wait 5s

	await deviceUtilities.tap(job, [900, 600]); //Tap install button
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	let acceptButtonLoc = await deviceUtilities.findColorLocationOnScreen(job, 0x0F9D58FF); //Find accept button (color is 0x0F9D58FF)
	if(acceptButtonLoc != null){
		await deviceUtilities.tap(job, acceptButtonLoc); //Tap accept button
	}
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s
	await module.exports.closeAppsGoHome(job);
}

module.exports.addContact = async(job, firstName, lastName, number) => {
	await deviceUtilities.wakeScreen(job);
	await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s

	await deviceUtilities.tap(job, [143, 440]); //Tap contacts icon
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	await deviceUtilities.tap(job, [966, 1680]); //Tap new contact button
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.typeText(job, firstName);
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.sendKeyEvent(job, deviceUtilities.keycodes.TAB); //Press TAB
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.typeText(job, lastName);
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.sendKeyEvent(job, deviceUtilities.keycodes.TAB); //Press TAB
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.sendKeyEvent(job, deviceUtilities.keycodes.TAB); //Press TAB
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.typeText(job, number);
	await new Promise(resolve => setTimeout(resolve, 250)); //Wait 0.25s

	await deviceUtilities.tap(job, [900, 130]); //Tap save icon
	await new Promise(resolve => setTimeout(resolve, 1000)); //Wait 1s

	await module.exports.closeAppsGoHome(job);
}
