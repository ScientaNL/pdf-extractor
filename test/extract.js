const crypto = require('crypto');
const fs = require('fs');
const ejs = require('ejs');
const Promise = require("bluebird");
const PdfExtractor = require('../index').PdfExtractor;

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
	pdfJs: { disableFontFace: true },
	viewportScale: (width, height) => {
		if (width > height) {
			return 1100 / width;
		}
		return 800 / width;
	},
	pageRange: [1, numPagesLimit]
});

pdfExtractor.parseFromFileBuffer(fileBuffer).then(function (doc) {

	console.log('# End of Document');

	console.log('Parsing html preview');

	setTimeout(() => {
		let fileInfo = JSON.parse(fs.readFileSync(outputDir + '/info.json', {encoding: 'utf8'}));

		ejs.renderFile('./template.ejs', {dir:outputDir, info: fileInfo}, {}, function(err, result){
			fs.writeFile(outputDir + '/preview.html', result, { encoding: 'utf8' }, function(err) {
				if (err) {
					return console.log(err);
				}

				console.log('Done :' + outputDir);
			});
		})
	}, 20);



}).catch(function (err) {
	console.error('Error: ' + err);
});
