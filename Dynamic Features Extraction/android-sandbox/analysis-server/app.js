const chalk = require('chalk');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const uuidv4 = require('uuid/v4');
const events = require('events');
const del = require('del');

const config = require('./config');

const vorpal = config.noConsole ? console : require('@moleculer/vorpal')();

require('./connections/db')(vorpal);

let devices = [];
let jobs = []; //In-memory analysis queue
let verboseQueue = false;

const Analysis = require('./models/Analysis');

const devUtil = require('./device-utilities');
const analysisPipeline = require('./analysis-pipeline');
const provisionEmulator = require("./provision-emulator");

const changePipeline = [{
	$match: {
		'fullDocument.state': 2 //Only match queued documents
	}
}];

const updateJobList = async () => {
	// Stop taking new jobs if there's more than 10 jobs queued
	if (jobs.length >= 10) return;
	Analysis.find({state: 2}).limit(10).exec(function (err, analyses) { //Find queued jobs
		for(let remoteIndex = 0; remoteIndex < analyses.length; remoteIndex++){
			let found = false;
			if (jobs.length >= 10) return;
			for(let localIndex = 0; localIndex < jobs.length; localIndex++){
				if(analyses[remoteIndex].sha256 === jobs[localIndex].sha256){ //If the job is already in-memory, skip it
					found = true;
					break;
				}
			}
			if(!found) createJob(analyses[remoteIndex]); //Otherwise, queue it
		}
	});
}

const createJob = async (analysisDocument) => {
	const job = {
		uuid: uuidv4(),
		sha256: analysisDocument.sha256,
		sha1: analysisDocument.sha1,
		md5: analysisDocument.md5,
		state: analysisDocument.state,
		deviceType: analysisDocument.deviceType,
		event: new events.EventEmitter()
	};
	if (config.noWeb) {
		job.apkPath = analysisDocument.path;
	}
	await queueJob(job);
	startPendingJob(); //Give the opportunity for jobs to immediately start executing if a device is available
}

const getAvailableDevice = async (deviceType) => {
	if(deviceType === "emulator") return await provisionEmulator(vorpal); //TODO: don't pass vorpal, make a device class
	for(let i = 0; i < devices.length; i++){
		const device = devices[i];
		if(device.available && device.enabled){
			return device;
		}
	}
	return null;
}

const getPendingJob = async() => {
	for(let i = 0; i < jobs.length; i++){
		const job = jobs[i];
		if(job.state == 2){
			return job;
		}
	}
	return null;
}

const startPendingJob = async() => {
	await updateJobList();
	await updateDeviceList();

	const job = await getPendingJob();
	if(!job) return;

	job.state = 3; //Set the job state to in-progress to prevent race conditions with multiple calls of this function
	
	const device = await getAvailableDevice(job.deviceType);
	if(!device) return job.state = 2; //If we can't find a device for the job, set it back to queued

	device.available = false;

	device.job = job;
	job.device = device;
	
	await showJobStarted(job);
	try {
		await startJob(job);
	} catch (e) {
		vorpal.log(chalk.red('Unhandled exception in job execution. Possible bug. Job aborted.'));
		vorpal.log(e.stack);
	}
}

const showJobStarted = async(job) => { //Let the DB know we started the job
	await Analysis.findOne({
		sha256: job.sha256
	}).exec(function (err, analysis) {
		if (err) {
			throw err;
		}
		analysis.state = 3;
		analysis.save();
	});
}

const queueJob = async (job) => {
	jobs.push(job);
	if(verboseQueue){
		vorpal.log(chalk.yellow("Queued job: " + job.sha256.substr(0, 8)));
	}
}

