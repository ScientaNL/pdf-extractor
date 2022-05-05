'use strict';

const TextLayerBuilder = require('../../pdfjs-utils/TextLayerBuilder');
const AnnotationLayerBuilder = require('../../pdfjs-utils/AnnotationLayerBuilder');
const FileWriter = require('./FileWriter');
const canvasFontRegistry = require('../../pdfjs-utils/domfacade').canvasFontRegistry;

class HtmlWriter extends FileWriter
{
	constructor(outputDir, options) {
		options = options || {};
		super(outputDir, options);

		this.innerHtml = typeof options.innerHtml === 'boolean' ? options.innerHtml : false;
		this.layerDimensions = typeof options.layerDimensions === 'boolean' ? options.layerDimensions : true;
		this.fontFamilyReplacements = typeof options.fontFamilyReplacements === 'object' ? options.fontFamilyReplacements : null;
		this.metaDataHandler = null;
	}

	setMetaDataHandler(metaDataHandler) {
		this.metaDataHandler = metaDataHandler;
	}

	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'html');
	}

	writeCanvasPage(page, viewport, canvas) {
		return this.renderHtmlLayer(page, viewport)
			.then((html) => this.writeStringToFile(html, this.getFilePathForPage(page)));
	}

	async renderHtmlLayer(page, viewport) {
		let textContent = await page.getTextContent();

		// Create div which will hold text-fragments
		let textLayerDiv = document.createElement("div");

		// Set it's class to textLayer which have required CSS styles
		textLayerDiv.setAttribute("class", "textLayer");

		// Create new instance of TextLayerBuilder class
		let textLayer = new TextLayerBuilder({
			textLayerDiv: textLayerDiv,
			pageIndex: page.pageIndex,
			viewport: viewport,
		});

		this.processTextStyles(page, textContent.styles);

		// Set text-fragments
		textLayer.setTextContent(textContent);

		// Render text-fragments
		textLayerDiv = await textLayer.renderAsync();
		canvasFontRegistry.reset();

		if (this.layerDimensions) {
			textLayerDiv.setAttribute("style", `width:${viewport.width}px; height:${viewport.height}px;`);
		}

		const annotationsDiv = await AnnotationLayerBuilder.renderPage(page, viewport, this.layerDimensions);

		let html = this.innerHtml
			? textLayerDiv.innerHTML + annotationsDiv.innerHTML
			: textLayerDiv.outerHTML + annotationsDiv.outerHTML;

		if (!textLayer.enhanceTextSelection) {
			let endOfContent = document.createElement('div');
			endOfContent.className = 'endOfContent';
			html += endOfContent.outerHTML;
		}

		return html;
	}

	processTextStyles(page, styles)
	{
		for (const [fontName, style] of Object.entries(styles)) {
			this.metaDataHandler.addDocFont(style.fontFamily, page.pageNumber);
		}

		if (this.fontFamilyReplacements) {
			this.changeTextLayerFont(styles);
		}
	}

	changeTextLayerFont(styles) {
		let replacements = Object.keys(this.fontFamilyReplacements);

		for (const [key, style] of Object.entries(styles)) {
			let textContentFamily = style.fontFamily;
			let pos = replacements.indexOf(textContentFamily);
			if (pos > -1) {
				let replaceFont = this.fontFamilyReplacements[textContentFamily];
				styles[key].fontFamily = replaceFont.fontFamily;
				if (this.metaDataHandler.docFonts[textContentFamily]) {
					this.metaDataHandler.docFonts[textContentFamily].setHtmlFontFamily(replaceFont.fontName);
				}
			}
		}
	}

	writeDocument(doc) {
		let css = '',
			styles = jsDomDocument.documentElement.getElementsByTagName('head')[0].getElementsByTagName('style');

		for (let styleEl of styles) {
			css += this.renderCssSheet(styleEl.sheet);
		}

		return this.writeStringToFile(css, this.getPathForFile('stylesheet.css'));
	}

	renderCssSheet(cssSheet) {
		let result = '';

		for (let cssRule of cssSheet.cssRules) {
			result += cssRule.cssText + "\n";
		}

		return result;
	}
}

module.exports = HtmlWriter;
