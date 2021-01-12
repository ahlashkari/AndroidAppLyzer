const hex = function (buffer) {
	var hexCodes = [];
	var view = new DataView(buffer);
	for (var i = 0; i < view.byteLength; i += 4) {
		// Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
		var value = view.getUint32(i)
		// toString(16) will give the hex representation of the number without padding
		var stringValue = value.toString(16)
		// We use concatenation and slice for padding
		var padding = '00000000'
		var paddedValue = (padding + stringValue).slice(-padding.length)
		hexCodes.push(paddedValue);
	}

	// Join all the hex strings into one
	return hexCodes.join("");
}

const insertRandomSHAString = function (len = 8) {
	const id = "" + Math.floor(Math.random() * 1000000);
	document.write('<code id="' + id + '"></code>');
	var randomBytes = crypto.getRandomValues(new Uint8Array(32));
	crypto.subtle.digest("SHA-256", randomBytes).then(function (hash) {
		const hexString = hex(hash);
		const shortHexString = (len < hexString.length ? hexString.substring(0, len) : hexString)
		const finalHexString = (hexString.length == shortHexString.length ? shortHexString : shortHexString + "...");
		$('#' + id).text(finalHexString);
	});
}

const insertRandomIcon = function () {
	const id = "" + Math.floor(Math.random() * 1000000);
	document.write('<svg id="' + id + "-icon" + '" height="1em"></svg>');
	jdenticon.update($('#' + id + "-icon")[0], id);
}

$("#device-type").on("change", function(){
	const deviceType = $("#device-type").val().toLowerCase();
	if(deviceType == "phone"){
		$("#phone-verification-alert").show();
	}else{
		$("#phone-verification-alert").hide();
	}
});

hljs.initHighlightingOnLoad();