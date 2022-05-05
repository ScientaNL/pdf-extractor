'use strict';

const SimpleLinkService = require('./pdf_link_service');
const {AnnotationLayer} = require('pdfjs-dist/lib/pdf');
const {AnnotationType} = require('pdfjs-dist/lib/shared/util');

/** @typedef {import("pdfjs-dist/types/src/display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("pdfjs-dist/types/src/display/display_utils").PageViewport} PageViewport */

// Adapted from https://github.com/mozilla/pdf.js/blob/v2.0.943/web/annotation_layer_builder.js
class AnnotationLayerBuilder {
    /**
     * @param {PDFPageProxy} page
     * @param {PageViewport} viewport
     * @param {boolean=} layerDimensions
     * @return {Promise<HTMLDivElement>}
     */
    static async renderPage(page, viewport, layerDimensions) {
        layerDimensions = layerDimensions == null ? false : layerDimensions;
        let annotations = await page.getAnnotations({intent: 'display'});
        annotations = annotations.filter(a => a.annotationType === AnnotationType.LINK);
        annotations.forEach(a => a.newWindow = true);

        const div = document.createElement('div');
        div.className = 'annotationLayer';

        if (layerDimensions) {
            div.setAttribute("style", `width:${viewport.width}px; height:${viewport.height}px;`);
        }

        if (annotations) {
            AnnotationLayer.render({
                viewport: viewport.clone({dontFlip: true}),
                annotations,
                page: page,
                linkService: new SimpleLinkService(),
                div
            });
        }

        return div;
    }
}

module.exports = AnnotationLayerBuilder;
