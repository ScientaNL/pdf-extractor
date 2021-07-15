// Adapted from https://github.com/mozilla/pdf.js/blob/v2.0.943/web/pdf_link_service.js


/**
 * @implements {IPDFLinkService}
 */
class SimpleLinkService {
  constructor() {
    this.externalLinkTarget = null;
    this.externalLinkRel = null;
  }

  /**
   * @returns {number}
   */
  get pagesCount() {
    return 0;
  }

  /**
   * @returns {number}
   */
  get page() {
    return 0;
  }

  /**
   * @param {number} value
   */
  set page(value) {
  }

  /**
   * @returns {number}
   */
  get rotation() {
    return 0;
  }

  /**
   * @param {number} value
   */
  set rotation(value) {
  }

  /**
   * @param dest - The PDF destination object.
   */
  navigateTo(dest) {
  }

  /**
   * @param dest - The PDF destination object.
   * @returns {string} The hyperlink to the PDF object.
   */
  getDestinationHash(dest) {
    return '#';
  }

  /**
   * @param hash - The PDF parameters/hash.
   * @returns {string} The hyperlink to the PDF object.
   */
  getAnchorUrl(hash) {
    return '#';
  }

  /**
   * @param {string} hash
   */
  setHash(hash) {
  }

  /**
   * @param {string} action
   */
  executeNamedAction(action) {
  }

  /**
   * @param {number} pageNum - page number.
   * @param {Object} pageRef - reference to the page.
   */
  cachePageRef(pageNum, pageRef) {
  }
}

module.exports = SimpleLinkService;
