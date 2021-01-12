const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const router = express.Router();

const config = require('../config');
const middleware = require('../middleware');

const User = mongoose.model('User');

router.get('/', function (req, res) {
	res.redirect('/');
});

router.get('/login', function (req, res) {
	res.render('auth/login', {
		user: req.user
	});
});

router.get('/register', function (req, res) {
	if (config.registrationDisabled) {
		return res.render('auth/register', {
			err: config.registrationDisabledNote
		});
	}
	res.render('auth/register', {
		user: req.user
	});
});

router.get('/changepassword', middleware.onlyLoggedIn, function (req, res) {
	res.render('auth/changepassword', {
		user: req.user
	});
});

router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

router.post('/login', passport.authenticate('local'), function (req, res) { //TODO: make incorrect login return friendly error page
	res.redirect('/');
});

router.post('/register', function (req, res) {
	if (config.registrationDisabled) {
		return res.render('auth/register', {
			err: config.registrationDisabledNote
		});
	}

	if (req.body.password.length < 8) {
		return res.render('auth/register', {
			err: "You password must be 8 characters or longer!"
		});
	}

	if (req.body.password !== req.body.confirmPassword) {
		return res.render('auth/register', {
			err: "Your passwords do not match!"
		});
	}

	User.register(new User({
		username: req.body.username,
		email: req.body.email
	}), req.body.password, function (err, user) {
		if (err) {
			return res.render('auth/register', {
				user: user,
				err: err
			});
		}

		passport.authenticate('local')(req, res, function () {
			res.redirect('/');
		});
	});
});

router.post('/changepassword', function (req, res) {
	if (req.body.newPassword !== req.body.confirmNewPassword) {
		return res.render('auth/changepassword', {
			err: "Your new passwords do not match!"
		});
	}

	console.log(req.user);

	req.user.changePassword(req.body.currentPassword, req.body.newPassword, function (err) { //TODO: test this
		if (err) {
			return res.render('auth/changepassword', {
				user: user,
				err: err
			});
		}
		res.redirect('/');
	});
});

module.exports = router;