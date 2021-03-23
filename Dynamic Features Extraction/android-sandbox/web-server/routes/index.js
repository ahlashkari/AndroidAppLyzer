const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', function (req, res, next) {
	res.locals.active = 'home';
	res.render('home');
});

router.get('/about', function (req, res, next) {
	res.locals.active = 'about';
	res.render('about');
});

module.exports = router;