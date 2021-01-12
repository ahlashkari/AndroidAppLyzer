const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
	sha256: { type: String, lowercase: true, unique: true, index: true },
	sha1: { type: String, lowercase: true },
	md5: { type: String, lowercase: true },
	path: String,
	fileName: String,
	packageName: String,
	permissions: {
		usesPermission: [String],
		usesPermissionSdk23: [String],
		permission: [String]
	},
	batteryCSV: [],
	intentCSV: [],
	permCSV: [],
	screenshotPath: String,
	pcapPath: String,
	deviceType: String,
	family: String,
	category: String,
	owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	state: Number,
	error: String
}, { timestamps: true });

module.exports = mongoose.model('Analysis', AnalysisSchema);