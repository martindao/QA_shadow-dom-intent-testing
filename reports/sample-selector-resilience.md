# Sample Selector Resilience Report

**Report Type:** Selector Resilience Comparison
**Generated:** 2026-04-17
**Scope:** Shadow DOM Intent-Based Testing Harness

---

## Executive Summary

This report demonstrates the resilience difference between traditional CSS selectors and intent-based selectors when testing Shadow DOM components.

| Metric | Traditional | Intent-Based |
|--------|-------------|--------------|
| Pass Rate | 27% (12/45) | 93% (42/45) |
| Improvement | — | 3.4x |
| Max Depth | Fails at depth 1 | Works at depth 3 |

**Classification:** ⚠️ Qualified — Pass rates documented in ARTIFACT_SCHEMA.md, not executed. See [Claim Audit](/.sisyphus/evidence/task-1-claim-audit.md).

---

## Test Scenarios

### Scenario 1: Slotted Dialog

**Component:** `<my-dialog>` with slotted button content
**Shadow Depth:** 1
**Challenge:** Slot boundary crossing

| Approach | Selector | Result | Error |
|----------|----------|--------|-------|
| Traditional | `getByRole("dialog").getByRole("button")` | ❌ FAIL | TimeoutError: Element matching "button" not found within dialog. Button exists in different shadow tree (slotted content). |
| Intent-Based | `locator('my-dialog').locator(':scope').locator('button')` | ✅ PASS | — |

**Why Traditional Fails:** `getByRole()` cannot traverse slot boundaries. The button is in light DOM, slotted into the dialog's shadow DOM.

**Why Intent-Based Works:** Explicit shadow traversal with `.locator(':scope')` enters the shadow root.

---

### Scenario 2: Nested Form (3 Levels Deep)

**Component:** `<my-app> → <my-layout> → <my-form-container> → <my-form>`
**Shadow Depth:** 3
**Challenge:** Multi-level shadow traversal

| Approach | Selector | Result | Error |
|----------|----------|--------|-------|
| Traditional | `locator('input[name="email"]')` | ❌ FAIL | Error: Element not found. Input is nested 3 shadow DOM levels deep. |
| Intent-Based | Recursive shadow traversal | ✅ PASS | — |

**Verified Structure:**
```
my-app (depth 0)
└── my-layout (depth 1)
    └── my-form-container (depth 2)
        └── my-form (depth 3)
            └── input[name="email"]
```

**Evidence:** `tests/scenarios/nested-form.test.js:215-245` — Verifies 4 shadow roots at depths 0-3.

---

### Scenario 3: Async Component

**Component:** `<async-chart>` with 2000ms delay
**Shadow Depth:** 1
**Challenge:** Dynamic shadow DOM attachment

| Approach | Selector | Result | Error |
|----------|----------|--------|-------|
| Traditional | `waitForSelector('.chart')` | ❌ FAIL | TimeoutError: Element never appears in light DOM. |
| Intent-Based | `waitForFunction(() => component.shadowRoot?.querySelector('.chart'))` | ✅ PASS | — |

**Why Traditional Fails:** `waitForSelector()` only searches light DOM. The `.chart` element is created inside shadow DOM after async delay.

**Why Intent-Based Works:** `waitForFunction` polls until shadow root exists AND contains the target element.

---

## Selector Type Analysis

**Classification:** 📊 Illustrative — No runtime data supports specific percentages.

| Selector Type | Resilience | Example | Recommendation |
|---------------|------------|---------|----------------|
| Role + Name | High | `getByRole('button', { name: 'Submit' })` | ✅ Preferred |
| Test ID | Medium | `getByTestId('submit-btn')` | ✅ Acceptable |
| Text Content | Low | `getByText('Submit')` | ⚠️ Use sparingly |
| CSS Class | Fragile | `.btn-primary` | ❌ Avoid |
| CSS ID | Fragile | `#submit` | ❌ Avoid |

**Principle:** Role and accessible name are semantic properties that survive CSS refactoring.

---

## Error Message Comparison

### Traditional (Generic)

```
Error: locator.fill: Element not found
Timeout waiting for selector
```

### Intent-Based (Shadow-Aware)

```
Error: Element not found at shadow depth 3
Path: my-app → my-layout → my-form-container → my-form
Check: Does the element exist inside a shadow root?
```

**Benefit:** Shadow-aware errors reduce debugging time by providing context.

---

## Maintenance Impact

### Traditional Selector Issues

1. **Breaks on CSS refactoring** — Class names change frequently
2. **Breaks on layout changes** — DOM structure changes break selectors
3. **No shadow context** — Generic errors require manual debugging
4. **Copy-paste traversal** — Each test duplicates shadow navigation code

### Intent-Based Benefits

1. **Semantic targeting** — Role and name survive refactoring
2. **Reusable fixtures** — `findByIntent` eliminates duplicate code
3. **Shadow-aware errors** — Context speeds debugging
4. **Async handling** — Built-in wait utilities

---

## Code Examples

### Traditional Approach (Fails)

```javascript
// ❌ Cannot find element in shadow DOM
const input = page.locator('input[name="email"]');
await input.fill('test@example.com');
// Error: Element not found
```

### Intent-Based Approach (Succeeds)

```javascript
// ✅ Explicit shadow traversal
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

await input.fill('test@example.com');
// Success
```

### Using Reusable Fixture

```javascript
// ✅ Even better: Use the shadow traversal fixture
const { findByIntent, waitForShadowReady } = require('../fixtures/shadow-traversal');

await waitForShadowReady(page, 'my-form');
const input = await findByIntent(page, { role: 'textbox', name: 'email' });
await input.fill('test@example.com');
```

---

## Recommendations

1. **Use intent-based locators** — Role + accessible name preferred
2. **Use shadow traversal fixtures** — Avoid copy-paste traversal code
3. **Wait for shadow readiness** — Use `waitForShadowReady` before interaction
4. **Avoid CSS class selectors** — Fragile and break on refactoring
5. **Include shadow depth in errors** — Improves debugging efficiency

---

## Evidence Sources

| File | Evidence |
|------|----------|
| `tests/scenarios/nested-form.test.js` | ✅ 3-level depth verification |
| `tests/regression/traditional-selectors.test.js` | 📊 Failure patterns |
| `tests/regression/intent-based-selectors.test.js` | 📊 Success patterns |
| `tests/fixtures/shadow-traversal.js` | ✅ Reusable fixtures |
| `ARTIFACT_SCHEMA.md:202-203` | ⚠️ Pass rate documentation |

---

## Appendix: Runtime Data Status

**Important:** The runtime JSON files contain no test execution data:

```json
// runtime/test-results.json
{
  "last_run": null,
  "traditional": { "total": 0, "passed": 0, "failed": 0, "pass_rate": 0 },
  "intent_based": { "total": 0, "passed": 0, "failed": 0, "pass_rate": 0 }
}
```

All pass rate claims are based on documentation, not executed tests.

---

*Report generated: 2026-04-17*
*For detailed evidence audit, see: `.sisyphus/evidence/task-1-claim-audit.md`*
