'use strict';

const AbstractRenderer = require('./AbstractRenderer');
const SvgWriter = require('./writer/SvgWriter');
const pdfjsLib = require('pdfjs-dist');

class SvgRenderer extends AbstractRenderer
{
	constructor(outputDir, viewportScale, options) {
		super(outputDir, viewportScale);
		options = options || {};

		this.svgWriter = options.svgWriter || new SvgWriter(this.outputDir);
	}

	/**
	 * @param {PDFPageProxy} page
	 * @return {Promise<boolean>}
	 */
	async renderPage(page) {
		if (!this.svgWriter) {
			return false;
		}

		let viewport = page.getViewport({
			scale: this.getPageViewportScale(page)
		});

		const opList = await page.getOperatorList();
		const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
		svgGfx.embedFonts = true;

		const svgDomElement = await svgGfx.getSVG(opList, viewport);
		await this.svgWriter.writeSvgPage(page, svgDomElement);

		return true;
	}
}

module.exports = SvgRenderer;
