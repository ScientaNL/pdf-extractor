'use strict';

const CanvasRenderer = require('./CanvasRenderer');
const PngWriter = require('./writer/PngCanvasWriter');

class CanvasHiResRenderer extends CanvasRenderer
{
	constructor(outputDir, viewportScale, options) {
		super(outputDir, viewportScale, options);
		options = options || {};

		this.renderingUpscaleFactor = options.renderingUpscaleFactor || 2;
	}

	getWriters(writerOptions) {
		return [
			new PngWriter(
				this.outputDir,
				writerOptions,
				{imageMin: true}
			),
		];
	}

	/**
	 *
	 * @param {PDFPageProxy} page
	 * @return {PageViewport}
	 */
	getPageViewport(page) {
		return page.getViewport({
			scale: this.getPageViewportScale(page) * this.renderingUpscaleFactor
		});
	}
}

module.exports = CanvasHiResRenderer;
