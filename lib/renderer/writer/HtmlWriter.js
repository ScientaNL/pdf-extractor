'use strict';

const EventBus = require('../../pdfjs-utils/EventBus');
const TextLayerBuilder = require('../../pdfjs-utils/TextLayerBuilder');
const FileWriter = require('./FileWriter');

class HtmlWriter extends FileWriter
{
	writeHtml(page, viewport, outputFile) {
		return page.getTextContent().then((textContent) => {
				return this.renderHtmlLayer(page, viewport, textContent)
		}).then((txtBuilderEvt) => {
			return this.writeStringToFile(txtBuilderEvt.source.textLayerDiv.innerHTML, outputFile);
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

	renderCssSheet(cssSheet) {
		let result = '';

		for (let cssRule of cssSheet.cssRules) {
			result += cssRule.cssText + "\n";
		}

		return result;
	}
}

module.exports = HtmlWriter;
