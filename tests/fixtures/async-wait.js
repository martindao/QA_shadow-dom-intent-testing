/**
 * Async Wait Utilities
 * Handle async component loading for Shadow DOM
 */

/**
 * Wait for a custom element component to be fully ready
 * Checks for: element existence, shadowRoot, and children
 * @param {import('playwright').Page} page - Playwright page object
 * @param {string} tagName - Custom element tag name (e.g., 'my-component')
 * @returns {Promise<void>}
 */
async function waitForComponentReady(page, tagName) {
  await page.waitForFunction((tag) => {
    const el = document.querySelector(tag);
    return el && el.shadowRoot && el.shadowRoot.children.length > 0;
  }, tagName);
}

/**
 * Wait for multiple components to be ready
 * @param {import('playwright').Page} page - Playwright page object
 * @param {string[]} tagNames - Array of custom element tag names
 * @returns {Promise<void>}
 */
async function waitForComponentsReady(page, tagNames) {
  await page.waitForFunction((tags) => {
    return tags.every((tag) => {
      const el = document.querySelector(tag);
      return el && el.shadowRoot && el.shadowRoot.children.length > 0;
    });
  }, tagNames);
}

/**
 * Wait for a specific element within a shadow root
 * @param {import('playwright').Page} page - Playwright page object
 * @param {string} hostSelector - Selector for the shadow host element
 * @param {string} innerSelector - Selector for element inside shadow root
 * @returns {Promise<void>}
 */
async function waitForShadowElement(page, hostSelector, innerSelector) {
  await page.waitForFunction(({ host, inner }) => {
    const hostEl = document.querySelector(host);
    if (!hostEl || !hostEl.shadowRoot) return false;
    return hostEl.shadowRoot.querySelector(inner) !== null;
  }, { host: hostSelector, inner: innerSelector });
}

module.exports = {
  waitForComponentReady,
  waitForComponentsReady,
  waitForShadowElement
};