const startJob = async (job) => {
	try {
		job.event.on('error', (source, reason) => {
			throw Error(`${source}: ${reason}`);
		});
		for (let step of analysisPipeline) {
			job.step = step.step;
			await step.exec(job);
		}
	} catch (err) { //If an error is thrown at any step in analysis
		// Try to stop frida to prevent resource leak
		try {
			await devUtil.stopApiCap(job);
		} catch (e) {
			vorpal.log('Failed to stop frida: ' + chalk.red(err.message));
			vorpal.log(err.stack);
		}

		job.state = 0; //Set the error state
		// Delete temp directory
		if(config.deleteAnalysisDir && (typeof job.temporaryPath != 'undefined' && job.temporaryPath !== null)) {
			await del([job.temporaryPath], {force: true})
		}
		Analysis.findOne({
			sha256: job.sha256
		}).exec(function (mErr, analysis) {
			if (mErr) {
				throw mErr;
			}
			analysis.state = job.state;
			analysis.error = err.message;
			analysis.save();
			if(job.device.verbose){
				vorpal.log(chalk.red(err.message));
				vorpal.log(err.stack);
			}
		});
	} finally { //Regardless of success
		if(job.dirty && !job.device.isEmulator) await devUtil.restoreBackup(job);
		await deleteJob(job);
		await freeDevice(job.device);
		job.device.log(chalk.green("Device ready!"));
		startPendingJob();
	}
}

const deviceInList = (id, selector = "uuid") => {
	for(let i = 0; i < devices.length; i++){
		if(devices[i][selector] === id){
			return devices[i];
		}
	}
	return null;
}

const jobInList = (id, selector = "uuid") => {
	for(let i = 0; i < jobs.length; i++){
		if(jobs[i][selector] === id){
			return jobs[i];
		}
	}
	return null;
}

const updateDeviceList = async () => {
	const output = await exec(config.pathADB + " devices -l"); //Get a list of devices from adb
	const outputLines = output.stdout.split("\n");
	const tempDeviceIDs = [];
	for(let i = 0; i < outputLines.length; i++){
		const idMatch = (/(\S*)[ \t]+(device )/g).exec(outputLines[i]);
		const productMatch = (/(product):(\S*)/g).exec(outputLines[i]);

		if(idMatch){
			const adbID = idMatch[1];
			if(adbID.substr(0, 8) === "emulator") continue; //Skip emulators, we don't want them in the device list
			const product = productMatch[2];
			tempDeviceIDs.push(adbID);
			if(!deviceInList(adbID, "adbID")){
				const newDevice = { //Construct a new device
					uuid: uuidv4(),
					adbID: adbID,
					product: product,
					available: true,
					job: null,
					verbose: false,
					enabled: true,
					isEmulator: false,
					lastLog: "",
					fridaHelperProcess: null,
					fridaHelperReadLineOutput: null,
					get log () {
						return (msg) => {
							this.lastLog = msg;
							if(this.verbose){
								vorpal.log(chalk.rgb(255, 233, 0)(this.product + ": ") + msg);
							}
						};
					}
				};
				devices.push(newDevice);
			}
		}
	}
	for(let i = 0; i < devices.length; i++){ //For each device
		if(!tempDeviceIDs.includes(devices[i].adbID)){ //If one of our devices is no longer connected
			if(!devices[i].job || (devices[i].job && !devices[i].job.step == "restoreBackup")){ //If the device is not currently restoring itself
				const wasAvailable = devices[i].available;
				devices.splice(i, 1); //Delete that device from the list
				if(!wasAvailable){ //If device was occupied by a job
					throw new Error("Removed occupied device from list!");
				}
			}
		}
	}
}

const freeDevice = async (device) => {
	if(device.isEmulator) return await device.emulatorProcess.cleanup();
	for(let i = 0; i < devices.length; i++){
		if(devices[i].uuid === device.uuid){
			if(devices[i].available == false){
				devices[i].job = null;
				return devices[i].available = true;
			}else{
				throw new Error("Device " + device.uuid + " already available!");
			}
		}
	}
	throw new Error("Device " + device.uuid + " not found!");
}

const deleteJob = async (job) => {
	for(let i = 0; i < jobs.length; i++){
		if(jobs[i].uuid === job.uuid){
			return jobs.splice(i, 1);
		}
	}
	throw new Error("Job " + job.uuid + " not found!");
}

const autofillDevices = () => {
	return devices.map((device) => device.uuid);
}

