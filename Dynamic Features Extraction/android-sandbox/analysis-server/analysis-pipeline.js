const chalk = require('chalk');
const fs = require('fs');
const request = require('request');
const del = require('del');
const spawn = require('child_process').spawn;
const path = require('path');

const devUtil = require('./device-utilities');
const config = require('./config');

const Analysis = require('./models/Analysis');

module.exports = [
	{
		step: "setupEnvironment",
		exec: async (job) => {
			job.device.log("Creating environment for " + chalk.yellow(job.sha256.substr(0, 8)) + "...");
			job.pass = 0;
			job.temporaryPath = config.pathTemporary + "/" + job.uuid;
			job.apktoolDumpPath = job.temporaryPath + "/apktooldump";

			await new Promise((resolve, _reject) => {
				fs.mkdir(job.temporaryPath, (err) => {
					if (err) throw err;
					resolve();
				});
			});
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "downloadAPK",
		exec: async (job) => {
			if (!config.noWeb) {
				const urlDL = config.urlWeb + "/file/download/" + job.sha256 + "/path";
				job.apkPath = job.temporaryPath + "/" + job.uuid + ".apk";
				const options = {
					url: urlDL
				}
				const file = fs.createWriteStream(job.apkPath);
				job.device.log("Downloading APK...");
				await new Promise((resolve, reject) => {
					const downloadRequest = request(options).pipe(file);
					downloadRequest.on('error', function (err) {
						file.close();
						reject(err);
					});
					downloadRequest.on('finish', function () {
						file.close();
						resolve();
					});
				});
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "apktoolDecompile",
		exec: async (job) => {
			job.device.log("Apktool decompiling...");
			await devUtil.espExec(config.pathAPKTool + " d " + job.apkPath + " -o " + job.apktoolDumpPath);
			if(!fs.existsSync(job.apktoolDumpPath + "/AndroidManifest.xml")) throw new Error("Invalid APK, couldn't find AndroidManifest.xml");
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "getAAPTPermissions",
		exec: async (job) => {
			job.device.log("Extracting permissions...");
			const output = await devUtil.espExec(config.pathAAPT + " d permissions " + job.apkPath);
			job.rawAAPTPermissions = output.stdout;
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "parseAAPTPermissions",
		exec: async (job) => {
			job.device.log("Parsing permissions...");
			let permissions = {};
			let packageName = "";
			const outputLines = job.rawAAPTPermissions.split("\n");

			for (let i = 0; i < outputLines.length; i++) {
				const curLine = outputLines[i];
				let type = curLine.split(": ")[0];
				let value = curLine.split(": ")[1];
				switch (type) {
					case "package":
						type = "package";
						packageName = value;
						break;
					case "uses-permission":
						type = "usesPermission";
						value = value.split("'")[1];
						if (!permissions[type]) permissions[type] = [];
						permissions[type].push(value);
						break;
					case "uses-permission-sdk-23":
						type = "usesPermissionSdk23";
						value = value.split("'")[1];
						if (!permissions[type]) permissions[type] = [];
						permissions[type].push(value);
						break;
					case "permission":
						type = "permission";
						if (!permissions[type]) permissions[type] = [];
						permissions[type].push(value);
						break;
				}
			}
			job.permissions = permissions;
			job.packageName = packageName;
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: 'createSampleDir',
		exec: async(job) => {
			job.device.log(`Creating sample directories for ${chalk.yellow(job.packageName)}...`);
			const now = new Date(Date.now());
			if (config.captureOnly) {
				job.samplePath = config.pathCapture;
			} else {
				job.samplePath = path.join(job.temporaryPath, "sample");
			}

			job.sampleConvolutedSubPath = job.samplePath + "/" + now.toISOString().replace(/:|-/g, '_') + "-" + job.packageName + "-" + job.sha256;
			job.sampleAfterInstallPath = job.sampleConvolutedSubPath + "/1-after-install";
			job.sampleAfterPath = job.sampleConvolutedSubPath + "/3-after-reboot";
			job.sampleBeforePath = job.sampleConvolutedSubPath + "/2-before-reboot";

			const pathsToGenerate = [
				job.sampleAfterInstallPath,
				job.sampleAfterPath,
				job.sampleBeforePath
			];

			for(let i = 0; i < pathsToGenerate.length; i++){
				const currentPath = pathsToGenerate[i];
				await new Promise((resolve, reject) => {
					fs.mkdir(currentPath, {recursive: true}, (err) => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});
			}
			await devUtil.writeToFile(job.sampleAfterInstallPath + "/permissionsFromApk", job.rawAAPTPermissions);
			delete job.rawAAPTPermissions;
			fs.copyFileSync(job.apktoolDumpPath + "/AndroidManifest.xml", job.sampleAfterInstallPath + "/AndroidManifest.xml");
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/*{
		step: "memdumpPre",
		exec: async (job) => {
			job.device.log("Dumping device memory (pre)...");
			await devUtil.memoryDump(job, "/sdcard/memdumpPre.lime");
		}
	},*/
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "waitForDevice",
		exec: async (job) => {
			job.device.log("Waiting for device to become ready...");
			await devUtil.waitForReboot(job);
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "connectEmulatorConsole",
		exec: async (job) => {
			if (job.device.isEmulator) {
				job.device.log("Connecting to emulator console...");
				await devUtil.connectEmulatorConsole(job);
				await devUtil.sendToEmulatorConsole(job, 'auth ' + config.emulatorConsoleToken);
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "installPackage",
		exec: async (job) => {
			job.device.log("Installing package to device...");
			//await devUtil.wakeScreen(job);
			try {
				await devUtil.adb(job, "install " + job.apkPath);
			} catch (err) {
				if (err && !err.message.includes("INSTALL_FAILED_ALREADY_EXISTS")) throw err;
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/*{
		step: "apiCap",
		exec: async (job) => {
			job.device.log("Starting API capture...");
			await devUtil.apiCap(job, job.packageName);
		}
	},*/
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "installFrida",
		exec: async (job) => {
			if (config.behaviorCapture === 'frida') {
				job.device.log("Installing and starting frida-server...");
				await devUtil.installFrida(job);
			}
		}
	},
	{
		step: "discreteCapAfterInstall",
		exec: async (job) => {
			job.device.log("Doing discrete feature capturing - after install...");
			await devUtil.doDiscreteCap(job, "afterinstall");
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "startNetworkCapturing",
		exec: async (job) => {
			await devUtil.sendToEmulatorConsole(job, 'network capture start ' + path.join(job.sampleBeforePath, 'network.pcap'));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "startPackage",
		exec: async (job) => {
			job.device.log("Starting package...");
			//await devUtil.wakeScreen(job);
			if (config.behaviorCapture === 'syscall') {
				await devUtil.startWithSyscallCap(job, job.packageName);
			} else if (config.behaviorCapture === 'frida') {
				await devUtil.startWithApiCap(job, job.packageName);
			}
			//await devUtil.adb(job, "shell monkey -p " + job.packageName + " 1");
			job.device.log("Waiting for " + config.startPackageWaitTime/1000 + " seconds...");
			await new Promise(resolve => setTimeout(resolve, config.startPackageWaitTime));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "getScreenshot",
		exec: async (job) => {
			if (!config.noWeb) {
				const screenshotFilename = "screenshot_" + job.uuid + ".png"
				const remotePath = "/sdcard/" + screenshotFilename;
				job.screenshotPath = job.temporaryPath + "/" + screenshotFilename;

				job.device.log("Grabbing screenshot...");
				await devUtil.adb(job, "shell screencap -p " + remotePath);
				job.device.log("Saving screenshot...");
				await devUtil.adb(job, "pull " + remotePath + " " + job.screenshotPath);
				job.device.log("Deleting remote screenshot...");
				await devUtil.adb(job, "shell rm " + remotePath);
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "uploadScreenshot",
		exec: async (job) => {
			if (!config.noWeb) {
				const url = config.urlWeb + "/file/upload/" + job.sha256 + "/screenshotPath";

				const options = {
					url: url
				}
	
				job.device.log("Uploading screenshot to web server...");
				const req = request.post(options, (err, resp, body) => {
					if (err) {
						throw err;
					}
				});
				const form = req.form();
				form.append('file', fs.createReadStream(job.screenshotPath));
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// TODO: move this to somewhere else
	// {
	// 	step: "uploadPcap",
	// 	exec: async (job) => {
	// 		if(!job.device.isEmulator) return; //TODO: pcap only works for emu

	// 		const pcapFilename = "pcap_" + job.uuid + ".cap"
	// 		const originalPath = config.pathTemporary + "/" + job.device.adbID + ".cap";
	// 		job.pcapPath = job.temporaryPath + "/" + pcapFilename;

	// 		await new Promise((resolve, reject) => {
	// 			fs.rename(originalPath, job.pcapPath, (err) => {
	// 				if (err) throw err;
	// 				resolve();
	// 			});
	// 		});

	// 		const url = config.urlWeb + "/file/upload/" + job.sha256 + "/pcapPath";

	// 		const options = {
	// 			url: url,
	// 			formData: {
	// 				file: fs.createReadStream(job.pcapPath)
	// 			}
	// 		}

	// 		job.device.log("Uploading pcap to web server...");
	// 		const req = request.post(options, (err, resp, body) => {
	// 			if (err) {
	// 				throw err;
	// 			}
	// 		});
	// 	}
	// },
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// internal
	{
		step: "runScenarioPhoneEvents",
		exec: async (job) => {
			job.device.log("Running scenario - events...");
			const scenario = require("./scenarios/generic"); //TODO: the selected scenario should depend on the type of malware
			await scenario(job);
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "preDroidbotLog",
		exec: async (job) => {
			job.device.log("Saving logs...");
			//const output = await devUtil.adb(job, 'logcat -d');
			//await devUtil.writeToFile(job.sampleBeforePath + "/adb.log", output.stdout);
			// Save ADB log by piping since logs can well above 1MB default stdout/err buffer size
			await devUtil.dumpLogcat(job, path.join(job.sampleBeforePath, 'adb.log'));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// droidbot integration
	{
		step: "runScenarioAppInteraction",
		exec: async (job) => {
			job.device.log("Running scenario - app interaction...");
			// TODO move this to its own function
			const droidBotEnv = Object.assign({}, process.env);
			// Push the path for our ADB to the top of path so droidbot can use it.
			if ('PATH' in droidBotEnv) {
				droidBotEnv.PATH = path.dirname(config.pathADB) + ":" + droidBotEnv.PATH;
			} else {
				droidBotEnv.PATH = path.dirname(config.pathADB);
			}
			const droidBotParams = ["-d", job.device.adbID, "-a", job.apkPath, "-keep_app", "-random", "-o", path.join(job.sampleBeforePath, 'droidbot')/*, "-interval", "0.75"*/];
			if (job.device.isEmulator) {
				droidBotParams.push('-is_emulator');
			}
			if (config.droidBotEventCount > 0) {
				droidBotParams.push('-count');
				droidBotParams.push(config.droidBotEventCount.toString());
			}
			if (config.droidBotTimeout > 0) {
				droidBotParams.push('-timeout');
				droidBotParams.push(config.droidBotTimeout.toString());
			}
			// "Install" the APK again. Note that droidbot will skip the installation if AUT is already on the phone.
			// (See https://github.com/honeynet/droidbot/blob/6838e68e3fabfa2455287eacf07a94080ccaeb12/droidbot/device.py#L622-L624)
			// TODO make this configurable and perhaps add a global timeout for extra assurance.
			const proc = spawn("droidbot", droidBotParams, {env: droidBotEnv});
			//proc.stdout.on('data', (data) => {
			//	job.device.log(`DroidBot: ${data}`);
			//});
			//proc.stderr.on('data', (data) => {
			//	job.device.log(`DroidBot: ${chalk.red(data)}`);
			//});
			await new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					job.device.log("DroidBot failsafe timeout exceeded, killing...");
					proc.kill();
					resolve();
				}, config.droidBotFailsafeTimeout * 1000);
				proc.on('exit', () => {
					clearTimeout(timeout);
					resolve();
				});
				proc.on('error', () => {
					job.device.log("Failed to start DroidBot");
					clearTimeout(timeout);
					resolve();
				});
			});
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "discreteCapBefore",
		exec: async (job) => {
			job.device.log("Doing discrete feature capturing - first round...");
			await devUtil.doDiscreteCap(job, "before");
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "stopNetworkCapturing",
		exec: async (job) => {
			await devUtil.sendToEmulatorConsole(job, 'network capture stop');
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "stopBehaviorCap",
		exec: async (job) => {
			if (config.behaviorCapture === 'frida') {
				job.device.log("Stopping frida...");
				await devUtil.stopApiCap(job);
			} else if (config.behaviorCapture === 'syscall') {
				job.device.log("Stopping syscall capturing...");
				await devUtil.stopSyscallCap(job, job.packageName);
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "reboot",
		exec: async (job) => {
			job.device.log("Rebooting");
			await devUtil.adb(job, 'reboot');
			await devUtil.waitForReboot(job);
			// Bump up the pass # (before-reboot -> after-reboot)
			job.pass++;
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "restartFrida",
		exec: async (job) => {
			if (config.behaviorCapture === 'frida') {
				job.device.log("Restarting frida-server...");
				await devUtil.startFrida(job);
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "startNetworkCapturing",
		exec: async (job) => {
			await devUtil.sendToEmulatorConsole(job, 'network capture start ' + path.join(job.sampleAfterPath, 'network.pcap'));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "startPackageAfterReboot",
		exec: async (job) => {
			job.device.log("Starting package...");
			//await devUtil.wakeScreen(job);
			if (config.behaviorCapture === 'syscall') {
				await devUtil.startWithSyscallCap(job, job.packageName);
			} else if (config.behaviorCapture === 'frida') {
				await devUtil.startWithApiCap(job, job.packageName);
			}
			//await devUtil.adb(job, "shell monkey -p " + job.packageName + " 1");
			job.device.log("Waiting for " + config.startPackageWaitTime/1000 + " seconds...");
			await new Promise(resolve => setTimeout(resolve, config.startPackageWaitTime));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "runScenarioPhoneEventsAfterReboot",
		exec: async (job) => {
			job.device.log("Running scenario - events...");
			const scenario = require("./scenarios/generic"); //TODO: the selected scenario should depend on the type of malware
			await scenario(job);
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "preDroidbotLogAfterReboot",
		exec: async (job) => {
			job.device.log("Saving logs...");
			await devUtil.dumpLogcat(job, path.join(job.sampleAfterPath, 'adb.log'));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// droidbot integration
	{
		step: "runScenarioAppInteractionAfterReboot",
		exec: async (job) => {
			job.device.log("Running scenario - app interaction...");
			// TODO move this to its own function
			const droidBotEnv = Object.assign({}, process.env);
			// Push the path for our ADB to the top of path so droidbot can use it.
			if ('PATH' in droidBotEnv) {
				droidBotEnv.PATH = path.dirname(config.pathADB) + ":" + droidBotEnv.PATH;
			} else {
				droidBotEnv.PATH = path.dirname(config.pathADB);
			}
			const droidBotParams = ["-d", job.device.adbID, "-a", job.apkPath, "-keep_app", "-random", "-o", path.join(job.sampleAfterPath, 'droidbot')/*, "-interval", "0.75"*/];
			if (job.device.isEmulator) {
				droidBotParams.push('-is_emulator');
			}
			if (config.droidBotEventCount > 0) {
				droidBotParams.push('-count');
				droidBotParams.push(config.droidBotEventCount.toString());
			}
			if (config.droidBotTimeout > 0) {
				droidBotParams.push('-timeout');
				droidBotParams.push(config.droidBotTimeout.toString());
			}
			// "Install" the APK again. Note that droidbot will skip the installation if AUT is already on the phone.
			// (See https://github.com/honeynet/droidbot/blob/6838e68e3fabfa2455287eacf07a94080ccaeb12/droidbot/device.py#L622-L624)
			// TODO make this configurable and perhaps add a global timeout for extra assurance.
			const proc = spawn("droidbot", droidBotParams, {env: droidBotEnv});
			//proc.stdout.on('data', (data) => {
			//	job.device.log(`DroidBot: ${data}`);
			//});
			//proc.stderr.on('data', (data) => {
			//	job.device.log(`DroidBot: ${data}`);
			//});
			await new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					job.device.log("DroidBot failsafe timeout exceeded, killing...");
					proc.kill();
					resolve();
				}, config.droidBotFailsafeTimeout * 1000);
				proc.on('exit', () => {
					clearTimeout(timeout);
					resolve();
				});
				proc.on('error', () => {
					job.device.log("Failed to start DroidBot");
					clearTimeout(timeout);
					resolve();
				});
			});
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "discreteCapAfter",
		exec: async (job) => {
			job.device.log("Doing discrete feature capturing - second round...");
			await devUtil.doDiscreteCap(job, "after");
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "stopNetworkCapturing",
		exec: async (job) => {
			await devUtil.sendToEmulatorConsole(job, 'network capture stop');
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/*{
		step: "memdumpPost",
		exec: async (job) => {
			job.device.log("Dumping device memory (post)...");
			await devUtil.memoryDump(job, "/sdcard/memdumpPost.lime");
		}
	},*/
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "uninstallFrida",
		exec: async (job) => {
			if (config.behaviorCapture === 'frida') {
				job.device.log("Uninstalling frida...");
				await devUtil.stopApiCap(job);
				await devUtil.uninstallFrida(job);
			} else if (config.behaviorCapture === 'syscall') {
				job.device.log("Stopping syscall capturing...");
				await devUtil.stopSyscallCap(job, job.packageName);
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "disconnectEmulatorConsole",
		exec: async (job) => {
			if (job.device.isEmulator) {
				job.device.log("Disconnecting from emulator console...");
				await devUtil.disconnectEmulatorConsole(job);
			}
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// TODO Do we still need this when we have whole device rollback?
    /* {
		step: "removePackage",
		exec: async (job) => {
			job.device.log("Removing package from device...");
			await devUtil.adb(job, "uninstall " + job.packageName);
			await devUtil.lockScreen(job);
		}
	}, */
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// TODO: re-enable this once we have the new parser
/* 	{
		step: "staticParse",
		exec: async (job) => {
			job.device.log("Performing static analysis...");
			await devUtil.espExec("python " + config.serverLocation + "/parsers/Main.py" //arg 0
				+ " "
				+ job.samplePath + "/" //arg 1
				+ " "
				+ config.serverLocation + "/parsers/headers/"); //arg 2
			const postfix = "_afterinstall_tbl_sample0_" + job.md5 + ".csv";
			const batteryCSVPath = job.samplePath + "/Battery" + postfix;
			const intentCSVPath = job.samplePath + "/Intent" + postfix;
			const permCSVPath = job.samplePath + "/Perm" + postfix;

			const batteryCSVRaw = await devUtil.readFromFile(batteryCSVPath);
			job.batteryCSV = await devUtil.parseCSV(batteryCSVRaw);

			const intentCSVRaw = await devUtil.readFromFile(intentCSVPath);
			job.intentCSV = await devUtil.parseCSV(intentCSVRaw);

			const permCSVRaw = await devUtil.readFromFile(permCSVPath);
			job.permCSV = await devUtil.parseCSV(permCSVRaw);
		}
	}, */
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// TODO upload the raw feature set for data gathering mode
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "deleteFiles",
		exec: async (job) => {
			job.device.log("Deleting local analysis content...");
			if(config.deleteAnalysisDir) await del([job.temporaryPath], {force: true});
			delete job.apkPath;
			delete job.screenshotPath;
			delete job.pcapPath;
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	{
		step: "updateDatabase",
		exec: async (job) => {
			job.device.log("Updating database with collected data...");
			job.state = 4; //Done!
			Analysis.findOne({
				sha256: job.sha256
			}).exec(function (err, analysis) {
				if (err) {
					throw err;
				}
				Object.assign(analysis, job);
				analysis.save();
				delete job;
			});
			job.device.log(chalk.green("Analysis complete!"));
		}
	},
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/*{
		step: "debug",
		exec: async (job) => {
			fs.writeFile("./debug/" + job.sha256 + ".json", JSON.stringify(job, null, 2), 'utf8', function (err) {
				if (err) throw err;
			});
		}
	}*/
];
