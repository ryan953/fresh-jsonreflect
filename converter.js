"use strict";

var util = require('util'),
	events = require("events"),
	xml2js = require('xml2js'),
	parser = new xml2js.Parser({
		emptyTag:''
		
	}),
	builder = require('xmlbuilder');

function Converter() {
	events.EventEmitter.call(this);
}
util.inherits(Converter, events.EventEmitter);


Converter._buildXML = function(root, children) {
	for(var c in children) {
		if (children.hasOwnProperty(c)) {
			if (c == '@') {
				for(var att in children[c]) {
					if (children[c].hasOwnProperty(att)) {	
						root.att(att, children[c][att]);
					}
				}
			} else {
				if (typeof(children[c])== 'object') {
					console.log('child is obj', c);
					var child = root.ele(c);
					Converter._buildXML(child, children[c]);
				} else {
					root.ele(c).txt(children[c]);
				}
			}
		}
	}
	return root;
};

Converter.XMLtoJSON = function(xml, callback) {
	parser.parseString(xml, callback);
};

Converter.JSONtoXML = function(json, callback) {
	setTimeout(function() {
		var doc = builder.create(),
			root = doc.begin('request');
			
		console.log('building xml from', json);
		Converter._buildXML(root, json);
		callback(null, '<?xml version="1.0" encoding="utf-8"?>' + doc.toString());
	}, 0);
};

Converter.stripAttributes = function(json) {
	var output = {};
	for(var elem in json) {
		if (elem != '@') {
			if (typeof(json[elem]) == 'object') {
				output[elem] = Converter.stripAttributes(json[elem]);
			} else {
				output[elem] = json[elem];
			}
		}
	}
	return output;
};



Converter.prototype.XMLtoJSON = function(xml) {
	var self = this;
	Converter.XMLtoJSON(xml, function(err, result) {
		self.emit('toJSON', err, result);
	});
};
Converter.prototype.JSONtoXML = function(json) {
	var self = this;
	Converter.JSONtoXML(json, function(err, result) {
		self.emit('toXML', err, result);
	});
};
Converter.prototype.stripAttributes = Converter.stripAttributes;



module.exports.Converter = Converter;
