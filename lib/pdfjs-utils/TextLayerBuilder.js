'use strict';

const { renderTextLayer } = require('pdfjs-dist/lib/pdf');

class TextLayerBuilder {
	constructor(options) {
		let pageIndex = options.pageIndex,
			viewport = options.viewport,
			findController = options.findController || null,
			enhanceTextSelection = options.enhanceTextSelection || false;

		this.textLayerDiv = options.textLayerDiv;
		this.textContent = null;
		this.textContentItemsStr = [];
		this.textContentStream = null;
		this.renderingDone = false;
		this.pageIdx = pageIndex;
		this.pageNumber = this.pageIdx + 1;
		this.viewport = viewport;
		this.textDivs = [];
		this.findController = findController;
		this.textLayerRenderTask = null;
		this.enhanceTextSelection = enhanceTextSelection;
	}

	async render() {
		let timeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

		if (!(this.textContent || this.textContentStream) || this.renderingDone) {
			return;
		}
		this.cancel();
		this.textDivs = [];
		let textLayerFrag = document.createDocumentFragment();
		this.textLayerRenderTask = renderTextLayer({
			textContent: this.textContent,
			textContentStream: this.textContentStream,
			container: textLayerFrag,
			viewport: this.viewport,
			textDivs: this.textDivs,
			textContentItemsStr: this.textContentItemsStr,
			timeout: timeout,
			enhanceTextSelection: this.enhanceTextSelection
		});

		try {
			await this.textLayerRenderTask.promise;
		} catch(ignored) {}

		this.textLayerDiv.appendChild(textLayerFrag);
		this.renderingDone = true;

		return this.textLayerDiv;
	}

	cancel() {
		if (this.textLayerRenderTask) {
			this.textLayerRenderTask.cancel();
			this.textLayerRenderTask = null;
		}
	}

	setTextContentStream(readableStream) {
		this.cancel();
		this.textContentStream = readableStream;
	}

	setTextContent(textContent) {
		this.cancel();
		this.textContent = textContent;
	}
}

module.exports = TextLayerBuilder;
