const fs = require("fs");
const chalk = require("chalk");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const rulePath = "/etc/udev/rules.d/51-android.rules";

const getVendorID = (deviceString) => {
	return deviceString.substr(23, 4);
}

const arrayDifference = (arr1, arr2) => {
	return arr1.filter((ind) => {return arr2.indexOf(ind) < 0});
}

const removeDuplicates = (arr) => {
	return arr.filter(function(item, pos, self) { //Thanks https://stackoverflow.com/a/9229821/3894173
		return self.indexOf(item) == pos;
	});
}

const getDevices = async() => {
	const output = await exec("lsusb");
	const lines = output.stdout.split("\n").filter(elem => elem);
	return lines;
}

const getExistingVendors = () => {
	let ruleData = "";
	try{
		ruleData = fs.readFileSync(rulePath, "utf8");
	}catch(e){
		fs.writeFileSync(rulePath, "");
	}
	return ruleData.split("\n")
		.filter(rule => rule)
		.map(
			rule => rule.split("}==\"")[1].substr(0, 4)
		);
}

const writeNewVendor = (vendorID) => {
	fs.appendFileSync(rulePath, "\nSUBSYSTEM==\"usb\", ATTR{idVendor}==\"" + vendorID + "\", MODE=\"0666\", GROUP=\"plugdev\"");
}

const restartUdev = async () => {
	await exec("service udev restart");
}

const clearLog = (text) => {
	process.stdout.write("\033c");
	console.log(text);
}

const fixProcedure = async () => {
	clearLog("Make sure the device(s) are disconnected, then press any key...");
	await new Promise(resolve => process.stdin.once("data", resolve));
	clearLog("Please wait...");
	await new Promise(resolve => setTimeout(resolve, 2000));
	const initialDevices = await getDevices();

	clearLog("Connect the device(s), then press any key...");
	await new Promise(resolve => process.stdin.once("data", resolve));
	clearLog("Please wait...");
	await new Promise(resolve => setTimeout(resolve, 2000));
	const finalDevices = await getDevices();

	const foundDevices = arrayDifference(finalDevices, initialDevices);

	if(foundDevices.length === 0){
		clearLog(chalk.red("No devices found! Try again."));
		process.exit(0);
	}

	const foundVendors = foundDevices.map(device => getVendorID(device));
	const existingVendors = getExistingVendors();

	const newVendors = removeDuplicates(arrayDifference(foundVendors, existingVendors));

	if(newVendors.length === 0){
		clearLog(chalk.red(foundVendors.length + " existing vendors found, none to add!"));
		process.exit(0);
	}

	clearLog("Found new vendor(s):");
	for(let i = 0; i < newVendors.length; i++){
		console.log(chalk.magenta(newVendors[i]));
	}

	console.log("\nIf you would like to add these vendors, press any key... Otherwise, CTRL+C!");
	await new Promise(resolve => process.stdin.once("data", resolve));

	clearLog("Adding vendors:");
	for(let i = 0; i < newVendors.length; i++){
		writeNewVendor(newVendors[i]);
		console.log(chalk.magenta(newVendors[i]));
	}

	await restartUdev();

	console.log(chalk.green("\nDone! Ensure you disconnect and reconnect the device(s) before use."));

	process.exit(0);
}

fixProcedure();