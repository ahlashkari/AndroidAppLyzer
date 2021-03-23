const mongoose = require('mongoose');
const pdfmake = require('pdfmake');

const Analysis = mongoose.model('Analysis');

module.exports = (req, res, next) => 
{
	Analysis.findOne({
		'sha256': req.params.hash
	}, function (err, analysis) {
		if (err) throw err;
		if(analysis.state != 4) return res.end("Analysis not completed, report cannot be generated!");

		let batteryArray = [];
		for(let i = 0; i < analysis.batteryCSV[0].length; i++){
			let key = analysis.batteryCSV[0][i];
			let val = analysis.batteryCSV[1][i];
			batteryArray.push([key, val]);
		}
		if(batteryArray.length == 0){
			batteryArray.push(["No results", "No results"])
		}

		let intentArray = [];
		for(let i = 0; i < analysis.intentCSV[0].length; i++){
			let key = analysis.intentCSV[0][i];
			let val = analysis.intentCSV[1][i];

			const splitStr = key.split("\""); //TODO: ew
			if(splitStr.length > 1){
				key = splitStr[1];
			}
			intentArray.push([key, val]);
		}
		if(intentArray.length == 0){
			intentArray.push(["No results", "No results"])
		}

		let permissionArray = [];
		for(let i = 0; i < analysis.permCSV[0].length; i++){
			let key = analysis.permCSV[0][i];
			let val = analysis.permCSV[1][i];
			permissionArray.push([key, val]);
		}
		if(permissionArray.length == 0){
			permissionArray.push(["No results", "No results"])
		}

		const docDefinition = {
			content: [
				{
					image: "public/img/logo.png",
					width: 200,
					alignment: "center"
				},
				{text: "Epsionage analysis report", fontSize: 15, alignment: "center", margin: 4},
				{text: "Generated on " + new Date(), fontSize: 10, alignment: "center", margin: 2},
				{text: "1 - About Espionage Droid Sandbox", margin: [0, 20, 0, 5], bold: true},
				{
					text: "We have designed a comprehensive and intelligent Android sandbox, named Espionage Droid Sandbox, that for the first time is able to activate malware while running on real smartphones. In Espionage Droid Sandbox, we capture both static and dynamic features. We have meticulously profiled malware behavior to be used in our malware detection and classification tactics, and are proposing this system to release you from any risk posed by application installation.",
					margin: [0, 10, 0, 0]
					
				},
				{
					text: "Some benefits of using Espionage Droid Sandbox are:",
					margin: [0, 10, 0, 0]
					
				},
				{
					ul: [
						"Real-world simulation by running apps on real smartphones.",
						"Activating malware based on the inherited scenario of its category.",
						"Provides an overall view of both static and dynamic behavior.",
						"Provides access to a monthly up-to-date Android malware dataset."
					],
					margin: [20, 10, 0, 0]
				},
				{
					text: "This report is generated based on your uploaded .apk file.",
					margin: [0, 10, 0, 0]
					
				},
				{text: "2 - Specification", margin: [0, 20, 0, 5], bold: true},
				{
					text: "Below you can find the fingerprints which uniquely represent your application. You can use these to locate reports for your uploaded .apk file through our repository, or any other repository.",
					margin: [0, 10, 0, 0]
					
				},
				{text: "General", margin: [0, 20, 0, 5]},
				{
					table: {
						body: [
							["Package", analysis.packageName],
							["File name", analysis.fileName],
							["Device type", analysis.deviceType.toUpperCase()]
						]
					}
				},
				{text: "Digests", margin: [0, 20, 0, 5]},
				{
					table: {
						body: [
							["SHA-256", analysis.sha256],
							["SHA-1", analysis.sha1],
							["MD5", analysis.md5]
						]
					}
				},
				{text: "3 - Permissions", margin: [0, 20, 0, 5], bold: true},
				{
					text: "These are the requested permissions extracted directly from the manifest file in your uploaded .apk file.",
					margin: [0, 10, 0, 10]
				},
				{
					table: {
						body: permissionArray
					}
				},
				{text: "4 - Intents", margin: [0, 20, 0, 5], bold: true},
				{
					text: "These are the actions of the Reciever and Activity components, extracted from the manifest file in your uploaded .apk file by our intent filtering procedure.",
					margin: [0, 10, 0, 10]
				},
				{
					table: {
						body: intentArray
					}
				},
				{text: "DEBUG - Battery", margin: [0, 20, 0, 5], bold: true}, //TODO: remove before release!
				{
					table: {
						body: batteryArray
					}
				},
				{text: "5 - Screenshot", margin: [0, 20, 0, 5], bold: true, pageBreak: "before"},
				{
					text: "This picture is taken from the foreground of your uploaded application after installing and running it on the phone or emulator.",
					margin: [0, 10, 0, 10]
				},
				{
					image: analysis.screenshotPath,
					width: "350",
					alignment: "center"
				},
			]
		}
		const fontDescriptors = {
			Roboto: {
				normal: "fonts/Roboto-Regular.ttf",
				bold: "fonts/Roboto-Medium.ttf",
				italics: "fonts/Roboto-Italic.ttf",
				bolditalics: "fonts/Roboto-MediumItalic.ttf"
			}
		};
		const printer = new pdfmake(fontDescriptors);
		const pdf = printer.createPdfKitDocument(docDefinition);
		pdf.end();
		pdf.pipe(res);
	});
}