const autofillJobs = () => {
	return jobs.map((job) => job.uuid);
}

const autofillUUID = () => {
	return autofillDevices().concat(autofillJobs());
}

updateDeviceList();
setInterval(startPendingJob, 10000);

const cmdFail = (cb, msg) => {
	vorpal.log(msg);
	cb();
}

const validateBoolean = (args) => {
	if (!args.booleanValue) {
		throw new Error("There is no booleanValue field in this command!");
	}

	if (args.booleanValue !== "true" && args.booleanValue !== "false") {
		return "Invalid value " + chalk.red(args.booleanValue) + ", expected [true/false]!";
	}

	args.booleanValue = args.booleanValue === "true";
	return true;
}

const printDeviceStatus = (device) => {
	const title = "Device";
	const color = chalk.rgb(47, 237, 116);
	let status = "";
	
	if(!device.enabled){
		status = chalk.red("Disabled");
	}else if(device.available){
		status = chalk.blue("Idle");
	}else if(device.job.step != "restoreBackup"){
		status = chalk.green(device.job.step + " for " + device.job.uuid);
	}else{
		status = chalk.yellow("Restoring backup");
	}
	status += device.verbose ? chalk.bold(" (watching)") : "";
	
	vorpal.log(color("-".repeat(16) + title + "-".repeat(16)));
	vorpal.log("UUID:\t" + device.uuid);
	vorpal.log("Model:\t" + device.product);
	vorpal.log("Status:\t" + status);
	vorpal.log(color("-".repeat(32) + "-".repeat(title.length)));
}

const printJobStatus = (job) => {
	const title = "Job";
	const color = chalk.rgb(47, 237, 230);
	let status = "";

	switch(job.state){
		case 0:
			status += chalk.red("Error");
			break;
		case 1:
			status += chalk.blue("Awaiting approval");
			break;
		case 2:
			status += chalk.blue("Queued");
			break;
		case 3:
			status += (job.device ? chalk.green(job.step + " by " + job.device.uuid) : chalk.yellow("Interrupted analysis"));
			break;
		case 4:
			status += chalk.cyan("Done");
			break;
		default:
			status += chalk.yellow("Unknown state " + job.state);
	}
	
	vorpal.log(color("-".repeat(16) + title + "-".repeat(16)));
	vorpal.log("UUID:\t" + job.uuid);
	vorpal.log("SHA256:\t" + job.sha256);
	if(job.packageName) vorpal.log("Pkg:\t" + job.packageName);
	vorpal.log("Status:\t" + status);
	vorpal.log(color("-".repeat(32) + "-".repeat(title.length)));
}

const clearConsole = () => {
	vorpal.log("\u001b[2J\u001b[0;0H");
}

if (!config.noConsole) {
vorpal
    .delimiter(chalk.magenta(config.packageInfo.name) + "#")
	.show();

vorpal.command("clear")
	.description("Clears the console.")
	.alias("c")
	.action(function(args, cb) {
		clearConsole();
		cb();
	});

vorpal.command("info devices")
	.alias("i d")
	.description("Displays info about connected devices.")
	.option("-r, --raw", "display raw device objects")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		if(args.options.raw){
			this.log(devices);
		}else{
			if(devices.length <= 0){
				vorpal.log(chalk.red("No devices attached"));
			}
			for(let i = 0; i < devices.length; i++){
				printDeviceStatus(devices[i]);
			}
		}
		cb();
	});

vorpal.command("info jobs")
	.alias("i j")
	.description("Displays info about currently queued jobs.")
	.option("-r, --raw", "display raw job objects")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		if(args.options.raw){
			this.log(jobs);
		}else{
			if(jobs.length <= 0){
				vorpal.log(chalk.red("No jobs in local queue"));
			}
			for(let i = 0; i < jobs.length; i++){
				printJobStatus(jobs[i]);
			}
		}
		cb();
	});

