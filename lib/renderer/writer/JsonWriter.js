'use strict';

const fs = require('fs');
const FileWriter = require('./FileWriter');

class JsonWriter extends FileWriter
{
	constructor(version, options) {
		super(options);
		this.jsonData = {
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

	updateJson(page, viewport) {
		if (viewport.width > this.jsonData.dimensions.width) {
			this.jsonData.dimensions.width = Math.round(viewport.width * 100) / 100;
		}
		if (viewport.height > this.jsonData.dimensions.height) {
			this.jsonData.dimensions.height = Math.round(viewport.height * 100) / 100;
		}
	}

	writeDocument(doc, filePath) {
		this.jsonData.numpages = doc.numPages;
		return this.writeStringToFile(JSON.stringify(this.jsonData), filePath);
	}
}

module.exports = JsonWriter;
