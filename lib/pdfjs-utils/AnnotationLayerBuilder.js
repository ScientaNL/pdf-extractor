'use strict';

const {AnnotationLayer} = require('pdfjs-dist/lib/pdf');
const {AnnotationType} = require('pdfjs-dist/lib/shared/util');

// Adapted from https://github.com/mozilla/pdf.js/blob/v2.0.943/web/annotation_layer_builder.js
class AnnotationLayerBuilder {
    static async render(page, viewport) {
        let annotations = await page.getAnnotations({intent: 'display'});
        annotations = annotations.filter(a => a.annotationType === AnnotationType.LINK);
        annotations.forEach(a => a.newWindow = true);

        const div = document.createElement('div');
        div.className = 'annotationLayer';

        if (annotations) {
            AnnotationLayer.render({
                viewport: viewport.clone({dontFlip: true}),
                annotations,
                page: page,
                div
            });
        }

        return div;
    }
}

module.exports = AnnotationLayerBuilder;
