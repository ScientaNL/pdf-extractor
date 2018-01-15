'use strict';

const AbstractRenderer = require('./AbstractRenderer');
const FileWriter = require('./writer/FileWriter');

class JsonRenderer extends AbstractRenderer
{
	constructor(outputDir, viewportScale, options) {
		super(outputDir, viewportScale);
		options = options || {};

		this.fileWriter = options.fileWriter || new FileWriter(this.outputDir);
	}

	renderPage(page) {
		let viewportScale = this.getPageViewportScale(page);
		let viewport = page.getViewport(viewportScale);
		this.metaDataHandler.addPage(page.pageNumber, viewport.width, viewport.height, viewportScale);
		return Promise.resolve(true);
	}

	renderDocument(doc) {
		let jsonData = this.metaDataHandler.jsonData;
		jsonData.dimensions = this.calculateDocumentDimensions(this.metaDataHandler.pages);
		jsonData.fonts = [];
		jsonData.numpages = doc.numPages;

		for (const [key, font] of Object.entries(this.getPageFonts())) {
			jsonData.fonts.push(font);
		}

		return this.fileWriter.writeStringToFile(
			JSON.stringify(jsonData),
			this.fileWriter.getPathForFile('info.json')
		);
	}

	getPageFonts() {
		let fonts = {};

		for (const [textContentFamily, font] of Object.entries(this.metaDataHandler.docFonts)) {
			fonts[textContentFamily] = Object.assign({}, font);
			fonts[textContentFamily].pages = [];
		}

		for (const [key, page] of Object.entries(this.metaDataHandler.pages)) {
			for (const font of page.fonts) {
				if (result.indexOf(el) === -1) result.push(el);
				if (fonts[font.textContentFontFamily] &&
					fonts[font.textContentFontFamily].pages.indexOf(page.pageNumber) === -1
				) {
					fonts[font.textContentFontFamily].pages.push(page.pageNumber);
				}
			}
		}

		return fonts;
	}

	calculateDocumentDimensions(metaDataPages) {
		let dimBuffer = {},
			docDimensions = {
				exceptions: {},
				width: 0,
				height: 0
			};

		let largestDims = null, dimPageCount = 0;
		for (let pageNum in metaDataPages) {
			if (metaDataPages.hasOwnProperty(pageNum)) {
				let pageData = metaDataPages[pageNum];
				let whKey = `${pageData.width}x${pageData.height}`;

				if (!dimBuffer[whKey]) {
					dimBuffer[whKey] = {
						width: pageData.width,
						height: pageData.height,
						scale: pageData.scale,
						pages: [pageData.pageNumber]
					};
					if (!largestDims) {
						largestDims = whKey;
						dimPageCount = 1;
					}
				} else {
					dimBuffer[whKey].pages.push(pageData.pageNumber);
					let pageCount = dimBuffer[whKey].pages.length;
					if (pageCount > dimPageCount) {
						largestDims = whKey;
						dimPageCount = pageCount;
					}
				}
			}
		}

		for (let bufKey in dimBuffer) {
			let dims = dimBuffer[bufKey];
			if (bufKey === largestDims) {
				docDimensions.width = dims.width;
				docDimensions.height = dims.height;
				docDimensions.scale = dims.scale;
			} else {
				dims.pages.forEach((pageNumber) => {
					docDimensions.exceptions[pageNumber] = {
						width: dims.width,
						height: dims.height,
						scale: dims.scale
					};
				});
			}
		}

		return docDimensions;
	}
}

module.exports = JsonRenderer;
