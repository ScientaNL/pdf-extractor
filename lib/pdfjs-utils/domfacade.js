'use strict';

const domstubs = require('pdfjs-dist/lib/examples/node/domstubs');
const stackTrace = require('stack-trace');
const assert = require('assert');

const { JSDOM }  = require("jsdom");
const utils = require("jsdom/lib/jsdom/living/generated/utils");
const impl = utils.implSymbol;
const HTMLElement = require("jsdom/lib/jsdom/living/generated/HTMLElement");
const HTMLCanvasElement = require("jsdom/lib/jsdom/living/generated/HTMLCanvasElement");
const Canvas  = require("jsdom/lib/jsdom/utils").Canvas;

Object.defineProperty(HTMLCanvasElement.expose.Window.HTMLCanvasElement.prototype, "_canvas", {
	get() {
		return this[impl]._getCanvas();
	},
	enumerable: true,
	configurable: true
});

/**
 * A readable stream which offers a stream representing the serialization of a
 * given DOM element (as defined by domstubs.js).
 */
class NodeCanvasFactory
{
	create(width, height) {
		assert(width > 0 && height > 0, 'Invalid canvas size');
		let canvas = new Canvas(width, height);
		let context = canvas.getContext('2d');
		return {
			canvas: canvas,
			context: context,
		};
	}

	reset(canvasAndContext, width, height) {
		assert(canvasAndContext.canvas, 'Canvas is not specified');
		assert(width > 0 && height > 0, 'Invalid canvas size');
		canvasAndContext.canvas.width = width;
		canvasAndContext.canvas.height = height;
	}

	destroy(canvasAndContext) {
		assert(canvasAndContext.canvas, 'Canvas is not specified');

		// Zeroing the width and height cause Firefox to release graphics
		// resources immediately, which can greatly reduce memory consumption.
		canvasAndContext.canvas.width = 0;
		canvasAndContext.canvas.height = 0;
		canvasAndContext.canvas = null;
		canvasAndContext.context = null;
	}
}

exports.NodeCanvasFactory = NodeCanvasFactory;
exports.Canvas = Canvas;

exports.HTMLElement = HTMLElement.expose.Window.HTMLElement;
exports.Image = Canvas.Image;
exports.ImageData = Canvas.ImageData;
exports.jsDomFactory = function () {
	return new JSDOM(`<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=2.0, user-scalable=no">
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
