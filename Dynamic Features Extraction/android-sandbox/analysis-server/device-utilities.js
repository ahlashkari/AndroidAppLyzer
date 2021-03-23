const fs = require("fs");
const path = require('path');
const util = require("util");
const readline = require("readline");
const spawn = require('child_process').spawn;
const net = require('net');
const EventEmitter = require('events');
const PassThroughStream = require('stream').PassThrough;
const respawn = require('respawn');
const csv = require("csv");
const del = require("del");
const Jimp = require("jimp");

const exec = util.promisify(require("child_process").exec);
const execFileAsync = util.promisify(require("child_process").execFile);

const config = require("./config");

const fridaArchitectures = new Map([
	["armeabi-v7a", "frida-server-arm"],
	["arm64-v8a", "frida-server-arm64"],
	["x86", "frida-server-x86"],
	["x86_64", "frida-server-x86_64"]
]);

module.exports.quoteString = function (str) {
	// close the previous single-quoted string, double quote the "'" symbol and single quote the rest of the string
	const quoted = str.replace("'", "'\"'\"'");
	return `'${quoted}'`;
}

module.exports.espExec = async (cmd) => {
	return await exec(cmd, {maxBuffer: config.execMaxBuffer, timeout: config.execTimeout});
}

module.exports.espExecFile = async (exe, args) => {
	return await execFileAsync(exe, args, {maxBuffer: config.execMaxBuffer, timeout: config.execTimeout});
}

module.exports.writeToFile = async (path, data) => {
	return await new Promise((resolve, reject) => {
		fs.writeFile(path, data, (err) => {
			if(err) reject(err);
			resolve();
		});
	});
}

module.exports.readFromFile = async (path) => {
	return await new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if(err) reject(err);
			resolve(data);
		});
	});
}

module.exports.adb = async (job, args) => {
	// Takes a constant space-separated string or an array of strings as the arguments
	job.dirty = true; //Only recover devices that have received commands.
	if (typeof args == 'string') {
		args = args.split(' ');
	}
	//job.device.log(`ADB request to ${job.device.adbID} args ${args}`);
	return await module.exports.espExecFile(config.pathADB, ["-s", job.device.adbID].concat(args));
}

module.exports.fastboot = async (job, cmd) => {
	job.dirty = true;
	return module.exports.espExec(config.pathFastboot + " -s " + job.device.adbID + " " + cmd);
}

module.exports.wakeScreen = async (job) => {
	const output = await module.exports.adb(job, "shell service call power 12");
	if (!output.stdout.includes("1")) { //If screen not on (result doesn't contain 1)
		await module.exports.adb(job, "shell input keyevent 26"); //Unlock screen
		await module.exports.adb(job, "shell input touchscreen swipe 0 1000 0 0 250"); //Swipe up (x1 y1 x2 y2 time[ms])
	}
}

module.exports.lockScreen = async (job) => {
	const output = await module.exports.adb(job, "shell service call power 12");
	if (output.stdout.includes("1")) { //If screen on (result contains 1)
		await module.exports.adb(job, "shell input keyevent 26"); //Lock screen
	}
}

module.exports.parseCSV = async (data) => {
	const excludedKeys = [
		"sample_num",
		"<family>",
		"<category>",
		"<md5>"
	];
	return new Promise((resolve, reject) => {
		csv.parse(data, function(err, parsedObj){
			if(err) throw err;
			const usedHeaders = [];
			const usedFields = [];
			for(let i = 0; i < parsedObj[1].length; i++){
				const key = parsedObj[0][i];
				const val = parsedObj[1][i];
				if(val == "0") continue;
				if(excludedKeys.includes(key.toLowerCase())) continue;
				usedHeaders.push(key);
				usedFields.push(val);
			}
			resolve([usedHeaders, usedFields]);
		});
	});
}

