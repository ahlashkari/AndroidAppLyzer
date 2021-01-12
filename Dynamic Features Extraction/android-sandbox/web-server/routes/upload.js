const express = require('express');
const router = express.Router();

const espionage = require('../espionage');

router.post('/', function (req, res, next) {
	espionage.analyse(req, res, next);
});

module.exports = router;