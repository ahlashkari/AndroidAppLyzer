const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const config = require('../config');

const Analysis = mongoose.model('Analysis');
const User = mongoose.model('User');

router.get('/analyses', function (req, res, next) {
	res.locals.active = 'adminanalyses';
	let skipVal = 0;
	let perPage = config.tableLengthPerPage;
	if(!isNaN(req.query.startAt)) skipVal = parseInt(req.query.startAt);
	if(!isNaN(req.query.perPage)) perPage = parseInt(req.query.perPage);
	Analysis.count({state: {"$ne": 1}}, function(err, count){
		Analysis.find({state: {"$ne": 1}}).sort({'_id': -1}).skip(skipVal).limit(perPage).populate('owner').exec(function (err, analyses) {
			if(err){
				return res.end(err);
			}else{
				res.locals.analyses = analyses;
				res.locals.analysesCount = count;
				res.locals.skipVal = skipVal;
				res.locals.perPage = perPage;
			}
			res.render('admin/analyses');
		});
	});
});

router.get('/approvalqueue', function (req, res, next) {
	res.locals.active = 'adminapprovalqueue';
	let skipVal = 0;
	let perPage = config.tableLengthPerPage;
	if(!isNaN(req.query.startAt)) skipVal = parseInt(req.query.startAt);
	if(!isNaN(req.query.perPage)) perPage = parseInt(req.query.perPage);
	Analysis.count({state: 1}, function(err, count){
		Analysis.find({state: 1}).sort({'_id': 1}).skip(skipVal).limit(perPage).populate('owner').exec(function (err, analyses) {
			if(err){
				return res.end(err);
			}else{
				res.locals.analyses = analyses;
				res.locals.analysesCount = count;
				res.locals.skipVal = skipVal;
				res.locals.perPage = perPage;
			}
			res.render('admin/approvalqueue');
		});
	});
});

router.get('/users', function (req, res, next) {
	res.locals.active = 'adminusers';
	let skipVal = 0;
	let perPage = config.tableLengthPerPage;
	if(!isNaN(req.query.startAt)) skipVal = parseInt(req.query.startAt);
	if(!isNaN(req.query.perPage)) perPage = parseInt(req.query.perPage);
	User.countDocuments({}, function(err, count){
		User.find().sort({'_id': -1}).skip(skipVal).limit(perPage).exec(function (err, users) {
			if(err){
				return res.end(err); //TODO: throw friendly error
			}else{
				res.locals.users = users;
			}
			Analysis.aggregate([
				{"$group": { _id: "$owner", count: {$sum: 1}}} // Get a count of analyses for each user
			]).exec(function(err, userCounts){
				if(err){
					return res.end(err); //TODO: throw friendly error
				}else{
					res.locals.users = res.locals.users.map(x => Object.assign(x, userCounts.find(y => x._id.equals(y._id)))); // Merge counts with returned users
					res.locals.users = res.locals.users.map(x => Object.assign(x, x, {x: x.count = x.count || 0})); // Set rest to zero
					
					res.locals.usersCount = count;
					res.locals.skipVal = skipVal;
					res.locals.perPage = perPage;
					res.render('admin/users');
				}
			});
		});
	});
});

router.get('/users/:user', function (req, res, next) {
	res.locals.active = 'adminusers';
	User.findOne({_id: req.params.user}).exec(function (err, user) {
		if(err){
			return res.end(err);
		}else{
			res.locals.foundUser = user;
		}
		res.render('admin/user');
	});
});

router.get('/banuser/:user', function (req, res, next) {
	User.findOne({_id: req.params.user}).exec(function (err, user) {
		if(err){
			return res.end(err);
		}else{
			const bannedIndex = user.tags.indexOf("banned");
			if (bannedIndex === -1) {
				user.tags.push("banned");
			}
			user.save();
			res.redirect(req.header('Referer') || '/admin/users');
		}
	});
});

router.get('/unbanuser/:user', function (req, res, next) {
	User.findOne({_id: req.params.user}).exec(function (err, user) {
		if(err){
			return res.end(err);
		}else{
			const bannedIndex = user.tags.indexOf("banned");
			if (bannedIndex !== -1) {
				user.tags.splice(bannedIndex, 1);
			}
			user.save();
			res.redirect(req.header('Referer') || '/admin/users');
		}
	});
});

router.get('/promoteuser/:user', function (req, res, next) {
	User.findOne({_id: req.params.user}).exec(function (err, user) {
		if(err){
			return res.end(err);
		}else{
			const administratorIndex = user.tags.indexOf("administrator");
			if (administratorIndex === -1) {
				user.tags.push("administrator");
			}
			user.save();
			res.redirect(req.header('Referer') || '/admin/users');
		}
	});
});

router.get('/demoteuser/:user', function (req, res, next) {
	User.findOne({_id: req.params.user}).exec(function (err, user) {
		if(err){
			return res.end(err);
		}else{
			const administratorIndex = user.tags.indexOf("administrator");
			if (administratorIndex !== -1) {
				user.tags.splice(administratorIndex, 1);
			}
			user.save();
			res.redirect(req.header('Referer') || '/admin/users');
		}
	});
});

router.get('/deleteuser/:user', function (req, res, next) {
	User.findOne({_id: req.params.user}).exec(function (err, user) {
		if(err){
			return res.end(err);
		}else{
			user.remove();
			res.redirect('/admin/users');
		}
	});
});

router.get('/approveanalysis/:hash/:deviceType', function (req, res, next) {
	Analysis.findOne({sha256: req.params.hash}).exec(function (err, analysis) {
		if(err){
			return res.end(err);
		}else{
			analysis.deviceType = req.params.deviceType;
			analysis.state = 2;
			analysis.save();
			res.redirect('back');
		}
	});
});

router.get('/deleteanalysis/:hash', function (req, res, next) {
	Analysis.findOne({sha256: req.params.hash}).exec(function (err, analysis) {
		if(err){
			return res.end(err);
		}else{
			analysis.remove();
			res.redirect('back');
		}
	});
});

module.exports = router;