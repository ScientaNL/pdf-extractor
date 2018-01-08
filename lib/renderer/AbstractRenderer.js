'use strict';

class AbstractRenderer
{
	constructor(outputDir) {
		if (new.target === AbstractRenderer) {
			throw new TypeError("Cannot construct Abstract instances directly");
		}

		this.outputDir = outputDir;
		this.metaDataHandler = null;
	}

	setMetaDataHandler(metaDataHandler) {
		this.metaDataHandler = metaDataHandler;
	}

	renderPage(page) {
		throw new ReferenceError("Parent class must implement this method to render a page");
	}
}

module.exports = AbstractRenderer;
