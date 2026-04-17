# Durable Locator Patterns for Shadow DOM

**Purpose:** Guidance on writing resilient Playwright locators that work across Shadow DOM boundaries.

**Source:** Test fixtures and anti-patterns documentation.

---

## Core Principles

1. **Explicit Shadow Traversal** — Never assume elements are in light DOM
2. **Semantic Intent** — Use role and accessible name, not CSS classes
3. **Async Awareness** — Wait for shadow DOM attachment before interaction
4. **Reusable Fixtures** — Avoid copy-paste traversal code

---

## Pattern 1: Shadow Root Traversal

### ✅ Recommended: Explicit `:scope` Chain

```javascript
// Navigate through shadow boundaries explicitly
const input = page
  .locator('my-app')
  .locator(':scope')           // Enter my-app shadow root
  .locator('my-layout')
  .locator(':scope')           // Enter my-layout shadow root
  .locator('my-form')
  .locator(':scope')           // Enter my-form shadow root
  .locator('input[name="email"]');
```

**Why it works:** Each `.locator(':scope')` explicitly enters the shadow root of the parent element. This pattern is clear, debuggable, and works at any depth.

**Source:** `tests/scenarios/nested-form.test.js:52-67`

### ❌ Anti-Pattern: Direct Light DOM Access

```javascript
// WRONG: Assumes element is in light DOM
const input = page.locator('input[name="email"]');
// Error: Element not found - input is at shadow depth 3
```

---

## Pattern 2: Reusable Shadow Traversal Fixture

### ✅ Recommended: Generic `findByIntent` Helper

```javascript
// Use the shadow traversal fixture
const { findByIntent } = require('../fixtures/shadow-traversal');

// Find by role and accessible name (searches all shadow roots)
const button = await findByIntent(page, { 
  role: 'button', 
  name: 'Submit' 
});
```

**Why it works:** The fixture recursively searches all shadow roots, eliminating repetitive traversal code.

**Source:** `tests/fixtures/shadow-traversal.js:14-27`

### Implementation

```javascript
async function findByIntent(page, intent) {
  const { role, name } = intent;
  const selector = `[role="${role}"][aria-label="${name}"]`;

  // Try light DOM first
  const lightDomElement = page.locator(selector);
  const count = await lightDomElement.count();
  if (count > 0) return lightDomElement.first();

  // Recursively search shadow roots
  return await findInShadowRoots(page, selector);
}
```

---

## Pattern 3: Wait for Shadow Readiness

### ✅ Recommended: `waitForShadowReady`

```javascript
const { waitForShadowReady } = require('../fixtures/shadow-traversal');

// Wait for component shadow DOM to be ready
await waitForShadowReady(page, 'my-form');

// Now safe to interact with shadow content
const input = page.locator('my-form').locator(':scope').locator('input');
```

**Why it works:** Verifies three conditions before proceeding:
1. Element exists
2. Shadow root is attached
3. Shadow root has content

**Source:** `tests/fixtures/shadow-traversal.js:76-84`

### For Async Components

```javascript
const { waitForComponentReady } = require('../fixtures/async-wait');

// Wait for async component with delay
await waitForComponentReady(page, 'async-chart');

// Handles: 2000ms async delay + shadow DOM attachment
```

**Source:** `tests/fixtures/async-wait.js:13-18`

---

## Pattern 4: Intent-Based Locators

### ✅ Recommended: Role + Accessible Name

```javascript
const { byRoleAndName } = require('../fixtures/intent-locators');

// Semantic, resilient to DOM changes
const selector = byRoleAndName('button', 'Submit');
// Result: [role="button"][aria-label="Submit"]
```

**Why it works:** Role and accessible name are semantic properties that survive refactoring. CSS classes change frequently; roles do not.

**Source:** `tests/fixtures/intent-locators.js:12-14`

### Locator Strategy Priority

| Priority | Strategy | Resilience | Example |
|----------|----------|------------|---------|
| 1 | Role + Name | High | `getByRole('button', { name: 'Submit' })` |
| 2 | Test ID | Medium | `getByTestId('submit-btn')` |
| 3 | Text Content | Low | `getByText('Submit')` |
| 4 | CSS Class | Fragile | `.btn-primary` ❌ |
| 5 | CSS ID | Fragile | `#submit` ❌ |

---

## Pattern 5: Slot Boundary Handling

### Problem: Slotted Content

```html
<my-dialog>
  <button slot="action">Confirm</button>  <!-- In light DOM, slotted -->
</my-dialog>
```

