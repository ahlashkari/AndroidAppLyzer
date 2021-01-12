const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const packageInfo = require('../package.json');
const configLocation = "./configuration.json";
const configDefaultLocation = "./configuration-defaults.json";

let config = {};

if (fs.existsSync(configLocation)) {
	config = JSON.parse(fs.readFileSync(configLocation, 'utf8'));
} else {
	config = JSON.parse(fs.readFileSync(configDefaultLocation, 'utf8'));
	fs.writeFile(configLocation, JSON.stringify(config, null, "\t"), function (err) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(chalk.green(configLocation + " created! Please modify this before starting the analysis server again."));
		process.exit(0);
	});
}

config.packageInfo = packageInfo;
config.serverLocation = path.dirname(require.main.filename);

const apkIndexPath = path.join(config.pathAPKStore, 'index.json');
if (fs.existsSync(apkIndexPath)) {
	config.apkStore = JSON.parse(fs.readFileSync(apkIndexPath, 'utf8'));
} else {
	config.apkStore = {};
}

module.exports = config;