"use strict";

const domstubs = require('pdfjs-dist/lib/examples/node/domstubs');
const stackTrace = require('stack-trace');
const assert = require('assert').strict;
const opentype = require('opentype.js');
const jsdom = require("jsdom");

const { JSDOM } = jsdom;
const { Canvas, Context2d, Image, ImageData, createCanvas, NodeCanvasRenderingContext2D } = require("canvas");

/**
 * @param {NodeCanvasRenderingContext2D} context
 */
const configCanvasContext = (context) => {
	context.patternQuality = 'best';
	context.quality = 'best';
	context.antialias = 'subpixel';
	context.textDrawingMode = 'path';
}

/**
 * A readable stream which offers a stream representing the serialization of a
 * given DOM element (as defined by domstubs.js).
 */
class NodeCanvasFactory
{
	/**
	 * @param width
	 * @param height
	 * @return {{canvas: Canvas, context: NodeCanvasRenderingContext2D}}
	 */
	create(width, height) {
		assert(width > 0 && height > 0, "Invalid canvas size");
		const canvas = createCanvas(width, height);
		const context = canvas.getContext("2d");
		configCanvasContext(context);
		return {
			canvas,
			context,
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

Object.defineProperty(Canvas.prototype, "getContext", {
	value: function(contextType, contextAttributes) {
		if (contextType == '2d') {
			if (!this._context2d) {
				this._context2d = new Context2d(this, contextAttributes);
				configCanvasContext(this._context2d);
			}
			const ctx = this._context2d;
			this.context = ctx;
			ctx.canvas = this;

			let measureTextForFont = function(text, font, fontSize) {
				let method = arguments.length <= 3 || arguments[3] === undefined ? 'box' : arguments[3];

				let ascent = 0,
					descent = 0,
					width = 0,
					scale = 1 / font.unitsPerEm * fontSize,
					glyphs = font.stringToGlyphs(text);

				for (let i = 0; i < glyphs.length; i++) {
					let glyph = glyphs[i];
					if (glyph.advanceWidth) {
						width += glyph.advanceWidth * scale;
					}
					if (i < glyphs.length - 1) {
						let kerningValue = font.getKerningValue(glyph, glyphs[i + 1]);
						width += kerningValue * scale;
					}

					let _glyph$getMetrics = glyph.getMetrics();

					let yMin = _glyph$getMetrics.yMin;
					let yMax = _glyph$getMetrics.yMax;


					ascent = Math.max(ascent, yMax);
					descent = Math.min(descent, yMin);
				}

				return {
					width: width,
					height: method == 'box' ? Math.abs(ascent) * scale + Math.abs(descent) * scale : Math.abs(ascent) * scale,
					actualBoundingBoxAscent: ascent * scale,
					actualBoundingBoxDescent: descent * scale,
					fontBoundingBoxAscent: font.ascender * scale,
					fontBoundingBoxDescent: font.descender * scale
				};
			};
			let measureTextCanvas = ctx.measureText.bind(ctx);

			ctx.measureText = function (string) {
				let font = ctx.font;
				if (typeof font === 'string') {
					let regX = /([0-9\.]+)px ([a-zA-Z \-_,'"]+)$/,
						result = regX.exec(font);

					if (result && result[1] && result[2]) {
						let px = parseFloat(result[1]),
							fontFamily = result[2],
							fonts = fontFamily.split(', '),
							font;

						for (let fontFam of fonts) {
							font = canvasFontRegistry.getFont(fontFam);
							if (font) {
								break;
							}
						}

						if (font) {
							return measureTextForFont(string, font, px);
						}
					}
				}
				return measureTextCanvas(string);
			};

			return ctx;
		}
	},
	enumerable: false,
	configurable: false
});

exports.NodeCanvasFactory = NodeCanvasFactory;
exports.Canvas = Canvas;

class CanvasFontRegistry
{
	constructor() {
		this.registry = {};
		this.cache = {};
	}

	_hasFont(normalizedFontFam) {
		return typeof this.registry[normalizedFontFam] === 'object';
	}

	registerFont(fontFamily, fontPath, fontType, fromCache) {
		fromCache = typeof fromCache === 'boolean' ? fromCache : true;
		let fontFam = this.normalizeFont(fontFamily),
			font;

		if (fromCache && this.cache[fontFam]) {
			font = this.cache[fontFam];
		} else {
			font = opentype.loadSync(fontPath);
			this.cache[fontFam] = font;
		}

		this.registry[fontFam] = font;
		if (fontType) {
			this.registry[fontType] = font;
		}
	}

	unregisterFont(fontFamily, fontType) {
		let fontFam = this.normalizeFont(fontFamily);
		this.registry[fontFam] = undefined;
		delete this.registry[fontFam];
		if (fontType) {
			this.registry[fontType] = undefined;
			delete this.registry[fontType];
		}
	}

	reset() {
		this.registry = {};
	}

	normalizeFont(fontFamily) {
		return fontFamily.replace(/['"]/g, '').toLowerCase();
	}

	hasFont(fontFamily) {
		let fontFam = this.normalizeFont(fontFamily);
		return this._hasFont(fontFam);
	}

	getFont(fontFamily) {
		let fontFam = this.normalizeFont(fontFamily);
		if (this._hasFont(fontFam)) {
			return this.registry[fontFam];
		}
		return null;
	}
}
let canvasFontRegistry = new CanvasFontRegistry();
exports.canvasFontRegistry = canvasFontRegistry;

exports.Image = Image;
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
		return Buffer.from(str).toString('base64');
	};
}
if (typeof atob === 'undefined') {
	global.atob = function (b64Encoded) {
		return Buffer.from(b64Encoded, 'base64').toString();
	};
}

exports.setGlobalDom = function(jsDomInstance) {
	let jsDom = jsDomInstance || jsDomFactory();

	Object.defineProperty(jsDom.window.CSSStyleDeclaration.prototype, 'transform', {
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
	global.HTMLElement = jsDom.window.HTMLElement;
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
				return jsDomDocument;
			}

			if (callSite.getFileName().indexOf('node_modules/pdfjs-dist/build/') === -1) {
				return jsDomDocument;
			}

			switch (callSite.getTypeName()) {
				case 'FontLoader':
				case 'GenericFontLoader':
				case 'BaseFontLoader':
					return jsDomDocument;
			}

			return stubDocument;
		}
	});
};

module.exports = exports;
