const mongoose = require('mongoose');

module.exports.onlyUnbanned = function (req, res, next) {
	if (req.user && req.user.tags.includes("banned")) {
		//req.logout();
		return res.redirect("/banned");
	}
	next();
}

module.exports.onlyLoggedIn = function (req, res, next) {
	if (!req.user) {
		return res.redirect("/auth/login");
	}
	module.exports.onlyUnbanned(req, res, next);
}

module.exports.onlyAdministrator = function (req, res, next) {
	if (!req.user.tags.includes("administrator")) {
		return res.redirect("/");
	}
	module.exports.onlyLoggedIn(req, res, next);
}

module.exports.injectUserData = function (req, res, next) {
	if(!req.user){
		return next();
	}
	const Analysis = mongoose.model('Analysis');
	res.locals.user = req.user;

	const loadLocalAnalyses = () => {
		Analysis.find({'owner': req.user._id}).sort('-createdAt').limit(10).exec(function (err, analyses) { //TODO: optimize?
			if (err) throw err;
			res.locals.recentAnalyses = analyses;
			next();
		});
	}

	if(req.user.tags.includes("administrator")){
		Analysis.find({"state": 1}).exec(function (err, analyses) {
			res.locals.approvalQueueCount = analyses.length;
			loadLocalAnalyses();
		});
	}else{
		loadLocalAnalyses();
	}
}