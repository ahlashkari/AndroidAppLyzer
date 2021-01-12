const mongoose = require('mongoose');
const chalk = require('chalk');
const config = require('../config');

mongoose.Promise = global.Promise;

module.exports = async (vorpal) => {
	try {
		let dbAuthString = config.dbUser + ":" + config.dbPassword + "@";
		if(!config.dbAuthenticate){
			dbAuthString = "";
		}
		let dbUrl = "mongodb://" + dbAuthString + config.dbHost + ":" + config.dbPort + "/" + config.dbName;
		let options = {useNewUrlParser: true};
		// https://mongoosejs.com/docs/deprecations.html
		options.useCreateIndex = true;
		options.useUnifiedTopology = true;

		if(config.dbNewDriver){
			dbUrl = "mongodb+srv://" + dbAuthString + config.dbHost + "/" + config.dbName + "?replicaSet=" + config.dbReplicaSet + "&retryWrites=true";
			options.replicaSet = config.dbReplicaSet;
			options.auth = {authdb: "admin"};
		}

		await mongoose.connect(dbUrl, options);
		vorpal.log(
			chalk.magenta(config.packageInfo.name)
			+ " connected to "
			+ chalk.green(config.dbName)
			+ " database at "
			+ chalk.blue(config.dbHost)
			+ (config.dbPort != 0 ? (":" + chalk.blue(config.dbPort)):""));
	} catch (err) {
		vorpal.log(err);
		process.exit(1);
	}
}
