'use strict';

class AbstractRenderer
{
	constructor(outputDir, viewportScale) {
		if (new.target === AbstractRenderer) {
			throw new TypeError("Cannot construct Abstract instances directly");
		}
		let viewportType = typeof(viewportScale);
		if (viewportType !== 'function' && viewportType !== 'number') {
			throw new TypeError("viewportScale must be a number or function to calculate a number");
		}

		this.outputDir = outputDir;
		this.metaDataHandler = null;
		this.viewportScale = viewportScale;
	}

	getPageViewportScale(page) {
		if (typeof this.viewportScale === 'number') {
			return this.viewportScale;
		}
		let viewport = page.getViewport(1);
		return this.viewportScale(viewport.width, viewport.height);
	}

	setMetaDataHandler(metaDataHandler) {
		this.metaDataHandler = metaDataHandler;
	}

	renderPage(page) {
		throw new ReferenceError("Parent class must implement this method to render a page");
	}
}

module.exports = AbstractRenderer;
