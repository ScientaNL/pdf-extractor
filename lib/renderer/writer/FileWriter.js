'use strict';

const fs = require('fs');

class FileWriter
{
	constructor(fsWriteOptions) {
		this.options = fsWriteOptions || { encoding: 'utf8' };
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

		return new Promise(function(resolve, reject) {
			readableStream.once('error', reject);
			writableStream.once('error', reject);
			writableStream.once('finish', resolve);
			readableStream.pipe(writableStream);
		}).catch(function(err) {
			readableStream = null; // Explicitly null because of v8 bug 6512.
			writableStream.end();
			throw err;
		});
	};
}

module.exports = FileWriter;
