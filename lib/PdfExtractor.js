'use strict';

// HACK few hacks to let PDF.js be loaded not as a module in global space.
const domFacade = require('./pdfjs-utils/domfacade');
const fs = require('fs');
const PDFJSLib = require('pdfjs-dist');
const CanvasRenderer = require('./renderer/CanvasRenderer');
const SvgRenderer = require('./renderer/SvgRenderer');
const packageJson = require('../package.json');

PDFJSLib.PDFJS.disableFontFace = true;

class PdfExtractor
{
	constructor(outputDir, options) {
		options = options || {};

		options.version = packageJson.version;

		this.renderSvg = typeof options.renderSvg === 'boolean' ? options.renderSvg : true;
		this.renderPng = typeof options.renderPng === 'boolean' ? options.renderPng : true;
		this.renderHtml = typeof options.renderHtml === 'boolean' ? options.renderHtml : true;
		this.renderText = typeof options.renderText === 'boolean' ? options.renderText : true;

		this.canvasZoom = options.canvasZoom || 1.5;
		this.pageRange = options.pageRange || [1, Infinity];

		fs.accessSync(outputDir, fs.R_OK | fs.W_OK);

		this.renderers = Array.isArray(options.renderers) ? options.renderers : [
			new CanvasRenderer(outputDir, options),
			new SvgRenderer(outputDir, options)
		];
	}

	parse(pdfPath) {
		return this.parseFromFileBuffer(fs.readFileSync(pdfPath));
	}

	parseFromFileBuffer(pdfBuffer) {
		// Read the PDF file into a typed array so PDF.js can load it.
		let rawData = new Uint8Array(pdfBuffer);

		domFacade.setGlobalDom();

		return PDFJSLib.getDocument({
			data: rawData,
			// Try to export JPEG images directly if they don't need any further processing.
			nativeImageDecoderSupport: PDFJSLib.NativeImageDecoding.DISPLAY
		}).then((doc) => this.parseDocument(doc));
	}

	parseDocument(doc) {
		let numPages = doc.numPages,
			minPage = this.pageRange[0],
			maxPage = this.pageRange[1] > numPages ? numPages : this.pageRange[1];

		// chain promises
		let lastPromise = Promise.resolve(),
			loadPage = (pageNum) => {
				return () => doc.getPage(pageNum).then((page) => this.renderPageData(page));
			};

		for (let i = 1; i <= numPages; i++) {
			if (i < minPage || i > maxPage) {
				continue;
			}
			lastPromise = lastPromise.then(loadPage(i));
		}

		return lastPromise.then(() => {
			this.renderDocumentData(doc);
		});
	}

	renderPageData(page) {
		// chain promises
		let lastPromise = Promise.resolve();
		for (let renderer of this.renderers) {
			lastPromise = lastPromise.then(() => {
				return renderer.renderPage(page)
			});
		}
		return lastPromise;
	}

	renderDocumentData(doc) {
		// chain promises
		let lastPromise = Promise.resolve();
		for (let renderer of this.renderers) {
			if (renderer.renderDocument) {
				lastPromise = lastPromise.then(() => {
					return renderer.renderDocument(doc)
				});
			}
		}
		return lastPromise;
	}
}

module.exports = PdfExtractor;
