const crypto = require('crypto');
const fs = require('fs');
const Promise = require("bluebird");
const PDFJSLib = require('pdfjs-dist');
const PdfExtractor = require('../index').PdfExtractor;

PDFJSLib.PDFJS.disableFontFace = true;
global.Promise = Promise;
Promise.longStackTraces();

// Relative path of the PDF file.
let pdfPath = process.argv[2] || './pdfs/c_tutorial.pdf',
	numPagesLimit = parseInt(process.argv[3]) || Infinity,
	fileBuffer = fs.readFileSync(pdfPath),
	fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex'),
	outputDir = `./output/${fileHash}`;

try {
	fs.mkdirSync(outputDir);
} catch (e) {
	if (e.code !== 'EEXIST') {
		throw e;
	}
}

console.log('Output to: ' + outputDir);

let pdfExtractor = new PdfExtractor(outputDir, {
	pageRange: [1, numPagesLimit]
});

pdfExtractor.parseFromFileBuffer(fileBuffer).then(function () {
	console.log('# End of Document');
}).catch(function (err) {
	console.error('Error: ' + err);
});
