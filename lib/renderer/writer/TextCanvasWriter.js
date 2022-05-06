'use strict';

const FileWriter = require('./FileWriter');
const { Util } = require('pdfjs-dist/lib/shared/util');

class TextCanvasWriter extends FileWriter
{
	constructor(outputDir, options) {
		options = options || {};
		super(outputDir, options);
		this.metaDataHandler = null;
	}

	setMetaDataHandler(metaDataHandler) {
		this.metaDataHandler = metaDataHandler;
	}

	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'txt');
	}

	/**
	 * @param {PDFPageProxy} page
	 * @param {PageViewport} viewport
	 * @param {Canvas} canvas
	 * @return {Promise<*>}
	 */
	async writeCanvasPage(page, viewport, canvas) {
		return page.getTextContent({
			normalizeWhitespace: true,
			disableCombineTextItems: true
		}).then((textContent) => {
			return textContent.items.map((textItem) => {
				return this.buildTextItem(textItem, textContent.styles[textItem.fontName], viewport);
			});
		}).then((textItems) => {
			return this.writeStringToFile(this.parseTextItems(textItems), this.getFilePathForPage(page));
		});
	}

	parseTextItems(textItems) {
		let text = '';
		if (textItems.length <= 0) {
			return text;
		}

		let i = 0, item, itemLookAhead;
		do {
			item = textItems[i];
			itemLookAhead = textItems[i+1];
			text += this.getTextForItem(item, itemLookAhead);
			i++;
		}
		while (itemLookAhead !== undefined);

		return text;
	}

	getTextForItem(textItem, textItemLookAhead) {
		if (!textItemLookAhead || textItem.isWhitespace || textItemLookAhead.isWhitespace) {
			return textItem.str;
		}

		//Check if we are on the same horizontal line
		let sameLine = Math.round(textItem.y) === Math.round(textItemLookAhead.y);
		if (!sameLine && (textItem.angle === 0 || textItemLookAhead.angle === 0)) {
			let topY = Math.max(textItem.boundingBox.top, textItemLookAhead.boundingBox.top),
				bottomY = Math.min(textItem.boundingBox.bottom, textItemLookAhead.boundingBox.bottom),
				heightOverlap = bottomY <= topY ? 0 : bottomY - topY;

			// We assume we  are at the same line if the y coords of the bBox overlap,
			// and the overlap height is as big as half of the height of the smallest bBox
			sameLine = heightOverlap >= (Math.min(textItem.height, textItemLookAhead.height) / 2);
		} else {
			//todo: calculate same line when text has an angle or is vertical
		}

		let spaceWidth = 2 * textItem.viewportScale,
			lookAheadSameWord = sameLine && (textItem.boundingBox.right + spaceWidth) > textItemLookAhead.boundingBox.left;

		return lookAheadSameWord ? textItem.str : (textItem.str + ' ');
	}

	buildTextItem(textItem, style, viewport) {
		let tx = Util.transform(viewport.transform, textItem.transform),
			isWhitespace = this.isAllWhitespace(textItem.str),
			angle = Math.atan2(tx[1], tx[0]),
			width = textItem.width * viewport.scale;

		//adjust for vertical style
		if (style.vertical) {
			angle += Math.PI / 2;
			width = textItem.height * viewport.scale;
		}

		// see https://github.com/mozilla/pdf.js/issues/8276
		let fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
		let fontAscent = fontHeight;

		// calculate ascent
		if (style.ascent) {
			fontAscent = style.ascent * fontAscent;
		} else if (style.descent) {
			fontAscent = (1 + style.descent) * fontAscent;
		} else {
			fontAscent = fontAscent / 2;
		}

		let x = tx[4], y = tx[5];

		// adjust for font ascent/descent
		if (angle === 0) {
			y -= fontAscent;
		} else {
			x += fontAscent * Math.sin(angle);
			y -= fontAscent * Math.cos(angle);
		}

		//Calculate bounds
		let bBoxWidth = (style.vertical ? textItem.height : textItem.width) * viewport.scale,
			bBoxHeight = fontHeight,
			m, b;
		if (angle !== 0) {
			let angleCos = Math.cos(angle), angleSin = Math.sin(angle);
			m = [angleCos, angleSin, -angleSin, angleCos, x, y];
			b = Util.getAxialAlignedBoundingBox([0, 0, bBoxWidth, bBoxHeight], m);
		} else {
			b = [x, y, x + bBoxWidth, y + bBoxHeight];
		}

		let bBox = {
			left: b[0],
			top: b[1],
			right: b[2],
			bottom: b[3],
			size: [bBoxWidth, bBoxHeight],
			m: m
		};

		return {
			str: textItem.str,
			dir: textItem.dir,
			x,
			y,
			width: width,
			height: fontHeight,
			angle: angle !== 0 ? angle * (180 / Math.PI) : 0,
			boundingBox: bBox,
			style: style,
			fontName: textItem.fontName,
			viewportScale: viewport.scale,
			isWhitespace: isWhitespace
		};
	}

	isAllWhitespace(str) {
		return !/\S/.test(str);
	}
}

module.exports = TextCanvasWriter;
