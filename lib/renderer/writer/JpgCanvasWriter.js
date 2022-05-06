'use strict';

const FileWriter = require('./FileWriter');
const imageminJpegtran = require('imagemin-jpegtran');
const stream = require("stream");

class PngWriter extends FileWriter
{
	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'jpg');
	}

	/**
	 * @param {PDFPageProxy} page
	 * @param {PageViewport} viewport
	 * @param {Canvas} canvas
	 * @return {Promise<*>}
	 */
	async writeCanvasPage(page, viewport, canvas) {
		const imagemin = (await import('imagemin')).default;
		const buff = await imagemin.buffer(
			await this.getJpfBuffer(canvas, {
				quality: 0.9,
				progressive: false,
				chromaSubsampling: true,
			}),
			{plugins: [imageminJpegtran()]}
		);
		return this.writeStreamToFile(stream.Readable.from(buff), this.getFilePathForPage(page));
	}

	/**
	 * @param {Canvas} canvas
	 * @param {Object=} jpegOpts
	 * @return {Promise<Buffer>}
	 */
	async getJpfBuffer(canvas, jpegOpts) {
		return new Promise((resolve, reject) => {
			canvas.toBuffer((err, buf) => {
				if (err) {
					// encoding failed
					reject(err);
				}
				// buf is PNG-encoded image
				resolve(buf);
			}, 'image/jpeg', jpegOpts);
		});
	}
}

module.exports = PngWriter;
