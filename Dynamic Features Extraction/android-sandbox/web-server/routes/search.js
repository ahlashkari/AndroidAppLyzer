const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Analysis = mongoose.model('Analysis');

router.post('/', function (req, res, next) {
	const md5Length = 32;
	const sha1Length = 40;
	const sha256Length = 64;
	let searchField = "";
	switch(req.body["search-text"].length){
		case md5Length:
			searchField = "md5";
			break;
		case sha1Length:
			searchField = "sha1";
			break;
		case sha256Length:
			searchField = "sha256";
			break;
	}
	const searchParams = {};
	searchParams[searchField] = req.body["search-text"];
	Analysis.findOne(searchParams, function (err, analysis) {
		if (err || analysis == null) {
			console.log(err);
			return res.redirect("/");
		}
		res.redirect("/analyse/" + analysis.sha256);
	});
});

module.exports = router;