vorpal.command("info <uuid>")
	.alias("i")
	.description("Displays info about an entity.")
	.option("-r, --raw", "display raw entity objects")
	.option("-c, --clear", "clear console before output")
	.autocomplete(autofillUUID)
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		
		const device = deviceInList(args.uuid, "uuid");
		if(device){
			args.options.raw ? this.log(device) : printDeviceStatus(device);
			return cb();
		}
		
		const job = jobInList(args.uuid, "uuid");
		if(job){
			args.options.raw ? this.log(job) : printJobStatus(job);
			return cb();
		}

		vorpal.log(chalk.red("UUID " + args.uuid + " not found"));
		cb();
	});

vorpal.command("watch devices")
	.alias("w d")
	.description("Enables logging for all devices.")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		for(let i = 0; i < devices.length; i++){
			devices[i].verbose = true;
		}
		this.log("Started watching all devices");
		cb();
	});

vorpal.command("watch jobs")
	.alias("w j")
	.description("Enables logging for the queue.")
	.option("-c, --clear", "clear console before output")
	.action(function(args, cb) {
		if(args.options.clear) clearConsole();

		verboseQueue = true;
		this.log("Started watching jobs");
		cb();
	});

vorpal.command("watch <uuid>")
	.alias("w")
	.description("Enables logging for a device.")
	.option("-c, --clear", "clear console before output")
	.autocomplete(autofillDevices)
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();

		const device = deviceInList(args.uuid, "uuid");
		if(device){
			device.verbose = true;
			this.log("Started watching " + device.uuid);
			return cb();
		}
		
		const job = jobInList(args.uuid, "uuid");
		if(job){
			this.log(chalk.red("You cannot watch a specific job"));
			return cb();
		}

		vorpal.log(chalk.red("UUID " + args.uuid + " not found"));
		cb();
	});

vorpal.command("unwatch devices")
	.alias("uw d")
	.description("Disables logging for all devices.")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		for(let i = 0; i < devices.length; i++){
			devices[i].verbose = false;
		}
		this.log("No longer watching any devices");
		cb();
	});

vorpal.command("unwatch jobs")
	.alias("uw j")
	.description("Disables logging for the queue.")
	.option("-c, --clear", "clear console before output")
	.action(function(args, cb) {
		if(args.options.clear) clearConsole();

		verboseQueue = false;
		this.log("No longer watching jobs");
		cb();
	});

vorpal.command("unwatch <uuid>")
	.alias("uw")
	.description("Disables logging for a device.")
	.option("-c, --clear", "clear console before output")
	.autocomplete(autofillDevices)
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();

		const device = deviceInList(args.uuid, "uuid");
		if(device){
			device.verbose = false;
			this.log("No longer watching " + device.uuid);
			return cb();
		}
		
		const job = jobInList(args.uuid, "uuid");
		if(job){
			this.log(chalk.red("You cannot unwatch a specific job"));
			return cb();
		}

		vorpal.log(chalk.red("UUID " + args.uuid + " not found"));
		cb();
	});

vorpal.command("enable devices")
	.alias("e d")
	.description("Enables all devices.")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		for(let i = 0; i < devices.length; i++){
			devices[i].enabled = true;
		}
		this.log("All devices enabled");
		cb();
	});

vorpal.command("enable <uuid>")
	.alias("e")
	.description("Enables a device.")
	.option("-c, --clear", "clear console before output")
	.autocomplete(autofillDevices)
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		const device = deviceInList(args.uuid, "uuid");
		if(device){
			device.enabled = true;
			this.log("Device " + device.uuid + " enabled");
			return cb();
		}
		
		const job = jobInList(args.uuid, "uuid");
		if(job){
			this.log(chalk.red("You cannot enable a specific job"));
			return cb();
		}

		vorpal.log(chalk.red("UUID " + args.uuid + " not found"));
		cb();
	});

vorpal.command("disable devices")
	.alias("d d")
	.description("Disables all devices.")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();
		for(let i = 0; i < devices.length; i++){
			devices[i].enabled = false;
		}
		this.log("All devices disabled");
		cb();
	});

