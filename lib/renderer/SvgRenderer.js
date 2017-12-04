'use strict';

const AbstractRenderer = require('./AbstractRenderer');
const SvgWriter = require('./writer/SvgWriter');
const pdfjsLib = require('pdfjs-dist');

class SvgRenderer extends AbstractRenderer
{
	constructor(outputDir, options) {
		super(outputDir);
		options = options || {};

		this.canvasZoom = options.canvasZoom || 1.5;
		this.svgWriter = options.svgWriter || new SvgWriter(this.outputDir);
	}

	renderPage(page) {
		if (!this.svgWriter) {
			return;
		}

		let viewport = page.getViewport(this.canvasZoom);

		return page.getOperatorList().then((opList) => {
			let svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
			svgGfx.embedFonts = true;
			return svgGfx.getSVG(opList, viewport);
		}).then((svgDomElement) => {
			return this.svgWriter.writeSvgPage(page, svgDomElement);
		});
	}
}

module.exports = SvgRenderer;
