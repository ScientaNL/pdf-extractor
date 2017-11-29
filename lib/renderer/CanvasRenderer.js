'use strict';

const assert = require('assert');
const Canvas = require('canvas');
const AbstractRenderer = require('./AbstractRenderer');
const JsonWriter = require('./writer/JsonWriter');
const FileWriter = require('./writer/FileWriter');
const HtmlWriter = require('./writer/HtmlWriter');
const TextWriter = require('./writer/TextWriter');

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

class CanvasRenderer extends AbstractRenderer
{
	constructor(outputDir, options) {
		super(outputDir);
		options = options || {};

		let doRenderPng = typeof options.renderPng === 'boolean' ? options.renderPng : true,
			doRenderText = typeof options.renderText === 'boolean' ? options.renderText : true,
			doRenderHtml = typeof options.renderHtml === 'boolean' ? options.renderHtml : true;
		this.canvasZoom = options.canvasZoom || 1.0;

		this.canvasFactory = new NodeCanvasFactory();
		this.jsonWriter = new JsonWriter(this.version);
		this.pngWriter = doRenderPng ? new FileWriter() : null;
		this.htmlWriter = doRenderHtml ? new HtmlWriter() : null;
		this.textWriter = doRenderText ? new TextWriter() : null;
		this.version = options.version;
	}

	renderPage(page) {
		let viewport = page.getViewport(this.canvasZoom),
			canvasAndContext = this.canvasFactory.create(viewport.width, viewport.height),
			renderContext = {
				canvasContext: canvasAndContext.context,
				viewport: viewport,
				canvasFactory: this.canvasFactory
			};

		let renderPromise = page.render(renderContext).then(() => {
			return this.jsonWriter.updateJson(page, viewport);
		});

		if (this.pngWriter) {
			renderPromise.then(() => {
				return this.pngWriter.writeStreamToFile(
					canvasAndContext.canvas.pngStream(),
					this.getFilePathForPage(page.pageNumber, 'png')
				);
			});
		}

		if (this.htmlWriter) {
			renderPromise.then(() => {
				this.htmlWriter.writeHtml(
					page,
					viewport,
					this.getFilePathForPage(page.pageNumber, 'html')
				);
			});
		}

		if (this.textWriter) {
			renderPromise.then(() => {
				this.textWriter.writeText(
					page,
					viewport,
					this.getFilePathForPage(page.pageNumber, 'txt')
				);
			});
		}

		return renderPromise;
	}

	renderDocument(doc) {
		let renderPromise = this.jsonWriter.writeDocument(doc, this.getPathForFile('info.json'));

		if (this.htmlWriter) {
			return renderPromise.then(() => {
				let css = '',
					styles = jsDomDocument.documentElement.getElementsByTagName('head')[0].getElementsByTagName('style');

				for (let styleEl of styles) {
					css += this.htmlWriter.renderCssSheet(styleEl.sheet);
				}

				return this.htmlWriter.writeStringToFile(css, this.getPathForFile('stylesheet.css'));
			});
		}
	}
}

module.exports = CanvasRenderer;