module.exports.verifyRemoteLooseFiles = async (job) => {
	job.device.log("Verifying remote backup loose files...");
	const parseOutput = (str) => str.split("\n").filter((line) => line !== "").map((line) => line.substr(0, 32));

	const localFileHashesOutput = await module.exports.espExec("cat " + config.serverLocation + "/devicefiles/" + job.device.product + "-backup-hashes");
	const localFileHashes = parseOutput(localFileHashesOutput.stdout);

	let remoteFileHashesOutput;
	try{
		remoteFileHashesOutput = await module.exports.adb(job, [
			"shell",
			"md5sum",
			module.exports.quoteString("/sdcard/" + job.device.product + "-backup/*")
		]).catch((err)=>{
			throw err;
		});
	}catch(err){
		return false;
	}

	const remoteFileHashes = parseOutput(remoteFileHashesOutput.stdout);

	if (localFileHashes.length !== remoteFileHashes.length) return false;

	for(let i = 0; i < remoteFileHashes.length; i++){
		if(!localFileHashes.includes(remoteFileHashes[i])){
			return false;
		}
	}
	return true;
}

module.exports.verifyRemoteArchive = async (job) => {
	job.device.log("Verifying remote backup archive...");
	const localArchiveHashOutput = await module.exports.espExec("cat " + config.serverLocation + "/devicefiles/" + job.device.product + "-backup-hash");
	const localArchiveHash = localArchiveHashOutput.stdout.substr(0, 32);
	let remoteArchiveHashOutput;
	try{
		remoteArchiveHashOutput = await module.exports.adb(job, [
			"shell",
			"md5sum",
			module.exports.quoteString("/sdcard/" + job.device.product + "-backup.tar.gz")
		]).catch((err)=>{
			throw err;
		});
	}catch(err){
		return false;
	}

	if(remoteArchiveHashOutput.stderr.includes("No such file or directory")) return false;
	const remoteArchiveHash = remoteArchiveHashOutput.stdout.substr(0, 32);

	return localArchiveHash === remoteArchiveHash;
}

module.exports.deleteRemoteLooseFiles = async (job) => {
	job.device.log("Deleting remote backup loose files...");
	await module.exports.adb(job, [
		"shell",
		"rm", "-rf",
		module.exports.quoteString("/sdcard/" + job.device.product + "-backup")
	]);
}

module.exports.deleteRemoteArchive = async (job) => {
	job.device.log("Deleting remote backup archive...");
	await module.exports.adb(job, [
		"shell",
		"rm", "-f",
		module.exports.quoteString("/sdcard/" + job.device.product + "-backup.tar.gz")
	]);
}

module.exports.extractRemoteArchive = async (job) => {
	job.device.log("Extracting remote backup archive...");
	await module.exports.adb(job, [
		"shell",
		"tar", "-oxv",
		"-f", module.exports.quoteString("/sdcard/" + job.device.product + "-backup.tar.gz"),
		"-C", "/sdcard"
	]);
}

module.exports.uploadLocalArchive = async (job) => {
	job.device.log("Uploading local backup archive...");
	await module.exports.adb(job, [
		"push",
		config.serverLocation + "/devicefiles/" + job.device.product + "-backup.tar.gz",
		"/sdcard"
	]);
}

module.exports.manageBackup = async (job) => {
	if(await module.exports.verifyRemoteLooseFiles(job)){
		job.device.log("Remote backup loose file integrity verified!");
		return;
	}

	job.device.log("Remote backup loose file integrity failed!");

	if(await module.exports.verifyRemoteArchive(job)){
		job.device.log("Remote backup archive integrity verified!");
		await module.exports.deleteRemoteLooseFiles(job);
		await module.exports.extractRemoteArchive(job);
		return;
	}

	job.device.log("Remote backup archive integrity failed!");

	await module.exports.deleteRemoteLooseFiles(job);
	await module.exports.deleteRemoteArchive(job);
	await module.exports.uploadLocalArchive(job);
	await module.exports.extractRemoteArchive(job);
	return;
}

module.exports.restoreBackup = async (job) => {
	job.step = "restoreBackup";
	job.device.log("Initializing backup restore...");
	await module.exports.adb(job, "reboot bootloader"); //Reboot to bootloader
	await module.exports.fastboot(job, "boot " + config.serverLocation + "/devicefiles/" + job.device.product + "-twrp.img"); //Load TWRP
	await new Promise(resolve => setTimeout(resolve, 15000));
	await module.exports.manageBackup(job); //Ensure backup integrity
	await module.exports.adb(job, "shell twrp remountrw"); //Remount partitions as writable
	job.device.log("Restoring backup...");
	await module.exports.adb(job, [
		"shell",
		"twrp", "restore",
		module.exports.quoteString("/sdcard/" + job.device.product + "-backup")
	]); //Restore the backup
	job.device.log("Rebooting device...");
	await module.exports.adb(job, "reboot"); //Reboot the device
	await new Promise(resolve => setTimeout(resolve, 30000));
}

