const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const router = express.Router();

const makePdf = require('../makepdf');
const makeCsv = require('../makecsv');

const Analysis = mongoose.model('Analysis');

router.get('/:hash', function (req, res, next) {
	res.locals.active = '';

	if (!req.session.viewedAnalyses) {
		req.session.viewedAnalyses = [];
	}
	Analysis.findOne({
		'sha256': req.params.hash
	}, function (err, analysis) {
		if (err || analysis == null) {
			return res.render('analysis', {
				err: "Hash not found!"
			});
		}
		if (!req.session.viewedAnalyses.includes(analysis.sha256)) {
			req.session.viewedAnalyses.unshift(analysis.sha256);
		}
		if (req.session.viewedAnalyses.length > 4) {
			req.session.viewedAnalyses.length = 4;
		}
		res.render('analysis', {
			analysis: analysis
		});
	});
});

router.get('/:hash/screenshot', function (req, res, next) {
	Analysis.findOne({
		'sha256': req.params.hash
	}, function (err, analysis) {
		if (err) throw err;
		if(!analysis.screenshotPath) return res.end();
		res.sendFile(path.resolve(analysis.screenshotPath));
	});
});

router.get('/:hash/pcap', function (req, res, next) {
	Analysis.findOne({
		'sha256': req.params.hash
	}, function (err, analysis) {
		if (err) throw err;
		if(!analysis.pcapPath) return res.end();
		res.sendFile(path.resolve(analysis.pcapPath));
	});
});

router.get('/:hash/analysis.pdf', function (req, res, next) {
	makePdf(req, res, next);
});
router.get('/:hash/analysis.csv', function (req, res, next) {
	makeCsv(req, res, next);
});

module.exports = router;