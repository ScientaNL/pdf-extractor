'use strict';

const path = require('path');
const fs = require('fs');

class FileWriter
{
	constructor(outputDir, fsWriteOptions) {
		this.outputDir = outputDir;
		this.options = fsWriteOptions || { encoding: 'utf8' };
	}

	getPagePath(pageNum, fileExt) {
		let name;
		switch (fileExt) {
			case 'html':
			case 'txt':
				name = 'text';
				break;
			default:
				name = 'page';
		}
		return this.getPathForFile(`${name}-${pageNum}.${fileExt}`);
	}

	getPathForFile(fileName) {
		return path.join(this.outputDir, fileName);
	}

	writeStringToFile(string, filePath) {
		return new Promise((resolve, reject) => {
			fs.writeFile(filePath,
				string,
				this.options,
				(err) => err === null ? resolve(filePath) : reject(err)
			)
		})
	}

	writeStreamToFile(readableStream, filePath) {
		let writableStream = fs.createWriteStream(filePath, this.options);

		readableStream.pipe(writableStream);

		return new Promise(function(resolve, reject) {
			readableStream.once('error', reject);
			writableStream.once('error', reject);
			writableStream.once('finish', resolve);
		}).catch(function(err) {
			readableStream = null; // Explicitly null because of v8 bug 6512.
			writableStream.end();
			throw err;
		});
	};
}

module.exports = FileWriter;
