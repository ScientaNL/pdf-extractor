'use strict';

const AbstractRenderer = require('./AbstractRenderer');
const SvgWriter = require('./writer/SvgWriter');
const pdfjsLib = require('pdfjs-dist');

class SvgRenderer extends AbstractRenderer
{
	constructor(outputDir, options) {
		super(outputDir);
		options = options || {};

		let doRenderSvg = typeof options.renderSvg === 'boolean' ? options.renderSvg : true;

		this.canvasZoom = options.canvasZoom || 1.0;
		this.svgWriter = doRenderSvg ? new SvgWriter() : null;
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
		}).then((svg) => {
			return this.svgWriter.writeSvgToFile(svg, this.getFilePathForPage(page.pageNumber, 'svg'));
		});
	}
}

module.exports = SvgRenderer;
