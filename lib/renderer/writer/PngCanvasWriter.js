'use strict';

const imageminPngquant = require('imagemin-pngquant');
const stream = require('stream');
const FileWriter = require('./FileWriter');

class PngCanvasWriter extends FileWriter
{
	/**
	 * @param {string} outputDir
	 * @param {Object} fsWriteOptions
	 * @param {{imageMin?: boolean}} pngOptions
	 */
	constructor(outputDir, fsWriteOptions, pngOptions) {
		super(outputDir, fsWriteOptions);
		pngOptions = pngOptions || {};

		this.imageMin = !!pngOptions.imageMin;
	}

	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'png');
	}

	/**
	 * @param {PDFPageProxy} page
	 * @param {PageViewport} viewport
	 * @param {Canvas} canvas
	 * @return {Promise<*>}
	 */
	async writeCanvasPage(page, viewport, canvas) {
		let data = await this.getPngBuffer(canvas);
		if(this.imageMin) {
			data = await this.getMinifiedPng(data);
		}
		return this.writeStreamToFile(stream.Readable.from(data), this.getFilePathForPage(page));
	}

	/**
	 * @param {Buffer} data
	 * @return {Promise<Buffer>}
	 */
	async getMinifiedPng(data) {
		const imagemin = (await import('imagemin')).default;
		return imagemin.buffer(data, {
			plugins: [imageminPngquant()],
		});
	}

	/**
	 * @param {Canvas} canvas
	 * @param {Object=} pngOpts
	 * @return {Promise<Buffer>}
	 */
	async getPngBuffer(canvas, pngOpts) {
		return new Promise((resolve, reject) => {
			canvas.toBuffer((err, buf) => {
				if (err) {
					// encoding failed
					reject(err);
				}
				// buf is PNG-encoded image
				resolve(buf);
			}, 'image/png', pngOpts);
		});
	}
}

module.exports = PngCanvasWriter;
