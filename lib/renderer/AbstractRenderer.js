'use strict';

const path = require('path');

class AbstractRenderer
{
	constructor(outputDir) {
		if (new.target === AbstractRenderer) {
			throw new TypeError("Cannot construct Abstract instances directly");
		}

		this.outputDir = outputDir;
	}

	getFilePathForPage(pageNum, fileExt) {
		let name;
		switch (fileExt) {
			case 'html':
			case 'txt':
				name = 'text';
				break;
			default:
				name = 'page';
		}
		return this.getPathForFile(`${name}-${pageNum}.${fileExt}`);
	}

	getPathForFile(fileName) {
		return path.join(this.outputDir, fileName);
	}

	renderPage(page) {
		throw new ReferenceError("Parent class must implement this method to render a page");
	}
}

module.exports = AbstractRenderer;
