'use strict';

const FileWriter = require('./FileWriter');

class PngWriter extends FileWriter
{
	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'png');
	}

	writeCanvasPage(page, viewport, canvas) {
		return this.writeStreamToFile(canvas.createPNGStream(), this.getFilePathForPage(page))
	}
}

module.exports = PngWriter;
