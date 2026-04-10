/**
 * Scenario 3: Async Component Loading
 * Tests delayed shadow attachment, waitForComponentReady, chart visibility after delay
 */

const { describe, it, beforeEach } = require('vitest');
const { expect } = require('vitest');
const { findByIntent, waitForShadowReady, getAllShadowRoots } = require('../fixtures/shadow-traversal');
const { byRoleAndName } = require('../fixtures/intent-locators');
const { waitForComponentReady, waitForShadowElement } = require('../fixtures/async-wait');
const { appendSelectorHistory } = require('../../runtime/store');

describe('Scenario 3: Async Component Loading', () => {
  beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/');
  });

  it('traditional selector fails - element not found before shadow attached', async ({ page }) => {
    const startTime = Date.now();
    
    // Traditional approach: Try to find chart immediately
    // This FAILS because shadow DOM is attached after 2000ms delay
    const chart = page.locator('.chart');
    
    try {
      await chart.waitFor({ state: 'visible', timeout: 5000 });
      // If we get here before 2000ms, test fails (chart should not exist yet)
      throw new Error('Chart should not be visible before shadow attachment');
    } catch (error) {
      // Expected: timeout error
      expect(error.message).toContain('Timeout');
      
      // Record selector history
      appendSelectorHistory({
        scenario: 'async-component',
        approach: 'traditional',
        selector: 'locator(".chart")',
        result: 'failed',
        error: 'Element not found - shadow DOM not attached yet',
        duration_ms: Date.now() - startTime,
        shadow_depth: 1,
        async_delay_ms: 2000
      });
    }
  });

  it('intent-based selector succeeds - waitForComponentReady handles delay', async ({ page }) => {
    const startTime = Date.now();
    
    // Intent-based approach: Wait for component to be fully ready
    // This checks: element exists, shadowRoot exists, children.length > 0
    await waitForComponentReady(page, 'async-chart');
    
    const waitDuration = Date.now() - startTime;
    
    // Verify wait was approximately 2000ms (the component's delay)
    expect(waitDuration).toBeGreaterThanOrEqual(1900); // Allow some tolerance
    expect(waitDuration).toBeLessThan(5000);
    
    // Now access the chart
    const chart = page
      .locator('async-chart')
      .locator(':scope')
      .locator('.chart');
    
    await expect(chart).toBeVisible();
    
    // Record selector history
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'waitForComponentReady + shadow traversal',
      result: 'passed',
      duration_ms: waitDuration,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });

  it('delayed shadow attachment - verify timing', async ({ page }) => {
    // Record start time
    const startTime = Date.now();
    
    // Wait for component to be ready
    await waitForComponentReady(page, 'async-chart');
    
    const elapsed = Date.now() - startTime;
    
    // Verify shadow was attached after ~2000ms
    expect(elapsed).toBeGreaterThanOrEqual(1900);
    
    // Verify shadow root exists
    const hasShadowRoot = await page.evaluate(() => {
      const component = document.querySelector('async-chart');
      return component && component.shadowRoot !== null;
    });
    
    expect(hasShadowRoot).toBe(true);
    
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'delayed shadow attachment timing',
      result: 'passed',
      duration_ms: elapsed,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });

  it('chart visibility after delay', async ({ page }) => {
    // Wait for component
    await waitForComponentReady(page, 'async-chart');
    
    // Access chart through shadow DOM
    const chart = page
      .locator('async-chart')
      .locator(':scope')
      .locator('.chart');
    
    // Verify chart properties
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute('role', 'img');
    await expect(chart).toHaveAttribute('aria-label', 'Sales Chart');
    
    // Verify SVG exists inside chart
    const svg = chart.locator('svg');
    await expect(svg).toBeVisible();
    
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'chart visibility after delay',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });

  it('waitForShadowElement - specific element inside shadow', async ({ page }) => {
    // Use waitForShadowElement to wait for specific element
    await waitForShadowElement(page, 'async-chart', '.chart');
    
    // Now access the chart
    const chart = page
      .locator('async-chart')
      .locator(':scope')
      .locator('.chart');
    
    await expect(chart).toBeVisible();
    
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'waitForShadowElement fixture',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });

  it('shadow DOM structure verification - async attachment', async ({ page }) => {
    // Initially, shadow root should not exist
    const initialShadowState = await page.evaluate(() => {
      const component = document.querySelector('async-chart');
      return {
        exists: component !== null,
        hasShadowRoot: component?.shadowRoot !== null
      };
    });
    
    expect(initialShadowState.exists).toBe(true);
    expect(initialShadowState.hasShadowRoot).toBe(false);
    
    // Wait for shadow attachment
    await waitForComponentReady(page, 'async-chart');
    
    // Now shadow root should exist
    const shadowRoots = await getAllShadowRoots(page);
    const asyncChartRoot = shadowRoots.find(sr => sr.tagName === 'async-chart');
    
    expect(asyncChartRoot).toBeDefined();
    expect(asyncChartRoot.childCount).toBeGreaterThan(0);
    
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'async shadow structure verification',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });

  it('chart content verification - SVG bars rendered', async ({ page }) => {
    // Wait for component
    await waitForComponentReady(page, 'async-chart');
    
    // Access chart
    const chart = page
      .locator('async-chart')
      .locator(':scope')
      .locator('.chart');
    
    // Verify SVG structure
    const svg = chart.locator('svg');
    
    // Check for 4 bar rectangles (as defined in component)
    const bars = svg.locator('rect');
    const barCount = await bars.count();
    expect(barCount).toBe(4);
    
    // Verify each bar has proper attributes
    for (let i = 0; i < barCount; i++) {
      const bar = bars.nth(i);
      await expect(bar).toHaveAttribute('fill', 'rgba(255,255,255,0.8)');
    }
    
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'chart SVG content verification',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });

  it('component state before and after shadow attachment', async ({ page }) => {
    // Check state before shadow attachment
    const beforeState = await page.evaluate(() => {
      const component = document.querySelector('async-chart');
      return {
        exists: component !== null,
        hasShadowRoot: component?.shadowRoot !== null,
        childCount: component?.shadowRoot?.children?.length || 0
      };
    });
    
    expect(beforeState.exists).toBe(true);
    expect(beforeState.hasShadowRoot).toBe(false);
    expect(beforeState.childCount).toBe(0);
    
    // Wait for shadow attachment
    await waitForComponentReady(page, 'async-chart');
    
    // Check state after shadow attachment
    const afterState = await page.evaluate(() => {
      const component = document.querySelector('async-chart');
      return {
        hasShadowRoot: component?.shadowRoot !== null,
        childCount: component?.shadowRoot?.children?.length || 0
      };
    });
    
    expect(afterState.hasShadowRoot).toBe(true);
    expect(afterState.childCount).toBeGreaterThan(0);
    
    appendSelectorHistory({
      scenario: 'async-component',
      approach: 'intent-based',
      selector: 'component state transition',
      result: 'passed',
      duration_ms: 0,
      shadow_depth: 1,
      async_delay_ms: 2000
    });
  });
});
