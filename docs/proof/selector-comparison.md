# Selector Comparison: Traditional vs Intent-Based

**Purpose:** Side-by-side comparison demonstrating why traditional selectors fail with Shadow DOM and how intent-based approaches succeed.

**Evidence Classification:**
- ✅ **Supported** — Direct evidence from test files
- ⚠️ **Qualified** — Documented but not executed (no runtime data)
- 📊 **Illustrative** — Example patterns for educational purposes

---

## Executive Summary

| Metric | Traditional | Intent-Based | Evidence |
|--------|-------------|--------------|----------|
| Pass Rate | 27% (12/45) | 93% (42/45) | ⚠️ Qualified — ARTIFACT_SCHEMA.md |
| Improvement Factor | — | 3.4x | ✅ Supported — 93/27 ≈ 3.44 |
| Max Shadow Depth | Fails at depth 1 | Works at depth 3 | ✅ Supported — nested-form.test.js |

**Note:** Pass rates are documented in ARTIFACT_SCHEMA.md but no runtime execution data exists. See [Claim Audit](/.sisyphus/evidence/task-1-claim-audit.md) for details.

---

## Scenario 1: Slotted Dialog (Slot Boundary)

### Problem
Dialog component uses `<slot>` to inject content. The button exists in a different shadow tree than the dialog container.

### Traditional Approach — FAILS

```javascript
// ❌ Traditional: Cannot cross slot boundaries
const dialog = page.getByRole('dialog');
const button = dialog.getByRole('button', { name: 'Confirm' });

// Error: TimeoutError - Element matching "button" not found within dialog
// REASON: The button exists in a different shadow tree (slotted content)
// getByRole() cannot traverse slot boundaries
```

**Source:** `tests/regression/traditional-selectors.test.js:28-49`

### Intent-Based Approach — SUCCEEDS

```javascript
// ✅ Intent-based: Explicit shadow traversal
const button = page
  .locator('my-dialog')
  .locator(':scope')  // Enter shadow root
  .locator('button[role="button"]');

// Result: Element found and clicked successfully
// WHY IT WORKS: shadowRoot() explicitly traverses into the shadow boundary
```

**Source:** `tests/regression/intent-based-selectors.test.js:28-47`

---

## Scenario 2: Nested Form (3 Levels Deep)

### Problem
Form input is nested inside 3 levels of Shadow DOM: `my-app → my-layout → my-form-container → my-form → input`

### Traditional Approach — FAILS

```javascript
// ❌ Traditional: Cannot pierce shadow boundaries
const emailInput = page.locator('input[name="email"]');

// Error: locator.fill: Element not found
// REASON: Input is nested 3 shadow DOM levels deep
// Traditional selectors cannot pierce shadow boundaries
// Structure: my-app.shadowRoot → my-layout.shadowRoot → my-form-container.shadowRoot → input
```

**Source:** `tests/regression/traditional-selectors.test.js:57-78`

### Intent-Based Approach — SUCCEEDS

```javascript
// ✅ Intent-based: Recursive shadow traversal
const emailInput = page
  .locator('my-app')
  .locator(':scope')           // my-app shadow root
  .locator('my-layout')
  .locator(':scope')           // my-layout shadow root
  .locator('my-form-container')
  .locator(':scope')           // my-form-container shadow root
  .locator('my-form')
  .locator(':scope')           // my-form shadow root
  .locator('input[name="email"]');

// Result: Element found and filled successfully
// WHY IT WORKS: Recursive shadow traversal pierces all 3 shadow boundaries
```

**Source:** `tests/scenarios/nested-form.test.js:52-89`

### Verified: 4 Shadow Roots

```javascript
// ✅ Supported evidence: Shadow structure verification
const shadowRoots = await getAllShadowRoots(page);
const nestedFormRoots = shadowRoots.filter(sr =>
  ['my-app', 'my-layout', 'my-form-container', 'my-form'].includes(sr.tagName)
);

expect(nestedFormRoots.length).toBe(4);
expect(myAppRoot.depth).toBe(0);
expect(myLayoutRoot.depth).toBe(1);
expect(myFormContainerRoot.depth).toBe(2);
expect(myFormRoot.depth).toBe(3);
```

**Source:** `tests/scenarios/nested-form.test.js:215-245`

---

## Scenario 3: Async Component (Dynamic Shadow Attachment)

### Problem
Component loads asynchronously with 2000ms delay. Shadow DOM is attached after the delay.

### Traditional Approach — FAILS

```javascript
// ❌ Traditional: Only searches light DOM
await page.waitForSelector('.chart');

// Error: TimeoutError: page.waitForSelector: Timeout 30000ms exceeded
// REASON: The .chart element is created inside shadow DOM after 2000ms delay
// waitForSelector() only searches light DOM
// The element never appears in light DOM
```

**Source:** `tests/regression/traditional-selectors.test.js:86-107`

### Intent-Based Approach — SUCCEEDS

```javascript
// ✅ Intent-based: Wait for shadow DOM existence
await page.waitForFunction(() => {
  const component = document.querySelector('async-chart');
  return component?.shadowRoot?.querySelector('.chart');
});

// Result: Element found after async shadow attachment
// WHY IT WORKS: waitForFunction polls until shadowRoot exists AND contains .chart
// Handles: 2000ms async delay + shadow DOM attachment
```

**Source:** `tests/regression/intent-based-selectors.test.js:83-103`

---

## Key Differences Summary

| Aspect | Traditional | Intent-Based |
|--------|-------------|--------------|
| **Shadow Boundary** | Cannot cross | Explicit traversal with `.locator(':scope')` |
| **Slot Content** | Cannot access | Direct shadow root access |
| **Nested Depth** | Fails at depth 1 | ✅ Works at depth 3 (verified) |
| **Async Loading** | Times out | waitForFunction with shadow check |
| **Error Messages** | Generic "Element not found" | Specific "shadow depth X" context |

---

## Anti-Patterns to Avoid

From `docs/ANTI_PATTERNS.md`:

1. **Hardcoded Shadow Traversal** — Copy-paste traversal code for each test
2. **Missing Shadow Depth Info** — No indication of nesting level in errors
3. **No Slot Boundary Handling** — Treating slotted content as regular DOM
4. **Generic Error Messages** — "Element not found" without shadow context

---

## Recommended Patterns

### 1. Use Reusable Fixtures

```javascript
// ✅ Good: Generic shadow traversal fixture
const emailInput = await findByIntent(page, { role: 'textbox', name: 'email' });
```

**Source:** `tests/fixtures/shadow-traversal.js`

### 2. Wait for Shadow Readiness

```javascript
// ✅ Good: Wait for component shadow DOM
await waitForShadowReady(page, 'my-form');
```

**Source:** `tests/fixtures/async-wait.js`

### 3. Use Intent-Based Locators

```javascript
// ✅ Good: Role and name-based selection
const button = byRoleAndName('button', 'Submit');
```

**Source:** `tests/fixtures/intent-locators.js`

---

## Evidence Sources

| File | Evidence Type |
|------|---------------|
| `tests/scenarios/nested-form.test.js` | ✅ 3-level depth verification |
| `tests/regression/traditional-selectors.test.js` | 📊 Failure patterns |
| `tests/regression/intent-based-selectors.test.js` | 📊 Success patterns |
| `docs/ANTI_PATTERNS.md` | 📊 Domain guidance |
| `docs/ARTIFACT_SCHEMA.md:202-203` | ⚠️ Pass rate documentation |

---

*Last updated: 2026-04-17*
*Evidence audit: `.sisyphus/evidence/task-1-claim-audit.md`*
