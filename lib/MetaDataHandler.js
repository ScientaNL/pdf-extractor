class FontMetaData
{
	constructor(textContentFamily) {
		this.textContentFontFamily = textContentFamily;
		this.htmlFontFamily = null;
	}

	setHtmlFontFamily(customHtmlFamily) {
		this.htmlFontFamily = customHtmlFamily;
	}

	getFontFamily() {
		return this.htmlFontFamily || this.textContentFontFamily;
	}
}

class PageMetaData
{
	constructor(pageNumber, width, height, scale) {
		this.pageNumber = pageNumber;
		this.exactWidth = width;
		this.exactHeight = height;
		this.width = Math.round(width * 100) / 100;
		this.height = Math.round(height * 100) / 100;
		this.scale = scale;
		this.fonts = [];
	}

	addFont(font) {
		this.fonts.push(font);
	}
}

class MetaDataHandler
{
	constructor(version) {
		this.version = version;

		this.jsonData = {
			generator: 'pdf-extractor',
			version: version,
			numpages: 0,
			dimensions: {
				exceptions: {},
				width: 0,
				height: 0
			},
			links: []
		};

		this.pages = {};
		this.docFonts = {};

		this.pdfMetaData = null;
		this.pdfOutline = null;
		this.pdfPageLabels = null;
		this.pdfDestinations = null;
	}

	addDocFont(textContentFamily, pageNumber) {
		if (!this.docFonts[textContentFamily]) {
			this.docFonts[textContentFamily] = new FontMetaData(textContentFamily);
		}
		if (pageNumber && this.pages[pageNumber]) {
			this.pages[pageNumber].addFont(this.docFonts[textContentFamily]);
		}
	}

	addPage(pageNumber, width, height, scale) {
		if (!this.pages[pageNumber]) {
			this.pages[pageNumber] = new PageMetaData(pageNumber, width, height, scale);
		}
	}
}

module.exports = MetaDataHandler;
