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
		this.dimBuffer = {};
	}

	writeCanvasPage(page, viewport, canvas) {
		this.bufferDimensions(page.pageNumber,
			Math.round(viewport.width * 100) / 100,
			Math.round(viewport.height * 100) / 100
		);
		return Promise.resolve(true);
	}

	bufferDimensions(pageNumber, width, height) {
		let bufferKey = `${width}x${height}`;

		if (!this.dimBuffer[bufferKey]) {
			this.dimBuffer[bufferKey] = {
				width: width,
				height: height,
				pages: []
			};
		}

		this.dimBuffer[bufferKey].pages.push(pageNumber);
	}

	writeDocument(doc) {
		this.jsonData.numpages = doc.numPages;

		let largestKey = null, numPages = 0;
		for (let bufKey in this.dimBuffer) {
			if (!largestKey || this.dimBuffer[bufKey].pages.length > numPages) {
				largestKey = bufKey;
				numPages = this.dimBuffer[bufKey].pages.length;
			}
		}

		for (let bufKey in this.dimBuffer) {
			let dims = this.dimBuffer[bufKey];
			if (bufKey === largestKey) {
				this.jsonData.dimensions.width = dims.width;
				this.jsonData.dimensions.height = dims.height;
			} else {
				dims.pages.forEach((pageNumber) => {
					this.jsonData.dimensions.exceptions[pageNumber] = {
						width: dims.width,
						height: dims.height
					};
				});
			}
		}

		return this.writeStringToFile(
			JSON.stringify(this.jsonData),
			this.getPathForFile('info.json')
		);
	}
}

module.exports = JsonWriter;
