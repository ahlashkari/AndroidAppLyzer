const path = require('path');
const spawn = require('child_process').spawn;
const chalk = require('chalk');
const uuidv4 = require('uuid/v4');
const AsyncLock = require('async-lock');
const EventEmitter = require('events');

const devUtil = require('./device-utilities');
const config = require('./config');

const activeEmulators = [];
const pendingPorts = [];
const lock = new AsyncLock();

const startEmulatorProcess = async (emulatorName, port) => {
	let emulatorEnv = Object.assign({}, process.env);
	// Assume the emulator sits within a proper SDK root (either tools/emulator or emulator/emulator)
	emulatorEnv.ANDROID_SDK_ROOT = path.join(path.dirname(config.pathEmulator), '..');
	const emulatorParams = [
		"-no-boot-anim",
		"-no-snapshot-load",
		"-no-snapshot-save",
		"-wipe-data",
		"-port", port,
		"-avd", emulatorName
	];
	if (config.hideEmulatorWindow) {
		emulatorParams.push("-no-window");
		emulatorParams.push("-no-audio");
	}
	// Syscall capture requires the selinux to be in permissive mode. Set it early.
	if (config.behaviorCapture === 'syscall') {
		emulatorParams.push('-selinux');
		emulatorParams.push('permissive');
	}
	// Use new engine
	const emulatorProcess = spawn(config.pathEmulator, emulatorParams, {env: emulatorEnv});
	emulatorProcess.on('error', (err) => {throw err});
	// This only works with very recent version of emulator (8.0+)
	//await devUtil.waitEmulatorReboot(emulatorProcess);
	return emulatorProcess;
}

const decideNextAvailableEmulator = async function () {
	const output1 = await devUtil.espExec(config.pathADB + " devices");
	const adbDevicesLines = output1.stdout.trim().split("\n");

	const emulatorPrefix = "emulator-";
	// https://developer.android.com/studio/run/emulator-commandline
	const emulatorPortRange = [5554, 5682];
	// From the above doc: The range is 5554 to 5682, allowing for 64 concurrent virtual devices.
	const maxEmulatorCount = Math.floor((emulatorPortRange[1] - emulatorPortRange[0]) / 2);

	let occupiedPorts = [];

	for(let i = 0; i < adbDevicesLines.length; i++){
		const currentLine = adbDevicesLines[i];
		if(currentLine.substr(0, emulatorPrefix.length) !== emulatorPrefix) continue;
		const port = parseInt(currentLine.substr(emulatorPrefix.length, emulatorPrefix.length+4));
		// This implies port+1 is used as well since each avd usually listens on 2 ports: the console port and the adb port (which is by default <console port>+1)
		occupiedPorts.push(port);
	}
	occupiedPorts = occupiedPorts.concat(pendingPorts);

	if(occupiedPorts.length >= maxEmulatorCount) throw new Error("No emulator ports available!");

	let newPort = emulatorPortRange[0];
	for( ; newPort <= emulatorPortRange[1]; newPort += 2){
		if(occupiedPorts.includes(newPort)) continue;
		break;
	}

	const output2 = await devUtil.espExec(config.pathEmulator + " -list-avds")
	const fetchedEmulatorList = output2.stdout.trim().split("\n");

	if(fetchedEmulatorList.length == 0) {
	    throw new Error("No emulator profile found. Please use \"avdmanager create avd\" to create at least one emulator profile before continuing.");
	}
	for(let i = 0; i < fetchedEmulatorList.length; i++){
		if(!activeEmulators.includes(fetchedEmulatorList[i])){
			const newEmulatorName = fetchedEmulatorList[i];
			const emulatorAdbName = emulatorPrefix + newPort;
			activeEmulators.push(newEmulatorName);
			pendingPorts.push(newPort);
			return {
				port: newPort,
				name: newEmulatorName,
				adbName: emulatorAdbName
			}
		}
	}
	return null;
}

