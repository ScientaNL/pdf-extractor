# pdf-extractor

Pdf-extractor is a wrapper around [pdf.js](https://github.com/mozilla/pdf.js) to generate 
images, svgs, html files, text files and json files from a pdf on node.js.

- Image: A DOM Canvas is used to render and export the graphical layer of the pdf.
    Canvas exports *.png as a default but can be extended to export to other file types like *.jpg.
- SVG: Pdf objects are converted to svg using the
    [SVGGraphics parser](https://github.com/mozilla/pdf.js/blob/master/src/display/svg.js) of pdf.js.
- HTML: Pdf text is converted to HTML. This can be used as a (transparent) layer over the image
    to enable text selection.
- Text: Pdf text is extracted to a text file for different usages (e.g. indexing the text).

## PDF.js on Node.js
This library is in it's most basic form a node.js wrapper for pdf.js.
It has default renderers to generate a default output, but is easily extended to incorporate custom logic or
to generate different output. It uses a node.js DOM and the node domstub from pdf.js do make pdf parsing 
available on node.js without a browser.

## Box View / Crocodoc
This project is inspired by the Box View / Crocodoc way of converting documents (with this tool pdfs) 
to web-assets: images and html. The generated files match the files of Box View. 
This makes this library an option to transition from the Box View API to an open-source solution.

## Examples
This library can be used as-is to generate assets from a pdf. The only requirements are a pdf as input and 
a writable directory as output. The extractor can also be used for rendering in different ways.
The renderers can be extended or new ones can be injected into the extractor to render a pdf in new ways.

### Extractor
How to use the default extractor to render png, html and text files for pdf pages:

```javascript
const PdfExtractor = require('pdf-extractor').PdfExtractor;

let outputDir = '/path/to/output',

pdfExtractor = new PdfExtractor(outputDir, {
	canvasZoom: 1.5,
	pageRange: [1,5],
});

pdfExtractor.parse('/path/to/dummy.pdf').then(function () {
	console.log('# End of Document');
}).catch(function (err) {
	console.error('Error: ' + err);
});
```

This results in these generated files:
```
info.json
page-1.png
page-2.png
page-3.png
page-4.png
page-5.png
stylesheet.css
text-1.html
text-1.txt
text-2.html
text-2.txt
text-3.html
text-3.txt
text-4.html
text-4.txt
text-5.html
text-5.txt
```

### Using a custom renderer
It is relatively easy to extend or create new renderers/writers.
Below an example to use the Canvas capability for *.jpg file generation.

```javascript
const PdfExtractor = require('pdf-extractor').PdfExtractor;
const CanvasRenderer = require('pdf-extractor').CanvasRenderer;
const SvgRenderer = require('pdf-extractor').SvgRenderer;
const FileWriter = require('pdf-extractor').FileWriter;

class JPGWriter extends FileWriter
{
	getFilePathForPage(page) {
		return super.getPagePath(page.pageNumber, 'png');
	}

	writeCanvasPage(page, viewport, canvas) {
		return this.writeStreamToFile(canvas.jpgStream(), this.getFilePathForPage(page))
	}
}

class JPGCanvasRenderer extends CanvasRenderer
{
	getWriters(writerOptions) {
		let writers = super.getWriters(writerOptions);
		writers.push(new JPGWriter(this.outputDir, writerOptions));
		return writers;
	}
}

let outputDir = '/path/to/output',

pdfExtractor = new PdfExtractor(outputDir, {
	renderers: [
		new JPGCanvasRenderer(outputDir, rendererOptions),
		new SvgRenderer(outputDir, rendererOptions)
	]
});

pdfExtractor.parse('/path/to/dummy.pdf').then(function () {
	console.log('# End of Document');
}).catch(function (err) {
	console.error('Error: ' + err);
});
```

This adds jpg images to the generated files.
