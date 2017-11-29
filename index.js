const packageJson = require('./package.json');
const PdfExtractor = require('./lib/PdfExtractor');
const CanvasRenderer = require('./lib/renderer/CanvasRenderer');
const SvgRenderer = require('./lib/renderer/SvgRenderer');

module.exports.PdfExtractor = PdfExtractor;
module.exports.CanvasRenderer = CanvasRenderer;
module.exports.SvgRenderer = SvgRenderer;
module.exports.version = packageJson.version;
