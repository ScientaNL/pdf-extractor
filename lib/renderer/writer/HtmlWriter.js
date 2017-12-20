'use strict';

const EventBus = require('../../pdfjs-utils/EventBus');
const TextLayerBuilder = require('../../pdfjs-utils/TextLayerBuilder');
const FileWriter = require('./FileWriter');

class HtmlWriter extends FileWriter
{
	constructor(outputDir, options) {
		options = options || {};
		super(outputDir, options);
		this.innerHtml = typeof options.innerHtml === 'boolean' ? options.innerHtml : false;
		this.layerDimensions = typeof options.layerDimensions === 'boolean' ? options.layerDimensions : true;
	}

	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'html');
	}

	writeCanvasPage(page, viewport, canvas) {
		return page.getTextContent().then((textContent) => {
			return this.renderHtmlLayer(page, viewport, textContent)
		}).then((txtBuilderEvt) => {
			let textLayerDiv = txtBuilderEvt.source.textLayerDiv;
			if (this.layerDimensions) {
				textLayerDiv.setAttribute("style", `width:${viewport.width}px; height:${viewport.height}px;`);
			}
			return this.writeStringToFile(
				this.innerHtml ? textLayerDiv.innerHTML : textLayerDiv.outerHTML,
				this.getFilePathForPage(page)
			);
		});
	}

	renderHtmlLayer(page, viewport, textContent) {
		let eventBus = new EventBus();

		// Create div which will hold text-fragments
		let textLayerDiv = document.createElement("div");

		// Set it's class to textLayer which have required CSS styles
		textLayerDiv.setAttribute("class", "textLayer");

		// Create new instance of TextLayerBuilder class
		let textLayer = new TextLayerBuilder({
			textLayerDiv: textLayerDiv,
			pageIndex: page.pageIndex,
			viewport: viewport,
			eventBus: eventBus
		});

		// Set text-fragments
		textLayer.setTextContent(textContent);

		// Render text-fragments
		textLayer.render();

		return new Promise((resolve) => {
			eventBus.on('textlayerrendered', (txtBuilderEvt) => {
				resolve(txtBuilderEvt);
			});
		}).catch(function(err) {
			throw err;
		});
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
