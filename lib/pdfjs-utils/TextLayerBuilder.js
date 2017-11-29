'use strict';

const EventBus = require('./EventBus');
const { renderTextLayer } = require('pdfjs-dist/lib/pdf');

class TextLayerBuilder {
	constructor(options) {
		let eventBus = options.eventBus,
			pageIndex = options.pageIndex,
			viewport = options.viewport,
			findController = options.findController || null,
			enhanceTextSelection = options.enhanceTextSelection || false;

		this.textLayerDiv = options.textLayerDiv;
		this.eventBus = eventBus || new EventBus();
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

	_finishRendering() {
		this.renderingDone = true;
		if (!this.enhanceTextSelection) {
			let endOfContent = document.createElement('div');
			endOfContent.className = 'endOfContent';
			this.textLayerDiv.appendChild(endOfContent);
		}
		this.eventBus.dispatch('textlayerrendered', {
			source: this,
			pageNumber: this.pageNumber,
			numTextDivs: this.textDivs.length
		});
	}

	render() {
		let _this = this;

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
		this.textLayerRenderTask.promise.then(function () {
			_this.textLayerDiv.appendChild(textLayerFrag);
			_this._finishRendering();
		}, function (reason) {});
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