vorpal.command("disable <uuid>")
	.alias("d")
	.description("Disables a device.")
	.option("-c, --clear", "clear console before output")
	.autocomplete(autofillDevices)
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		await updateDeviceList();

		const device = deviceInList(args.uuid, "uuid");
		if(device){
			device.enabled = false;
			this.log("Device " + device.uuid + " disabled");
			return cb();
		}
		
		const job = jobInList(args.uuid, "uuid");
		if(job){
			this.log(chalk.red("You cannot disable a specific job"));
			return cb();
		}

		vorpal.log(chalk.red("UUID " + args.uuid + " not found"));
		cb();
	});

vorpal.command("jobs clear [targetState]")
	.alias("j c")
	.description("Clears jobs from local job queue. If provided, set these jobs to target state before removal!")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		if(args.targetState && (isNaN(args.targetState) || !Number.isInteger(parseFloat(args.targetState)))){
			this.log(chalk.red("Invalid target state " + args.targetState));
			return cb();
		}

		const targetState = args.targetState != null ? parseInt(args.targetState) : null;

		let deleteCount = 0;
		for(let i = 0; i < jobs.length; i++){
			const job = jobs[i];
			if(targetState != null){
				await Analysis.findOne({
					sha256: job.sha256
				}).exec(async function (err, analysis) {
					analysis.state = targetState;
					analysis.save();
				});
			}
			await deleteJob(job);
			deleteCount++;
		}
		deleteCount > 0 ? vorpal.log("Deleted " + chalk.blue(deleteCount) + " jobs from local queue") : vorpal.log(chalk.red("No jobs in local queue"));
	});

vorpal.command("jobs reacquire <searchState> [targetState]")
	.alias("j r")
	.description("Add jobs with search state from the database. If provided, set these jobs to target state!")
	.option("-c, --clear", "clear console before output")
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		if(isNaN(args.searchState) || !Number.isInteger(parseFloat(args.searchState))){
			this.log(chalk.red("Invalid search state " + args.searchState));
			return cb();
		}

		if(args.targetState && (isNaN(args.targetState) || !Number.isInteger(parseFloat(args.targetState)))){
			this.log(chalk.red("Invalid target state " + args.targetState));
			return cb();
		}

		const searchState = args.searchState != null ? parseInt(args.searchState) : null;
		const targetState = args.targetState != null ? parseInt(args.targetState) : null;

		await Analysis.find({
			state: searchState
		}).exec(async function (err, analyses) {
			let queuedCount = 0;
			for(let i = 0; i < analyses.length; i++){
				const analysis = analyses[i];
				if(targetState != null) analysis.state = targetState;
				if(!jobInList(analysis.sha256, 'sha256')){
					await createJob(analysis);
					analysis.save();
					queuedCount++;
				}
			}
			queuedCount > 0
				? vorpal.log("Added " + chalk.blue(queuedCount) + " jobs from DB")
				: vorpal.log(chalk.red("No other jobs with state " + searchState + " found in DB"));
		});
		cb();
	});

vorpal.command("jobs setstate <uuid> <targetState>")
	.alias("j ss")
	.description("Set a job to a specific state.")
	.option("-c, --clear", "clear console before output")
	.autocomplete(autofillJobs)
	.action(async function(args, cb) {
		if(args.options.clear) clearConsole();

		if(isNaN(args.targetState) || !Number.isInteger(parseFloat(args.targetState))){
			this.log(chalk.red("Invalid target state " + args.targetState));
			return cb();
		}

		const targetState = args.targetState != null ? parseInt(args.targetState) : null;

		const device = deviceInList(args.uuid, "uuid");
		if(device){
			this.log(chalk.red("You cannot perform this action on a device"));
			return cb();
		}
		
		const job = jobInList(args.uuid, "uuid");
		if(job){
			job.state = targetState;
			await Analysis.findOne({
				sha256: job.sha256
			}).exec(async function (err, analysis) {
				analysis.state = targetState;
				analysis.save();
			});
			this.log("Set job state to " + args.targetState);
			return cb();
		}

		vorpal.log(chalk.red("UUID " + args.uuid + " not found"));
		cb();
	});
}