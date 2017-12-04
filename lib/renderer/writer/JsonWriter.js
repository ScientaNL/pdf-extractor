'use strict';

const FileWriter = require('./FileWriter');

class JsonWriter extends FileWriter
{
	constructor(version, outputDir, options) {
		super(outputDir, options);
		this.jsonData = {
			generator: 'pdf-extractor',
			numpages: 0,
			version: version,
			dimensions: {
				exceptions: {},
				width: 0,
				height: 0
			},
			links: []
		};
	}

	writeCanvasPage(page, viewport, canvas) {
		if (viewport.width > this.jsonData.dimensions.width) {
			this.jsonData.dimensions.width = Math.round(viewport.width * 100) / 100;
		}
		if (viewport.height > this.jsonData.dimensions.height) {
			this.jsonData.dimensions.height = Math.round(viewport.height * 100) / 100;
		}
		return Promise.resolve(true);
	}

	writeDocument(doc) {
		this.jsonData.numpages = doc.numPages;
		return this.writeStringToFile(
			JSON.stringify(this.jsonData),
			this.getPathForFile('info.json')
		);
	}
}

module.exports = JsonWriter;
