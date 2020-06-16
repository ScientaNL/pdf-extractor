'use strict';

const AbstractRenderer = require('./AbstractRenderer');
const PngWriter = require('./writer/PngWriter');
const HtmlWriter = require('./writer/HtmlWriter');
const TextWriter = require('./writer/TextWriter');

const { NodeCanvasFactory }  = require("../pdfjs-utils/domfacade");

class CanvasRenderer extends AbstractRenderer
{
	constructor(outputDir, viewportScale, options) {
		super(outputDir, viewportScale);
		options = options || {};

		this.canvasFactory = new NodeCanvasFactory();

		this.writers = Array.isArray(options.writers) ?
			options.writers : this.getWriters(options.writerOptions || null);
	}

	getWriters(writerOptions) {
		return [
			new PngWriter(this.outputDir, writerOptions),
			new HtmlWriter(this.outputDir, writerOptions),
			new TextWriter(this.outputDir, writerOptions)
		];
	}

	renderPage(page) {
		if (this.writers.length === 0) {
			return Promise.resolve(false);
		}

		let viewport = page.getViewport({ scale: this.getPageViewportScale(page) }),
			canvasAndContext = this.canvasFactory.create(viewport.width, viewport.height),
			renderContext = {
				canvasContext: canvasAndContext.context,
				viewport: viewport,
				canvasFactory: this.canvasFactory
			},
			writePage = (canvasWriter) => {
				if (canvasWriter.setMetaDataHandler) {
					canvasWriter.setMetaDataHandler(this.metaDataHandler);
				}
				return canvasWriter.writeCanvasPage(page, viewport, canvasAndContext.canvas);
			};

		let renderPromise = page.render(renderContext).promise;

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