The button is in light DOM but appears inside the dialog's shadow DOM via `<slot>`.

### ✅ Recommended: Access Slotted Content Directly

```javascript
// Slotted content is in light DOM
const button = page.locator('my-dialog button[slot="action"]');
```

### ❌ Anti-Pattern: Assume Shadow Traversal

```javascript
// WRONG: Button is slotted, not in shadow DOM
const button = page
  .locator('my-dialog')
  .locator(':scope')
  .locator('button');  // Not found - button is slotted
```

**Reference:** Playwright Issue #38166 (cited in `docs/ANTI_PATTERNS.md`)

---

## Pattern 6: Debugging Shadow Structure

### ✅ Recommended: `getAllShadowRoots`

```javascript
const { getAllShadowRoots } = require('../fixtures/shadow-traversal');

// Get all shadow roots with depth information
const shadowRoots = await getAllShadowRoots(page);

// Result:
// [
//   { tagName: 'my-app', depth: 0, path: 'document > my-app', childCount: 2 },
//   { tagName: 'my-layout', depth: 1, path: 'document > my-app > my-layout', childCount: 1 },
//   { tagName: 'my-form', depth: 2, path: 'document > my-app > my-layout > my-form', childCount: 3 }
// ]
```

**Why it works:** Provides visibility into shadow DOM structure for debugging failed selectors.

**Source:** `tests/fixtures/shadow-traversal.js:91-119`

---

## Pattern 7: Error Messages with Context

### ❌ Anti-Pattern: Generic Errors

```
Error: locator.fill: Element not found
Timeout waiting for selector
```

### ✅ Recommended: Shadow-Aware Errors

```javascript
// Include shadow depth in error context
throw new Error(
  `Element not found at shadow depth ${depth}. ` +
  `Path: ${path}. ` +
  `Check: Does the element exist inside a shadow root?`
);
```

**Source:** `docs/ANTI_PATTERNS.md:94-105`

---

## Complete Example: Nested Form Test

```javascript
const { waitForShadowReady, getAllShadowRoots } = require('../fixtures/shadow-traversal');

describe('Nested Form (3 Levels Deep)', () => {
  beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for all nested components
    await waitForShadowReady(page, 'my-app');
    await waitForShadowReady(page, 'my-layout');
    await waitForShadowReady(page, 'my-form-container');
    await waitForShadowReady(page, 'my-form');
  });

  it('finds input at depth 3', async ({ page }) => {
    // Method 1: Explicit traversal
    const input = page
      .locator('my-app')
      .locator(':scope')
      .locator('my-layout')
      .locator(':scope')
      .locator('my-form-container')
      .locator(':scope')
      .locator('my-form')
      .locator(':scope')
      .locator('input[name="email"]');

    await expect(input).toBeVisible();
    await input.fill('test@example.com');
    
    // Verify
    const value = await input.inputValue();
    expect(value).toBe('test@example.com');
  });

  it('verifies shadow structure', async ({ page }) => {
    const shadowRoots = await getAllShadowRoots(page);
    const formRoots = shadowRoots.filter(sr =>
      ['my-app', 'my-layout', 'my-form-container', 'my-form'].includes(sr.tagName)
    );
    
    expect(formRoots.length).toBe(4);
    expect(formRoots[3].depth).toBe(3);
  });
});
```

**Source:** `tests/scenarios/nested-form.test.js`

---

## Anti-Patterns Summary

From `docs/ANTI_PATTERNS.md`:

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Hardcoded traversal | Copy-paste for each test | Use `findByIntent` fixture |
| Missing depth info | Generic "not found" errors | Include shadow depth in errors |
| No slot handling | Treats slotted content as shadow | Check slot attribute |
| No async handling | Flaky tests on lazy components | Use `waitForShadowReady` |
| CSS class selectors | Breaks on refactoring | Use role + name |

---

## Quick Reference

```javascript
// Import fixtures
const { 
  findByIntent, 
  waitForShadowReady, 
  getAllShadowRoots 
} = require('../fixtures/shadow-traversal');

const { byRoleAndName, byTestId } = require('../fixtures/intent-locators');
const { waitForComponentReady } = require('../fixtures/async-wait');

// Wait for shadow DOM
await waitForShadowReady(page, 'my-component');

// Find by intent (searches all shadow roots)
const element = await findByIntent(page, { role: 'button', name: 'Submit' });

// Build semantic selector
const selector = byRoleAndName('button', 'Submit');

// Debug shadow structure
const roots = await getAllShadowRoots(page);
```

---

*Last updated: 2026-04-17*