// https://developer.android.com/reference/android/view/KeyEvent.html
module.exports.keycodes = {
	TAB: 61,
	ENTER: 66,
	HOME: 3
}

module.exports.sendKeyEvent = async(job, keycode) => {
	await module.exports.adb(job, [
		"shell",
		"input", "keyevent",
		keycode.toString()
	]);
}

module.exports.typeText = async(job, text) => {
	await module.exports.adb(job, [
		"shell",
		"input", "text",
		module.exports.quoteString(text)
	]);
}

module.exports.makeCall = async(job, number) => {
	await module.exports.adb(job, [
		"shell",
		"am", "start",
		"-a", "android.intent.action.CALL",
		"-d", module.exports.quoteString("tel:" + number)
	]);
}

module.exports.sendSMS = async(job, number, text) => {
	await module.exports.adb(job, [
		"shell",
		"am", "start",
		"-a", "android.intent.action.SENDTO",
		"-d", module.exports.quoteString("sms:" + number),
		"--es", "sms_body", module.exports.quoteString(text),
		"--ez", "exit_on_sent", "true"
	]);
	await new Promise(resolve => setTimeout(resolve, 2000));
	// TODO check android version?
	await module.exports.sendKeyEvent(job, 'KEYCODE_TAB');
	await new Promise(resolve => setTimeout(resolve, 200));
	await module.exports.sendKeyEvent(job, 'KEYCODE_ENTER');
}

module.exports.openURL = async(job, url) => {
	await module.exports.adb(job, [
		"shell",
		"am", "start",
		"-a", "android.intent.action.VIEW",
		"-d", module.exports.quoteString(url)
	]);
}

module.exports.tap = async(job, coord) => {
	await module.exports.adb(job, [
		"shell",
		"input", "tap",
		coord[0].toString(), coord[1].toString()
	]);
}

module.exports.showPointerLocation = async(job, value) => {
	await module.exports.adb(job, [
		"shell",
		"settings", "put",
		"system", "pointer_location"
		(value ? "1" : "0")
	]);
}

module.exports.setGPSStatus = async(job, value) => {
	await module.exports.adb(job, [
		"shell",
		"settings", "put",
		"secure", "location_providers_allowed",
		(value ? "+gps,network" : "-gps,network")
	]);
}

module.exports.makeDummyFile = async(job, path, size) => {
	await module.exports.adb(job, [
		"shell",
		"dd",
		"if=/dev/urandom",
		"of=" + module.exports.quoteString(path),
		"bs=1", "count=" + size
	]);
}

module.exports.getScreenshot = async(job, localPath) => {
	await module.exports.adb(job, "shell screencap -p /sdcard/temporaryscreenshot.png");
	await module.exports.adb(job, [
		"pull",
		"/sdcard/temporaryscreenshot.png", localPath
	]);
	await module.exports.adb(job, "shell rm /sdcard/temporaryscreenshot.png");
}

module.exports.findColorLocationOnScreen = async(job, color, searchDensity = 64) => {
	const filename = "ocrscreenshot.png";
	await module.exports.getScreenshot(job, filename);
	await new Promise(resolve => setTimeout(resolve, 1000)); //Wait 1s
	let coords = await Jimp.read(filename).then(image => {
		for(let x = 0; x < image.bitmap.width; x += searchDensity){
			for(let y = 0; y < image.bitmap.height; y += searchDensity){
				if(image.getPixelColor(x, y) == color){
					return [x, y];
				}
			}
		}
		return null;
	});
	del(filename);
	return coords;
}

module.exports.memoryDump = async(job, destinationPath) => {
	await module.exports.adb(job, [
		"shell",
		"insmod", "/sdcard/lime.ko",
		"path=" + module.exports.quoteString(destinationPath),
		"format=lime"
	]);
}

