'use strict';

const assert = require('assert');
const Canvas = require('canvas');
const AbstractRenderer = require('./AbstractRenderer');
const JsonWriter = require('./writer/JsonWriter');
const PngWriter = require('./writer/PngWriter');
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

		this.canvasZoom = options.canvasZoom || 1.5;
		this.version = options.version || null;

		this.canvasFactory = new NodeCanvasFactory();

		this.writers = Array.isArray(options.writers) ?
			options.writers : this.getWriters(options.writerOptions || null);

	}

	getWriters(writerOptions) {
		return [
			new JsonWriter(this.version, this.outputDir, writerOptions),
			new PngWriter(this.outputDir, writerOptions),
			new HtmlWriter(this.outputDir, writerOptions),
			new TextWriter(this.outputDir, writerOptions)
		]
	}

	renderPage(page) {
		if (this.writers.length === 0) {
			return Promise.resolve(false);
		}

		let viewport = page.getViewport(this.canvasZoom),
			canvasAndContext = this.canvasFactory.create(viewport.width, viewport.height),
			renderContext = {
				canvasContext: canvasAndContext.context,
				viewport: viewport,
				canvasFactory: this.canvasFactory
			},
			writePage = (canvasWriter) => {
				return canvasWriter.writeCanvasPage(page, viewport, canvasAndContext.canvas);
			};

		let renderPromise = page.render(renderContext);

		for (let writer of this.writers) {
			renderPromise.then(() => {
				return writePage(writer);
			});
		}

		return renderPromise;
	}

	renderDocument(doc) {
		if (this.writers.length === 0) {
			return Promise.resolve(false);
		}

		// chain promises
		let lastPromise = Promise.resolve();
		for (let writer of this.writers) {
			if (writer.writeDocument) {
				lastPromise = lastPromise.then(() => {
					return writer.writeDocument(doc);
				});
			}
		}
		return lastPromise;
	}
}

module.exports = CanvasRenderer;
