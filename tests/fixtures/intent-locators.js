/**
 * Intent Locator Builder
 * Semantic locator patterns for Shadow DOM testing
 */

/**
 * Build locator by role and accessible name
 * @param {string} role - ARIA role (e.g., 'button', 'link', 'textbox')
 * @param {string} name - Accessible name (aria-label value)
 * @returns {string} - CSS selector string
 */
function byRoleAndName(role, name) {
  return `[role="${role}"][aria-label="${name}"]`;
}

/**
 * Build locator by data-testid (fallback strategy)
 * @param {string} id - Test ID value
 * @returns {string} - CSS selector string
 */
function byTestId(id) {
  return `[data-testid="${id}"]`;
}

/**
 * Build locator by text content (last resort)
 * @param {string} text - Text content to match
 * @returns {string} - Playwright text selector string
 */
function byText(text) {
  return `:text("${text}")`;
}

module.exports = {
  byRoleAndName,
  byTestId,
  byText
};
