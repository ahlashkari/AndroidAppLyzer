/*
[x] Send message
[x] Make call
[x] Enable GPS
[x] Browse internet
[ ] Click/follow popup
[x] Save more than 10 contacts in the contact list
[x] Save >10kB internal/external (jpeg, jpg, png, bmp, gif, pdf, doc, docx, txt, avi, mkv, 3gp, mp4)
[x] Install AV (AVG, Avast, BitDefender)
[x] Put the app in background
*/

const fs = require('fs');
const path = require('path');
const faker = require("faker/locale/en");
const VCard = require("vcards-js");

const deviceUtilities = require("../device-utilities");

module.exports = async (job) => {
	const deviceSpecificUtilities = require("../devicespecificutilities/" + (job.device.product.startsWith('emulator-') ? 'emulator' : job.device.product));

	const sessionUtilities = Object.assign({}, deviceUtilities, deviceSpecificUtilities);

	const phoneNumber = "5065550129"; //TODO: change this, who are we calling?

	job.device.log("Scenario: Going home...");
	await sessionUtilities.closeAppsGoHome(job); //Go to default home screen if not already there
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	job.device.log("Scenario: Making call...");
	await sessionUtilities.makeCall(job, phoneNumber);
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	job.device.log("Scenario: Sending SMS...");
	const smsText = faker.lorem.sentence(Math.floor(Math.random()*15) + 1);
	await sessionUtilities.sendSMS(job, phoneNumber, smsText);
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	job.device.log("Scenario: Disabling GPS...");
	await sessionUtilities.setGPSStatus(job, false);
	await new Promise(resolve => setTimeout(resolve, 5000)); //Wait 5s

	job.device.log("Scenario: Enabling GPS...");
	await sessionUtilities.setGPSStatus(job, true);
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	job.device.log("Scenario: Browsing the web...");
	const websites = ["https://google.com", "https://facebook.com", "https://twitter.com", "https://amazon.com", "https://yahoo.com"];
	await sessionUtilities.browseURL(job, websites[Math.floor(Math.random()*websites.length)]);
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s

	job.device.log("Scenario: Adding 3 contacts...");
	let entry = null;
	const vcfPath = path.join(job.temporaryPath, 'contacts.vcf');
	const vcf = fs.createWriteStream(vcfPath);
	for(let i = 0; i < 3; i++){
		entry = VCard();
		entry.firstName = faker.name.firstName();
		entry.lastName = faker.name.lastName();
		entry.cellPhone = faker.phone.phoneNumberFormat();
		vcf.write(entry.getFormattedString());
	}
	vcf.end();
	await sessionUtilities.importVCard(job, vcfPath);
	await new Promise(resolve => setTimeout(resolve, 1000)); //Wait 1s

	job.device.log("Scenario: Making dummy files...");
	const dummyFiletypes = ["jpeg", "jpg", "png", "bmp", "gif", "pdf", "doc", "docx", "txt", "avi", "mkv", "3gp", "mp4"];
	await sessionUtilities.adb(job, 'shell mkdir -p /sdcard/dummyfiles');
	for(let i = 0; i < dummyFiletypes.length; i++){
		await sessionUtilities.makeDummyFile(job, "/sdcard/dummyfiles/" + faker.lorem.word() + "." + dummyFiletypes[i], (10*1024) + Math.floor(Math.random()*1024));
		await new Promise(resolve => setTimeout(resolve, 500)); //Wait 0.5s
	}

	job.device.log("Scenario: Installing an antivirus...");
	const antivirusPackages = ["com.antivirus", "com.avast.android.mobilesecurity", "com.bitdefender.security"];
	await sessionUtilities.installPackageFromLocalStore(job, antivirusPackages[Math.floor(Math.random()*antivirusPackages.length)]);
	await new Promise(resolve => setTimeout(resolve, 2000)); //Wait 2s
}
