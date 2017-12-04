'use strict';

const domstubs = require('pdfjs-dist/lib/examples/node/domstubs');
const stackTrace = require('stack-trace');
const { ImageData }  = require("canvas");

const { JSDOM }  = require("jsdom");
const utils = require("jsdom/lib/jsdom/living/generated/utils.js");
const impl = utils.implSymbol;
const HTMLElement = require("jsdom/lib/jsdom/living/generated/HTMLElement.js");
const HTMLCanvasElement = require("jsdom/lib/jsdom/living/generated/HTMLCanvasElement.js");

Object.defineProperty(HTMLCanvasElement.expose.Window.HTMLCanvasElement.prototype, "_canvas", {
	get() {
		return this[impl]["_canvas"];
	},
	enumerable: true,
	configurable: true
});

exports.Image = domstubs.Image;
exports.HTMLElement = HTMLElement.expose.Window.HTMLElement;
exports.ImageData = ImageData;
exports.jsDomFactory = function () {
	return new JSDOM(`<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <style></style>
</head>
<body></body>
</html>`, {
		url: "https://scienta.nl/",
		referrer: "https://scienta.nl/",
		contentType: "text/html",
		userAgent: "BoxOuwe/1337",
		includeNodeLocations: false
	});
};

Object.keys(exports).forEach(function (key) {
	global[key] = exports[key];
});

global.Buffer = global.Buffer || require('buffer').Buffer;
if (typeof btoa === 'undefined') {
	global.btoa = function (str) {
		return new Buffer(str).toString('base64');
	};
}
if (typeof atob === 'undefined') {
	global.atob = function (b64Encoded) {
		return new Buffer(b64Encoded, 'base64').toString();
	};
}

exports.setGlobalDom = function(jsDomInstance) {
	let jsDom = jsDomInstance || jsDomFactory();

	Object.defineProperty(jsDom.window._core.CSSStyleDeclaration.prototype, 'transform', {
		get : function () {
			return this.getPropertyValue('transform');
		},
		set : function (v) {
			this._setProperty('transform', v);
		},
		enumerable: true,
		configurable: true
	});

	global.jsDomDocument = jsDom.window.document;
	global.document = new Proxy(domstubs.document, {
		get (target, propKey) {
			if (propKey !== 'currentScript') {
				let trace = stackTrace.get();
				trace.shift();
				target = this.getTarget(target, propKey, trace);
			}

			let prop = target[propKey];
			if (typeof prop === 'function') {
				return prop.bind(target);
			}

			return Reflect.get(target, propKey, target);
		},

		getTarget(stubDocument, propKey, trace)
		{
			let callSite = trace[0];
			if (!stubDocument[propKey]) {
				return jsDom.window.document;
			}

			if (callSite.getFileName().indexOf('node_modules/pdfjs-dist/build/') === -1) {
				return jsDom.window.document;
			}

			switch (callSite.getTypeName()) {
				case 'FontLoader':
					return jsDom.window.document;
			}

			return stubDocument;
		}
	});
};
