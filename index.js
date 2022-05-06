const packageJson = require('./package.json');
const PdfExtractor = require('./lib/PdfExtractor');

const CanvasRenderer = require('./lib/renderer/CanvasRenderer');
const SvgRenderer = require('./lib/renderer/SvgRenderer');

const FileWriter = require('./lib/renderer/writer/FileWriter');
const HtmlWriter = require('./lib/renderer/writer/HtmlCanvasWriter');
const SvgWriter = require('./lib/renderer/writer/SvgWriter');
const TextWriter = require('./lib/renderer/writer/TextCanvasWriter');

module.exports.PdfExtractor = PdfExtractor;

module.exports.CanvasRenderer = CanvasRenderer;
module.exports.SvgRenderer = SvgRenderer;

module.exports.FileWriter = FileWriter;
module.exports.HtmlWriter = HtmlWriter;
module.exports.SvgWriter = SvgWriter;
module.exports.TextWriter = TextWriter;

module.exports.version = packageJson.version;