module.exports.installFrida = async(job) => {
	// install and run frida-server
	const out = await module.exports.adb(job, [
		'shell',
		'getprop', 'ro.product.cpu.abi'
	]);
	const arch = out.stdout.trim();
	if (!fridaArchitectures.has(arch)) {
		throw Error('Unsupported architecture for frida: ' + arch);
	}

	const serverExeName = fridaArchitectures.get(arch);
	await module.exports.adb(job, [
		'push',
		path.join(config.pathFridaServer, serverExeName),
		'/data/local/tmp/frida-server'
	]);
	await module.exports.adb(job, [
		'shell',
		'chmod', '755',
		'/data/local/tmp/frida-server'
	]);
	await module.exports.startFrida(job);
}

module.exports.startFrida = async(job) => {
	if (job.device.isEmulator) {
		//await module.exports.adb(job, 'root');
		// For some reason frida-server on emulator won't detach stdio even in daemon mode. Use the force.
		await module.exports.adb(job, [
			'shell',
			'su root /data/local/tmp/frida-server -D &'
		]);
		//await module.exports.adb(job, 'unroot');
	} else {
		await module.exports.adb(job, [
			'shell',
			'su', '-c',
			'/data/local/tmp/frida-server',
			'-D'
		]);
	}
}

module.exports.uninstallFrida = async(job) => {
	// kill and uninstall frida-server
	if (job.device.isEmulator) {
		//await module.exports.adb(job, 'root');
		await module.exports.adb(job, [
			'shell',
			'su', 'root',
			'killall', 'frida-server'
		]);
		//await module.exports.adb(job, 'unroot');
	} else {
		await module.exports.adb(job, [
			'shell',
			'su', '-c',
			'killall', 'frida-server'
		]);
	}
	await module.exports.adb(job, [
		'shell',
		'rm', '/data/local/tmp/frida-server'
	]);
}

module.exports.startWithApiCap = async(job, packageName) => {
	const samplePath = [
		job.sampleBeforePath,
		job.sampleAfterPath
	];
	const logFilePath = path.join(samplePath[job.pass], 'api.log');
	const proc = respawn(['python',
		path.join(config.serverLocation, 'frida-helper.py'),
		job.device.adbID, packageName, config.pathFridaScripts, logFilePath, config.pathADB
	]);
	job.device.fridaHelperProcess = proc;
	const stdoutProxy = new PassThroughStream();
	job.device.fridaStdoutProxy = stdoutProxy;
	proc.on('stdout', (data) => {
		stdoutProxy.write(data);
	});
	const fridaOkayEvent = new EventEmitter();
	const rl = readline.createInterface({input: stdoutProxy});
	job.device.fridaHelperReadLineOutput = rl;
	rl.on('line', (line) => {
		if (line.trim() == '#STARTUP OK#') {
			fridaOkayEvent.emit('ok');
		} else {
			job.device.log(line);
		}
	});
	proc.start();
	await new Promise((resolve, reject) => {
		setTimeout(() => {
			reject(new Error('Timeout waiting for frida-helper to finish starting'));
		}, 30000);
		fridaOkayEvent.once('ok', resolve);
	});

/* 	const logFile = fs.createWriteStream(path.join(samplePath[job.pass], 'api.log'), {flags: "a"});
	job.device.appmonLogFile = logFile;
	// preload scripts
	let scr = "";
	await new Promise((resolve, reject) => {
		const w = walk(config.pathFridaScripts);
		w.on('file', (root, stats, next) => {
			// Only load '.js' files so we can disable some scripts by appending '.disabled' or similar to the file name
			if (stats.name.endsWith(".js")) {
				job.device.log('frida: Loading script ' + path.join(root, stats.name));
				fs.readFile(path.join(root, stats.name), (err, data) => {
					if (err) {
						reject(err);
					}
					scr += data;
					scr += "\n";
					next();
				});
			} else {
				next();
			}
		});
		w.on('end', () => {
			resolve();
		});
	});

	job.device.log('frida: Connecting to device...');
	const dev = await frida.getDevice(job.device.adbID);
	job.device.frida = dev;
	job.device.log('frida: Spawning app...');
	// Sometimes spawn doesn't finish on time. Retry to make sure
	let retry = 0;
	let aut = null;
	while (true) {
		try {
			aut = await dev.spawn([packageName]);
			break;
		} catch (e) {
			retry++;
			if (retry > 2) {
				throw e;
			}
		}
	}
	job.device.log('frida: Attaching to newly spawned app...');
	const session = await dev.attach(aut);
	session.detached.connect(async (reason) => {
		job.device.log('frida: Device detached reason=' + reason);
		let retry = 0;
		while (true) {
			try {
				if (reason !== 'application-requested') {
					// Run the cleanup code and try again if the job is still running
					await module.exports.stopApiCap(job);
					if (job.state == 3 && job.device) {
						await module.exports.startWithApiCap(job, job.packageName);
					} else {
						break;
					}
				}
				break;
			} catch (e) {
				job.device.log('frida: ' + e);
				retry++;
				if (retry > 15) {
					job.device.log('frida: Keeps failing to restart, give up. Capture may be incomplete.');
					await module.exports.stopApiCap(job);
					break;
				}
			}
		}
	});
	job.device.appmonSessionInst = session;

	job.device.log('frida: Installing frida scripts...');
	const script = await session.createScript(scr);
	script.message.connect(message => {
		if (message.type == 'error') {
			job.device.log("frida: Error on script execution");
			job.device.log(message.stack);
		} else if (message.type == 'send') {
			//job.device.log("frida: " + message.payload);
			job.device.appmonLogFile.write(message.payload);
			job.device.appmonLogFile.write("\n");
		} else {
			job.device.log("frida: other message: " + JSON.stringify(message));
		}
	});
	// Doesn't work on Nexus 5 running on Android 5.x. Could be a frida issue.
	job.device.log('frida: Activating frida scripts...');
	await script.load();
	job.device.log('frida: Resuming process...');
	await dev.resume(aut);
	job.device.appmonScriptInst = script;
	job.device.log('frida: Set up and running.'); */
}

