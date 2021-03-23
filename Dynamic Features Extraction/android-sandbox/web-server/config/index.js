const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
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
		console.log(chalk.green(configLocation + " created! Please modify this before starting the web server again."));
		process.exit(0);
	});
}

config.pathProjectRoot = path.dirname(require.main.filename) + "/..";

module.exports = config;