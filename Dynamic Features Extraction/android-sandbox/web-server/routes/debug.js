const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Analysis = mongoose.model('Analysis');
const User = mongoose.model('User');

router.get('/analyses', function (req, res, next) {
	res.locals.active = 'debuganalyses';
	Analysis.find(function (err, analyses) {
		if(err){
			res.locals.debug = JSON.stringify(err, null, 2);
		}else{
			res.locals.debug = JSON.stringify(analyses, null, 2);
		}
		res.render('debug/debug');
	});
});

router.get('/users', function (req, res, next) {
	res.locals.active = 'debugusers';
	User.find(function (err, users) {
		if(err){
			res.locals.debug = JSON.stringify(err, null, 2);
		}else{
			res.locals.debug = JSON.stringify(users, null, 2);
		}
		res.render('debug/debug');
	});
});

module.exports = router;