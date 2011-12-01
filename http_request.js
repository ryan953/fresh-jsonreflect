"use strict";

var url = require("url");

function basicAuth(headers) {
	var header = headers.authorization || '',
		token = header.split(/\s+/).pop() || '',
		auth = new Buffer(token, 'base64').toString(),
		parts = auth.split(/:/);
	return {
		username: parts[0],
		password: parts[1]
	};
}

exports.parse = function(request) {
	var urlbits = url.parse(request.url, true);
	return {
		auth: basicAuth(request.headers),
		pathname: urlbits.pathname,
		queryString: urlbits.query
	};
};