module.exports.startWithSyscallCap = async(job, packageName) => {
	await module.exports.adb(job, 'root');
	await module.exports.adb(job, 'shell mkdir -p -m 777 /data/local/tmp/t');
	await module.exports.adb(job, [
		'shell', 'setprop',
		module.exports.quoteString('wrap.' + packageName),
		// -e trace=%file,%process,%network,%ipc,read,write
		// https://stackoverflow.com/questions/5068305/how-can-i-overcome-the-property-length-limitation-of-the-adb-shell-setprop
		// oh no
		module.exports.quoteString('logwrapper strace -fe trace=%file,%network,%process,ioctl,read,write -o/data/local/tmp/t/l'),
	]);
	await module.exports.adb(job, 'unroot');
	await module.exports.adb(job, ["shell", "monkey", "-p", module.exports.quoteString(packageName), "1"]);
}

module.exports.stopApiCap = async(job) => {
	// Make a backup here so we won't be screwed even the cleanup on-exit event got triggered first.
	const proc = job.device.fridaHelperProcess;
	if (proc !== null) {
		// Disable exit handler so we can force a quit even when the process crashes/exits uncleanly during the process
		await new Promise(resolve => { proc.stop(resolve); });
		proc.removeAllListeners();
		job.device.fridaHelperProcess = null;
		if (job.device.fridaHelperReadLineOutput !== null) {
			job.device.fridaHelperReadLineOutput.removeAllListeners();
			job.device.fridaHelperReadLineOutput.close();
			job.device.fridaHelperReadLineOutput = null;
		}
		if (job.device.fridaStdoutProxy !== null) {
			job.device.fridaStdoutProxy.removeAllListeners();
			job.device.fridaStdoutProxy.end();
			job.device.fridaStdoutProxy = null;
		}
	}

/* 	if (job.device.appmonScriptInst !== null) {
		job.device.log('Unloading script');
		await job.device.appmonScriptInst.unload();
		job.device.appmonScriptInst = null;
	}
	if (job.device.appmonSessionInst !== null) {
		job.device.log('Detaching session');
		await job.device.appmonSessionInst.detach();
		job.device.appmonSessionInst = null;
	}
	if (job.device.appmonLogFile != null) {
		job.device.log('Closing file');
		job.device.appmonLogFile.end();
		job.device.appmonLogFile = null;
	}
	if (job.device.frida !== null) {
		job.device.log('Discarding device handle');
		job.device.frida = null;
	} */
}

