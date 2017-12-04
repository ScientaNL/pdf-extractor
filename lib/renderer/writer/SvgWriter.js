'use strict';

const { Readable } = require('stream');
const FileWriter = require('./FileWriter');

/**
 * A readable stream which offers a stream representing the serialization of a
 * given DOM element (as defined by pdf.js' lib/examples/node/domstubs.js).
 */
class ReadableSvgStream extends Readable
{
	/**
	 * @param {object} DOMElement The element to serialize
	 * @param {object} options
	 */
	constructor(DOMElement, options) {
		super(options);
		this.serializer = DOMElement.getSerializer();
	}

	_read() {
		let chunk;
		while ((chunk = this.serializer.getNext()) !== null) {
			if (!this.push(chunk)) {
				return;
			}
		}
		this.push(null);
	}
}

class SvgWriter extends FileWriter
{
	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'svg');
	}

	writeSvgPage(page, DOMElement) {
		return this.writeStreamToFile(new ReadableSvgStream(DOMElement), this.getFilePathForPage(page));
	};
}

module.exports = SvgWriter;
