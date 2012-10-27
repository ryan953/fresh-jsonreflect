"use strict";

var http = require("https");

var path = require('path');
var util = require('util');
var event = require('events');
var endpoint = "%s.freshbooks.com";
var entry_point = '/api/2.1/xml-in';
var Converter = require('./converter');

function Request(subdomain, token) {
	this.subdomain = subdomain;
	this.token = token;
	this.emitter = event.EventEmitter;
}
(function(klass) {
	klass.prototype.exec = function(action, body, finish) {
		var self = this,
			domain = util.format(endpoint, this.subdomain),
			conv = new Converter.Converter(),
			request = conv.stripAttributes(body);

		/* Convert requested path into an API Method (e.g., /invoice/list to invoice.list) */
		var apiMethod = path.normalize(action).replace(/^\/|\/$/g, '').replace(/\//g, '.');

		request['@'] = {method: apiMethod};

		conv.on('toXML', function(err, xml) {
			var result = '';
			var options = {
				hostname: domain,
				port: 443,
				path: entry_point,
				method: 'POST',
				auth: util.format("%s:x", self.token),
				headers: {
					'Content-length': xml.length
				}
			};
			console.log(options);
			
			var req = http.request(options, function(res) {
				//console.log('STATUS: ' + res.statusCode);
				//console.log('HEADERS: ' + JSON.stringify(res.headers));
				var rtrn_body = '';
				res.setEncoding('utf8');
				res.on('data', function(chunk) {
					rtrn_body += chunk;
				});
				res.on('end', function() {
					Converter.Converter.XMLtoJSON(rtrn_body, function(err, json) {
						finish(res.statusCode, JSON.stringify(json));
					});
				});
			});
			
			req.on('error', function(e) {
			  console.log('problem with request: ' + e.message);
			});
			
			// write data to request body
			req.write(xml);
			req.end();
			
			
			//result += util.format("System: %s\n", domain);
			//result += util.format("Token: %s\n", self.token);
			//result += util.format("Action: %s\n", action);
			//result += util.format("Body: %j\n", body);
			//result += util.format("Request: %j\n", request);
			//result += util.format("to XML: %s\n", xml);
			//console.log(result);
			//emit result?
		});
		
		conv.JSONtoXML(request);
	};
})(Request);

exports.API = Request;