module.exports.stopSyscallCap = async(job, packageName) => {
	await module.exports.adb(job, [
		"shell",
		"am",
		"force-stop", module.exports.quoteString(packageName)
	]);
	await module.exports.adb(job, 'root');
	await module.exports.adb(job, [
		'shell', 'setprop',
		module.exports.quoteString('wrap.' + packageName),
		module.exports.quoteString(''),
	]);
	// Fetch the syscall logs
	if (job.pass == 0) {
		await module.exports.adb(job, ['pull', '/data/local/tmp/t/l', path.join(job.sampleBeforePath, 'syscalls.log')]);
	} else if (job.pass == 1) {
		await module.exports.adb(job, ['pull', '/data/local/tmp/t/l', path.join(job.sampleAfterPath, 'syscalls.log')]);
	}
	await module.exports.adb(job, 'unroot');
}

module.exports.closeAppsByActiveWindow = async function(job, except) {
	// extract package names from current active windows (`adb shell dumpsys window a`)
    // More info: https://www.xanh.co.uk/programmatically-close-recent-apps/
	const extractor = /(?:^\s+Window\s+#\d+:\s+WindowStateAnimator{[A-Fa-f\d]+\s+((?:[A-Za-z\d]+(?:\.))+[A-Za-z0-9]+)\/.+}$)/gm;
	let processes = [];
	const { stdout } = await module.exports.adb(job, "shell dumpsys window a");
	while ((m = extractor.exec(stdout)) !== null) {
		if (m[1] !== null && !(except.includes(m[1])) && !(processes.includes(m[1]))) {
			processes.push(m[1]);
		}
	}
	// Force-close all apps that matches
	processes.forEach(async (p) => {
		await module.exports.adb(job, [
			"shell",
			"am",
			"force-stop", module.exports.quoteString(p)
		]);
	});
}

module.exports.doDiscreteCap = async function(job, stage) {
	// Do discrete feature capture
	const devUtil = module.exports;
	const stageToPath = new Map([
		['afterinstall', job.sampleAfterInstallPath],
		['before', job.sampleBeforePath],
		['after', job.sampleAfterPath],
	]);
	if (!stageToPath.has(stage)) {
		throw Error('Invalid stage ' + stage);
	}
	targetPath = stageToPath.get(stage);

	let output = null;
	// listPackage
	job.device.log("Collecting package list...");
	output = await devUtil.adb(job, "shell pm list packages -f");
	job.device.log("Saving package list...");
	await devUtil.writeToFile(path.join(targetPath, 'packages'), output.stdout);

	// listProcesses
	job.device.log("Collecting process list...");
	output = await devUtil.adb(job, "shell ps");
	job.device.log("Saving process list...");
	await devUtil.writeToFile(path.join(targetPath, 'processes'), output.stdout);
	// getProcessInfo
	let processInfo = '';
	output.stdout.split('\n').forEach((line) => {
		if (line.includes(job.packageName)) {
			processInfo += line.trim() + '\n';
		}
	});
	await devUtil.writeToFile(path.join(targetPath, 'id'), processInfo);

	// getDumpsysPackage
	//job.device.log("Collecting package information...");
	//output = await devUtil.adb(job, "shell dumpsys package " + job.packageName);
	//const userIDRegex = /(    userId=[0-9]*)/;
	//const matches = userIDRegex.exec(output.stdout);
	//job.device.log("Saving package information...");
	//await devUtil.writeToFile(targetPath + "/id", matches[1] + " |"); // The parser doesn't work without an extra char

	// getDumpsysMeminfo
	job.device.log("Collecting memory information...");
	output = await devUtil.adb(job, "shell dumpsys meminfo -a " + job.packageName);
	job.device.log("Saving memory information...");
	await devUtil.writeToFile(targetPath + "/all.ramUsage", output.stdout);

	// getDumpsysBatterystats
	job.device.log("Collecting battery information...");
	output = await devUtil.adb(job, "shell dumpsys batterystats");
	job.device.log("Saving battery information...");
	await devUtil.writeToFile(targetPath + "/battery", output.stdout);

	// getDumpsysNetstats
	job.device.log("Collecting networking information...");
	output = await devUtil.adb(job, "shell dumpsys netstats detail");
	job.device.log("Saving networking information...");
	await devUtil.writeToFile(targetPath + "/networkUsage", output.stdout);
}

module.exports.grantSdk23Permission = async function (job, package, permission) {
	await module.exports.adb(job, [
		'shell',
		'pm', 'grant',
		module.exports.quoteString(package),
		module.exports.quoteString(permission)
	]);
}

module.exports.waitEmulatorReboot = async function (emulatorProcess) {
	await new Promise((resolve, reject) => {
		emulatorProcess.stdout.once('data', (data) => {
			if (data.includes("INFO: boot completed")) {
				resolve();
			}
		});
		// Failsafe timeout (6 minutes) in case that emulator hangs
		setTimeout(reject, 360 * 1000);
	}); //Wait for the process to come up
}

module.exports.dumpLogcat = async function (job, outputFile) {
	const logFile = fs.createWriteStream(outputFile, {flags: "a"});
	await new Promise((resolve, reject) => {
		const proc = spawn(config.pathADB, ["-s", job.device.adbID, 'logcat', '-d'], {env: process.env});
		proc.stdout.pipe(logFile);
		proc.on('exit', () => {
			resolve();
		});
		proc.on('error', (err) => {
			reject(err);
		});
	});
}

module.exports.waitForReboot = async function (job) {
	await new Promise(async (resolve, reject) => {
		let output = null;
		let boot_result = null;
		setTimeout(() => { reject('Timeout waiting for reboot'); }, 360 * 1000);
		for (;;) {
			try {
				output = await module.exports.adb(job, 'wait-for-device shell getprop sys.boot_completed');
				if (output !== null) {
					boot_result = output.stdout.trim();
					if (boot_result === '1') {
						resolve();
						break;
					}
				} else {
					reject(new Error('No output result from adb'));
					break;
				}
			} catch (e) {
				reject(e);
				break;
			} finally {
				await new Promise((resolve) => {
					setTimeout(resolve, 1000);
				});
			}
		}
	});
}

module.exports.sendToEmulatorConsole = async function (job, cmd) {
	if (job.device.isEmulator) {
		const result = [];
		const _collect_output = function(line) {
			result.push(line);
		}
		// listen on emulator console output
		job.device.emulatorConsoleCommandResult.on('line', _collect_output);
		job.device.emulatorConsole.write(cmd.trim() + '\n');
		await new Promise((resolve, reject) => {
			job.device.emulatorConsoleCommandResult.once('result', (status, extra) => {
				// stop listening on emulator console output and return the result if the command is successfully executed
				job.device.emulatorConsoleCommandResult.off('line', _collect_output);
				if (status == 'ok') {
					resolve(result);
				} else {
					reject(new Error(`Emulator console command failed: ${extra}`));
				}
			});
		})
	}
}

module.exports.connectEmulatorConsole = async function (job) {
	if (job.device.isEmulator) {
		if (job.device.emulatorConsole !== null) {
			job.device.log('WARNING: Emulator console socket object is not null. Potential leak.');
		}
		await new Promise((resolve, reject) => {
			try {
				const sock = new net.Socket();
				sock.setEncoding('utf8');
				sock.connect(job.device.emulatorPort, '127.0.0.1', () => {
					job.device.emulatorConsole = sock;
					const rl = readline.createInterface({input: sock, terminal: false});
					rl.on('line', (line) => {
						if (line.startsWith('KO:')) {
							job.device.emulatorConsoleCommandResult.emit('result', 'ko', line);
						} else if (line.trim() === 'OK') {
							job.device.emulatorConsoleCommandResult.emit('result', 'ok', null);
						} else {
							job.device.emulatorConsoleCommandResult.emit('line', line);
						}
					});
					job.device.emulatorConsoleReadLine = rl;
					job.device.emulatorConsoleCommandResult.once('result', () => { resolve(); });
				});
			} catch (e) {
				reject(e);
			}
		});
	}
}

module.exports.disconnectEmulatorConsole = async function (job) {
	if (job.device.isEmulator) {
		await new Promise((resolve, reject) => {
			try {
				job.device.emulatorConsole.end('exit\n', 'utf8', () => {
					job.device.emulatorConsole = null;
					resolve();
				});
			} catch (e) {
				reject(e);
			}
		});
	}
}

module.exports.installPackageFromLocalStore = async function (job, name) {
	if (name in config.apkStore) {
		const apkPath = path.join(config.pathAPKStore, config.apkStore[name]);
		await module.exports.adb(job, ['install', apkPath]);
	} else {
		throw Error(`Package "${name}" not found in local store.`);
	}
}