const removePendingPort = function (port) {
	// Remove all items that matches newPort
	let j = -1;
	while ((j = pendingPorts.indexOf(port, (j < 0 ? 0 : j))) >= 0) {
		pendingPorts.splice(j, 1);
	}
}

const removeActiveEmulator = function (name) {
	let i = -1;
	while ((i = activeEmulators.indexOf(name, (i < 0 ? 0 : i))) >= 0) {
		activeEmulators.splice(i, 1);
	}
}

module.exports = async (vorpal) => {
	let allocatedEmulator = null;
	try {
		allocatedEmulator = await lock.acquire('decision', (done) => {
			decideNextAvailableEmulator().then(ret => {
				done(null, ret);
			}, err => {
				done(err, null);
			});
		});
	} catch (e) {
		// pass
	}


	if (allocatedEmulator) {
		vorpal.log("Starting emulator " + chalk.blue(allocatedEmulator.adbName) + " using profile " + chalk.green(allocatedEmulator.name) + "...");
		const emulatorProcess = await startEmulatorProcess(allocatedEmulator.name, allocatedEmulator.port);
		emulatorProcess.cleanup = async function () {
			await new Promise((resolve) => {
				vorpal.log("Shutting down " + chalk.green(allocatedEmulator.name));
				const timeout = setTimeout(() => {
					// force quit after 10s timeout
					vorpal.log("Force quit due to timeout");
					emulatorProcess.kill('SIGKILL');
					emulatorProcess.removeAllListeners('error');
					emulatorProcess.removeAllListeners('exit');
					removeActiveEmulator(allocatedEmulator.name);
					// Add a little bit of delay since ADBD isn't responding to emulator shutdown fast enough
					setTimeout(resolve, 1000);
				}, 10000);
				// send SIGTERM and wait
				emulatorProcess.kill();
				// if the process quits as expected, quit waiting
				emulatorProcess.once('exit', () => {
					vorpal.log("Clean quit");
					clearTimeout(timeout);
					emulatorProcess.removeAllListeners('error');
					removeActiveEmulator(allocatedEmulator.name);
					setTimeout(resolve, 1000);
				});
				// if there's an error, the process might not exist already. Send a SIGKILL for extra assurance
				emulatorProcess.once('error', () => {
					// Use the force
					vorpal.log("Error when quit, attempting force quit");
					clearTimeout(timeout);
					emulatorProcess.kill('SIGKILL');
					emulatorProcess.removeAllListeners('exit');
					removeActiveEmulator(allocatedEmulator.name);
					setTimeout(resolve, 1000);
				});
			});
		}
		// Sync with the emulator
		//vorpal.log("Waiting for " + chalk.green(allocatedEmulator.name) + " to fully start...");
		try {
			await devUtil.espExecFile(config.pathADB, ['-s', allocatedEmulator.adbName, 'wait-for-device']);
		} catch (e) {
			vorpal.log(chalk.red(`Failed waiting for emulator to become available: ${e.message}.`));
			await emulatorProcess.cleanup();
			removePendingPort(allocatedEmulator.port);
			return null;
		}

		removePendingPort(allocatedEmulator.port);
		return { //TODO: duplicated code, maybe make a device class?
			emulatorPort: allocatedEmulator.port,
			emulatorName: allocatedEmulator.name,
			emulatorProcess: emulatorProcess,
			emulatorConsole: null,
			emulatorConsoleCommandResult: new EventEmitter(),
			emulatorConsoleReadLine: null,
			uuid: uuidv4(),
			adbID: allocatedEmulator.adbName,
			product: allocatedEmulator.adbName,
			available: true,
			job: null,
			verbose: true, //TODO: how can we make emulators verbose if they aren't in the device list?
			enabled: true,
			isEmulator: true,
			lastLog: "",
			fridaHelperProcess: null,
			fridaHelperReadLineOutput: null,
			fridaStdoutProxy: null,
			get log () {
				return (msg) => {
					this.lastLog = msg;
					if(this.verbose){
						vorpal.log(chalk.rgb(255, 233, 0)(this.product + ": ") + msg);
					}
				};
			}
		};
	} else {
		return null;
	}
}
