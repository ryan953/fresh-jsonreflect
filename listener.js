"use strict";

var http = require("http");
var qs = require("querystring");

var http_request = require('./http_request');

function listen(API, exec) {
	function onRequest(request, response) {
		var input = http_request.parse(request);

		var cmd = new API(input.auth.username, input.auth.password);
		
		function finish(statusCode, xml) {
			response.writeHead(200,{'Content-Type':'application/json'});
			response.write(xml);
			response.end();
		}
		
		if (request.method == 'POST') {
			var body = '';
			request.on('data', function (data) {
				body += data;
			});
			request.on('end', function () {
				cmd.exec(input.pathname, JSON.parse(body), finish);
			});
		} else if (request.method == 'GET') {
			request.on('end', function() {
				cmd.exec(input.pathname, input.queryString, finish);
			});
		}
	}

	http.createServer(onRequest).listen(8888);
	console.log("Server has started.");
}

exports.listen = listen;
