/**
 * Scenario 1: Slotted Dialog Automation
 * Tests slot boundary crossing, button visibility through shadow, event retargeting
 */

const { describe, it, beforeEach } = require('vitest');
const { expect } = require('vitest');
const { findByIntent, waitForShadowReady, getAllShadowRoots } = require('../fixtures/shadow-traversal');
const { byRoleAndName } = require('../fixtures/intent-locators');
const { appendSelectorHistory } = require('../../runtime/store');

describe('Scenario 1: Slotted Dialog', () => {
  beforeEach(async ({ page }) => {
    // Navigate to demo page with slotted-dialog component
    await page.goto('/');
    await waitForShadowReady(page, 'slotted-dialog');
  });

  it('traditional selector fails - button not found in light DOM', async ({ page }) => {
    const startTime = Date.now();
    
    // Traditional approach: Try to find button through role-based selector
    // This FAILS because button is inside shadow DOM
    const dialog = page.getByRole('dialog');
    
    // Attempt to find button within dialog - will timeout
    const button = dialog.getByRole('button', { name: 'Confirm' });
    
    // This should fail with timeout
    try {
      await button.click({ timeout: 5000 });
      // If we get here, test fails (button should not be found)
      throw new Error('Button should not be found with traditional selector');
    } catch (error) {
      // Expected: timeout error
      expect(error.message).toContain('Timeout');
      
      // Record selector history
      appendSelectorHistory({
        scenario: 'slotted-dialog',
        approach: 'traditional',
        selector: 'getByRole("dialog").getByRole("button", { name: "Confirm" })',
        result: 'failed',
        error: 'Element not found - button is in shadow DOM',
        duration_ms: Date.now() - startTime,
        shadow_depth: 1
      });
    }
  });

  it('intent-based selector succeeds - shadow traversal finds button', async ({ page }) => {
    const startTime = Date.now();
    
    // Intent-based approach: Use shadow traversal fixture
    const dialog = page.locator('slotted-dialog');
    const shadowRoot = dialog.locator(':scope');
    
    // Find button within shadow root
    const button = shadowRoot.locator('button[role="button"]');
    
    // Verify button is visible
    await expect(button).toBeVisible();
    
    // Click should succeed
    await button.click();
    
    const duration = Date.now() - startTime;
    
    // Record selector history
    appendSelectorHistory({
      scenario: 'slotted-dialog',
      approach: 'intent-based',
      selector: 'locator("slotted-dialog").shadowRoot().locator("button[role=\\"button\\"]")',
      result: 'passed',
      duration_ms: duration,
      shadow_depth: 1
    });
  });

  it('slot boundary crossing - content projection works', async ({ page }) => {
    // Verify slot content is projected correctly
    const dialog = page.locator('slotted-dialog');
    
    // Check that slot content is visible
    const shadowContent = dialog.locator(':scope');
    
    // Verify dialog structure
    const dialogDiv = shadowContent.locator('.dialog[role="dialog"]');
    await expect(dialogDiv).toHaveAttribute('aria-modal', 'true');
    
    // Verify slot elements exist
    const titleSlot = shadowContent.locator('slot[name="title"]');
    const contentSlot = shadowContent.locator('slot[name="content"]');
    
    await expect(titleSlot).toBeVisible();
    await expect(contentSlot).toBeVisible();
    
    appendSelectorHistory({
      scenario: 'slotted-dialog',
      approach: 'intent-based',
      selector: 'slot boundary verification',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1
    });
  });

  it('button visibility through shadow boundary', async ({ page }) => {
    // Verify button is visible when accessed through shadow DOM
    const dialog = page.locator('slotted-dialog');
    const button = dialog.locator('button#confirm-btn');
    
    // Button should be visible
    await expect(button).toBeVisible();
    
    // Button should have correct role
    await expect(button).toHaveAttribute('role', 'button');
    
    // Button should be clickable
    await button.click();
    
    appendSelectorHistory({
      scenario: 'slotted-dialog',
      approach: 'intent-based',
      selector: 'button visibility through shadow',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1
    });
  });

  it('event retargeting - click event reaches shadow host', async ({ page }) => {
    // Set up event listener on shadow host
    await page.evaluate(() => {
      const dialog = document.querySelector('slotted-dialog');
      dialog.addEventListener('click', (e) => {
        dialog.dataset.clicked = 'true';
      });
    });
    
    // Click button inside shadow DOM
    const button = page.locator('slotted-dialog button#confirm-btn');
    await button.click();
    
    // Verify event was retargeted to host
    const clicked = await page.evaluate(() => {
      const dialog = document.querySelector('slotted-dialog');
      return dialog.dataset.clicked === 'true';
    });
    
    expect(clicked).toBe(true);
    
    appendSelectorHistory({
      scenario: 'slotted-dialog',
      approach: 'intent-based',
      selector: 'event retargeting verification',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1
    });
  });

  it('shadow DOM structure verification', async ({ page }) => {
    // Get all shadow roots for debugging
    const shadowRoots = await getAllShadowRoots(page);

    // Find slotted-dialog shadow root
    const dialogShadow = shadowRoots.find(sr => sr.tagName === 'slotted-dialog');

    expect(dialogShadow).toBeDefined();
    expect(dialogShadow.depth).toBe(0);
    expect(dialogShadow.childCount).toBeGreaterThan(0);

    appendSelectorHistory({
      scenario: 'slotted-dialog',
      approach: 'intent-based',
      selector: 'shadow structure verification',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1
    });
  });

  // Accessibility-aware locator example (minor enhancement)
  // Role/name locators are more resilient than CSS selectors because they:
  // 1. Match how assistive technology perceives the element
  // 2. Survive DOM restructuring that preserves semantic meaning
  // 3. Fail explicitly when accessibility attributes are missing
  it('accessibility-aware locator - role and name pattern', async ({ page }) => {
    // Using byRoleAndName helper for semantic, accessibility-aligned selection
    // This pattern mirrors Playwright's getByRole('button', {name: '...'})
    // but works within shadow DOM traversal context
    const dialog = page.locator('slotted-dialog');
    const shadowContent = dialog.locator(':scope');

    // Accessibility-aware: select by role + aria-label (semantic intent)
    // More resilient than 'button#confirm-btn' CSS selector
    const confirmButton = shadowContent.locator(
      byRoleAndName('button', 'Confirm')
    );

    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    appendSelectorHistory({
      scenario: 'slotted-dialog',
      approach: 'accessibility-aware',
      selector: 'byRoleAndName("button", "Confirm")',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1
    });
  });
});
