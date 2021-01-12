const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const multiparty = require('multiparty');
const router = express.Router();

const config = require('../config');

const Analysis = mongoose.model('Analysis');

router.post('/upload/:hash/:property', function (req, res, next) { //TODO: authentication!
	Analysis.findOne({
		'sha256': req.params.hash
	}, function (err, analysis) {
		const form = new multiparty.Form();
		form.parse(req, function (err, fields, files) {
			if (((typeof files) === 'undefined') || !('file' in files)) {
				res.status(400).send('Missing required field: "file".');
				return;
			}
			const file = files.file[0];
			//const file = files[0];
			analysis[req.params.property] = config.pathTemporary + "/" + file.originalFilename; //TODO: save files permenantly
			fs.createReadStream(file.path).pipe(fs.createWriteStream(analysis[req.params.property])); //TODO: error handling
			analysis.save();
			res.end(); //TODO: return errors to analysis serv.
		});
	});
});

router.get('/download/:hash/:property', function (req, res, next) { //TODO: authentication!
	Analysis.findOne({
		'sha256': req.params.hash
	}, function (err, analysis) {
		if (err) throw err;
		if(!analysis[req.params.property]) return res.end();
		res.sendFile(path.resolve(analysis[req.params.property]));
	});
});

module.exports = router;
