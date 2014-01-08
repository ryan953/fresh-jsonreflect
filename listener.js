"use strict";

var http = require("http");
var qs = require("querystring");

var http_request = require('./http_request');

function cors(req, res, next) {
    var oneof = false;
    var headers = {};
// console.log(req);
    if(req.headers.origin) {
        headers['Access-Control-Allow-Origin'] = req.headers.origin;
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        headers['Access-Control-Allow-Methods'] = req.headers['access-control-request-method'];
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        headers['Access-Control-Allow-Headers'] = req.headers['access-control-request-headers'];
        oneof = true;
    }
    if(oneof) {
    	headers['Access-Control-Max-Age'] = 60 * 60 * 24 * 365;
    }

    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
    	res.writeHead(200, headers);
    	res.end();
        console.log('responded to cors preflight');
    }
    else {
        next();
    }
}

function checkAuth(req, res, next) {
	var input = http_request.parse(req);
	var authIsEmpty = (input.auth == null || typeof(input.auth) == 'undefined');

	/* If no authentication details could be found, respond with 401 */
	if (req.method !== 'options' && authIsEmpty) {
		// console.log('auth is not good. ending', req.method, authIsEmpty, input.auth);
		res.writeHead(401);
		res.end();
	} else {
		console.log('auth looks ok, moving on');
		// console.log('yolo auth');
		next();
	}
}

function handle(request, response, API, next) {
	var input = http_request.parse(request);
	var cmd = new API(input.auth, input.pathname);
	
	var finish = function(statusCode, xml) {
		response.writeHead(statusCode, {
			'Access-Control-Allow-Origin': request.headers.origin,
			// 'Access-Control-Max-Age': 60 * 60 * 24 * 365,
			'Content-Type':'application/json'
		});
		response.write(xml);
		response.end();

		// console.log(response);
	}
	
	if (request.method == 'POST') {
		var body = '';
		request.on('data', function (data) {
			body += data;
		});
		request.on('end', function () {
			try {
				var parsed = (body === "") ? body : JSON.parse(body);
				cmd.exec(input.pathname, parsed, finish);
			} catch (e) {
				/* Catch SyntaxErrors and return 400 if one occurs */
				if (e instanceof SyntaxError) {
					finish(400, '{ "error": "Bad syntax" }');
				}
			}
		});
	} else if (request.method == 'GET') {
		// console.log('got a get', request);
		// request.on('end', function() {
			// console.log('request eneded');
			cmd.exec(input.pathname, input.queryString, finish);
		// });
	}
}

function listen(API, exec) {
	function onRequest(req, res) {

		cors(req, res, function() {
			checkAuth(req, res, function() {
				handle(req, res, API, function() {});
			});
		});

	}

	http.createServer(onRequest).listen(8888);
	console.log("Server has started.");
}

exports.listen = listen;
