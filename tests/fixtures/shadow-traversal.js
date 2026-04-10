/**
 * Shadow DOM Traversal Fixtures
 * Core utilities for piercing Shadow DOM
 */

/**
 * Recursively traverse all shadow roots to find element by intent
 * @param {import('playwright').Page} page - Playwright page object
 * @param {Object} intent - Intent object with role and name
 * @param {string} intent.role - ARIA role (e.g., 'button', 'link')
 * @param {string} intent.name - Accessible name (aria-label)
 * @returns {Promise<import('playwright').Locator|null>} - Locator or null if not found
 */
async function findByIntent(page, intent) {
  const { role, name } = intent;
  const selector = `[role="${role}"][aria-label="${name}"]`;
  
  // Try to find in light DOM first
  const lightDomElement = page.locator(selector);
  const count = await lightDomElement.count();
  if (count > 0) {
    return lightDomElement.first();
  }
  
  // Recursively search shadow roots
  return await findInShadowRoots(page, selector);
}

/**
 * Helper: Find element in all shadow roots recursively
 * @param {import('playwright').Page} page - Playwright page object
 * @param {string} selector - CSS selector to find
 * @returns {Promise<import('playwright').Locator|null>}
 */
async function findInShadowRoots(page, selector) {
  const result = await page.evaluateHandle((sel) => {
    // Recursive function to search through shadow roots
    function searchShadowRoots(root) {
      // Check if element exists in current root
      const element = root.querySelector(sel);
      if (element) {
        return element;
      }
      
      // Get all elements with shadow roots
      const shadowHosts = root.querySelectorAll('*');
      for (const host of shadowHosts) {
        if (host.shadowRoot) {
          const found = searchShadowRoots(host.shadowRoot);
          if (found) {
            return found;
          }
        }
      }
      
      return null;
    }
    
    return searchShadowRoots(document);
  }, selector);
  
  const isNull = await result.evaluate((el) => el === null);
  if (isNull) {
    return null;
  }
  
  return page.locator(selector).first();
}

/**
 * Wait for shadow DOM to be fully ready
 * @param {import('playwright').Page} page - Playwright page object
 * @param {string} selector - Selector for the shadow host element
 * @returns {Promise<void>}
 */
async function waitForShadowReady(page, selector) {
  await page.waitForFunction((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    if (!element.shadowRoot) return false;
    // Check that shadow root has content
    return element.shadowRoot.children.length > 0;
  }, selector);
}

/**
 * Get all shadow roots in the page for debugging
 * @param {import('playwright').Page} page - Playwright page object
 * @returns {Promise<Array>} - Array of shadow root information
 */
async function getAllShadowRoots(page) {
  return await page.evaluate(() => {
    const shadowRoots = [];
    
    function collectShadowRoots(root, depth = 0, path = 'document') {
      const elements = root.querySelectorAll('*');
      
      for (const element of elements) {
        if (element.shadowRoot) {
          const tagName = element.tagName.toLowerCase();
          const currentPath = `${path} > ${tagName}`;
          
          shadowRoots.push({
            tagName,
            depth,
            path: currentPath,
            childCount: element.shadowRoot.children.length
          });
          
          // Recursively search nested shadow roots
          collectShadowRoots(element.shadowRoot, depth + 1, currentPath);
        }
      }
    }
    
    collectShadowRoots(document);
    return shadowRoots;
  });
}

module.exports = {
  findByIntent,
  waitForShadowReady,
  getAllShadowRoots
};
