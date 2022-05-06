'use strict';

const path = require('path');
const AbstractRenderer = require('./AbstractRenderer');
const HtmlWriter = require('./writer/HtmlCanvasWriter');
const TextWriter = require('./writer/TextCanvasWriter');
const canvasFontRegistry = require('../pdfjs-utils/domfacade').canvasFontRegistry;

const { NodeCanvasFactory }  = require("../pdfjs-utils/domfacade");

class CanvasRenderer extends AbstractRenderer
{
	constructor(outputDir, viewportScale, options) {
		super(outputDir, viewportScale);
		options = options || {};

		this.canvasFactory = new NodeCanvasFactory();

		this.fontFamilyReplacements = typeof options.fontFamilyReplacements === 'object' ? options.fontFamilyReplacements : {
			"monospace": {
				fontName: "'Roboto Mono'",
				fontFamily: "'Roboto Mono', monospace",
				fontFile: path.resolve(__dirname, '../../fonts/roboto_mono/RobotoMono-Regular.ttf')
			},
			"sans-serif": {
				fontName: "'Open Sans'",
				fontFamily: "'Open Sans', sans-serif",
				fontFile: path.resolve(__dirname, '../../fonts/open_sans/OpenSans-Regular.ttf')
			},
			"serif": {
				fontName: "'Merriweather'",
				fontFamily: "'Merriweather', serif",
				fontFile: path.resolve(__dirname, '../../fonts/merriweather/Merriweather-Regular.ttf')
			}
		};

		this.customWriters = Array.isArray(options.writers) ? options.writers : [];
		this.writerOptions = options.writerOptions || null;
	}

	get writers() {
		if (this.customWriters.length) {
			return this.customWriters;
		}
		return this.getWriters(this.writerOptions);
	}

	getWriters(writerOptions) {
		return [
			new HtmlWriter(this.outputDir, Object.assign({
				fontFamilyReplacements: this.fontFamilyReplacements
			}, writerOptions)),
			new TextWriter(this.outputDir, writerOptions)
		];
	}

	/**
	 * @param {PDFPageProxy} page
	 * @return {Promise<boolean>}
	 */
	async renderPage(page) {
		if (this.writers.length === 0) {
			return false;
		}

		this.registerFonts();

		const viewport = this.getPageViewport(page),
			{canvas, context} = this.canvasFactory.create(viewport.width, viewport.height),
			renderContext = {
				canvasContext: context,
				viewport: viewport,
				canvasFactory: this.canvasFactory
			};

		await page.render(renderContext).promise;

		for (let writer of this.writers) {
			if (writer.setMetaDataHandler) {
				writer.setMetaDataHandler(this.metaDataHandler);
			}
			await writer.writeCanvasPage(page, viewport, canvas);
		}
		canvasFontRegistry.reset();

		return true;
	}

	/**
	 *
	 * @param {PDFPageProxy} page
	 * @return {PageViewport}
	 */
	getPageViewport(page) {
		return page.getViewport({
			scale: this.getPageViewportScale(page)
		});
	}

	registerFonts() {
		for (const [fontType, font] of Object.entries(this.fontFamilyReplacements)) {
			canvasFontRegistry.registerFont(font.fontName, font.fontFile, fontType);
		}
	}

	/**
	 * @param doc
	 * @return {Promise<boolean>}
	 */
	async renderDocument(doc) {
		if (this.writers.length === 0) {
			return false;
		}

		for (let writer of this.writers) {
			if (writer.writeDocument) {
				await writer.writeDocument(doc);
			}
		}
		return true;
	}
}

module.exports = CanvasRenderer;
