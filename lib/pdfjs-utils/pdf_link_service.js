// Adapted from https://github.com/mozilla/pdf.js/blob/399a0ec603bca8fde70e30ae30ee802a0cf71db2/web/ui_utils.js#L215
const NullCharactersRegExp = /\x00/g;
const InvisibleCharactersRegExp = /[\x01-\x1F]/g;

/**
 * @param {string} str
 * @param {boolean} [replaceInvisible]
 */
function removeNullCharacters(str, replaceInvisible = false) {
  if (typeof str !== "string") {
    console.error(`The argument must be a string.`);
    return str;
  }
  if (replaceInvisible) {
    str = str.replace(InvisibleCharactersRegExp, " ");
  }
  return str.replace(NullCharactersRegExp, "");
}

// Adapted from https://github.com/mozilla/pdf.js/blob/v2.13.216/web/pdf_link_service.js

const DEFAULT_LINK_REL = "noopener noreferrer nofollow";

const LinkTarget = {
  NONE: 0, // Default value.
  SELF: 1,
  BLANK: 2,
  PARENT: 3,
  TOP: 4,
};

/**
 * @typedef ExternalLinkParameters
 * @typedef {Object} ExternalLinkParameters
 * @property {string} url - An absolute URL.
 * @property {LinkTarget} [target] - The link target. The default value is
 *   `LinkTarget.NONE`.
 * @property {string} [rel] - The link relationship. The default value is
 *   `DEFAULT_LINK_REL`.
 * @property {boolean} [enabled] - Whether the link should be enabled. The
 *   default value is true.
 */

/**
 * Adds various attributes (href, title, target, rel) to hyperlinks.
 * @param {HTMLAnchorElement} link - The link element.
 * @param {ExternalLinkParameters} params
 */
function addLinkAttributes(link, { url, target, rel, enabled = true } = {}) {
  if (!url || typeof url !== "string") {
    throw new Error('A valid "url" parameter must provided.');
  }

  const urlNullRemoved = removeNullCharacters(url);
  if (enabled) {
    link.href = link.title = urlNullRemoved;
  } else {
    link.href = "";
    link.title = `Disabled: ${urlNullRemoved}`;
    link.onclick = () => {
      return false;
    };
  }

  let targetStr = ""; // LinkTarget.NONE
  switch (target) {
    case LinkTarget.NONE:
      break;
    case LinkTarget.SELF:
      targetStr = "_self";
      break;
    case LinkTarget.BLANK:
      targetStr = "_blank";
      break;
    case LinkTarget.PARENT:
      targetStr = "_parent";
      break;
    case LinkTarget.TOP:
      targetStr = "_top";
      break;
  }
  link.target = targetStr;

  link.rel = typeof rel === "string" ? rel : DEFAULT_LINK_REL;
}

/**
 * @implements {IPDFLinkService}
 */
class SimpleLinkService {
  constructor() {
    this.externalLinkEnabled = true;
  }

  /**
   * @type {number}
   */
  get pagesCount() {
    return 0;
  }

  /**
   * @type {number}
   */
  get page() {
    return 0;
  }

  /**
   * @param {number} value
   */
  set page(value) {}

  /**
   * @type {number}
   */
  get rotation() {
    return 0;
  }

  /**
   * @param {number} value
   */
  set rotation(value) {}

  /**
   * @param {string|Array} dest - The named, or explicit, PDF destination.
   */
  async goToDestination(dest) {}

  /**
   * @param {number|string} val - The page number, or page label.
   */
  goToPage(val) {}

  /**
   * @param {HTMLAnchorElement} link
   * @param {string} url
   * @param {boolean} [newWindow]
   */
  addLinkAttributes(link, url, newWindow = false) {
    addLinkAttributes(link, { url, enabled: this.externalLinkEnabled });
  }

  /**
   * @param dest - The PDF destination object.
   * @returns {string} The hyperlink to the PDF object.
   */
  getDestinationHash(dest) {
    return "#";
  }

  /**
   * @param hash - The PDF parameters/hash.
   * @returns {string} The hyperlink to the PDF object.
   */
  getAnchorUrl(hash) {
    return "#";
  }

  /**
   * @param {string} hash
   */
  setHash(hash) {}

  /**
   * @param {string} action
   */
  executeNamedAction(action) {}

  /**
   * @param {number} pageNum - page number.
   * @param {Object} pageRef - reference to the page.
   */
  cachePageRef(pageNum, pageRef) {}

  /**
   * @param {number} pageNumber
   */
  isPageVisible(pageNumber) {
    return true;
  }

  /**
   * @param {number} pageNumber
   */
  isPageCached(pageNumber) {
    return true;
  }
}

module.exports = SimpleLinkService;
