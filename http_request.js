"use strict";

var url = require("url");

function decideAuth(headers) {
	var header = headers.authorization || '';
	var headerParts = header.split(/\s+/);
	var authType = headerParts.shift() || '';

	if (authType === "Basic") {
		var token = headerParts.pop() || '',
			auth = new Buffer(token, 'base64').toString(),
			parts = auth.split(/:/);
		
		return {
			type: authType,
			username: parts[0],
			password: parts[1]
		};
	} else if (authType === "OAuth") {
		/*
		 * If the request has an OAuth header, we pass that header along
		 * to the FreshBooks server. We also extract the "freshbooks_domain"
		 * parameter (can also be "oauth_freshbooks_domain") so that we
		 * know where to send the request (since the domain would've
		 * otherwise been specified by Basic Auth).
		 */
		return {
			type: authType,
			header: header,
			domain: header.match(/freshbooks_domain="([a-zA-Z0-9]*)"/)[1]
		};
	} else {
		return null;
	}
}

exports.parse = function(request) {
	var urlbits = url.parse(request.url, true);
	return {
		auth: decideAuth(request.headers),
		pathname: urlbits.pathname,
		queryString: urlbits.query
	};
};
