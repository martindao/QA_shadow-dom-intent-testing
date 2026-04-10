# Repo 05 — Shadow DOM Intent-Based Testing Harness

## Quick Start For AI Agents

**If you are an AI reading this:** Your job is to build this repo following the exact pattern of `SUP_incident-intelligence-fastpath`, which already exists at `C:\Users\marti\Desktop\Projects\SUP_incident-intelligence-fastpath`.

**Reference repo to clone patterns from:** `SUP_incident-intelligence-fastpath`

**This repo is QA Automation focused** — it demonstrates how to automate modern, componentized UIs that break traditional selectors.

---

## Repo Identity

- **Folder name:** `shadow-dom-intent-testing`
- **GitHub repo name:** `shadow-dom-intent-testing`
- **Public title:** Shadow DOM Intent-Based Testing Harness
- **Tagline:** "When CSS selectors break on every refactor, this is what keeps your tests alive."
- **Target hiring role:** QA Automation / SDET / Frontend QA Engineer at Series A/B SaaS
- **Hiring-manager pitch:** "I take brittle, selector-heavy test suites and replace them with intent-based automation that survives UI refactors. Your tests stop breaking when designers change class names."

---

## What This Repo Proves

Martin Dao can:
- Automate through nested Shadow DOM boundaries (up to 5 levels deep)
- Replace fragile CSS/XPath selectors with semantic intent locators
- Build reusable fixture patterns for complex component trees
- Handle non-deterministic UI rendering and async component loading
- Generate test reports that prove automation coverage actually works
- Reduce selector maintenance time by 80%+

---

## Source Research (Real 2025-2026 Evidence)

### Primary Sources

#### 1. Microsoft Playwright Issue #38166 (2025)
- **URL:** https://github.com/microsoft/playwright/issues/38166
- **Key lesson:** Role-based locator chaining fails across Shadow DOM `<slot>` boundaries. `getByRole("dialog").getByRole("button")` times out when button is slotted into Shadow DOM dialog.
- **Use this for:** Scenario 1 (Slotted Dialog Automation)

#### 2. Playwright Official Docs: Shadow DOM Best Practices
- **URL:** https://playwright.dev/docs/shadow-dom
- **Key lesson:** Shadow DOM encapsulation breaks standard DOM queries. Need explicit `shadowRoot` traversal or intent-based locators.
- **Use this for:** Technical implementation patterns

#### 3. Cypress Official Docs: Shadow DOM Support
- **URL:** https://docs.cypress.io/api/commands/shadow
- **Key lesson:** Cypress requires `.shadow()` command to pierce boundaries. Traditional `cy.get()` fails silently.
- **Use this for:** Alternative framework comparison

#### 4. Virtuoso QA: "Why Shadow DOM Encapsulation Breaks 73% of Automation Projects" (2026)
- **URL:** https://www.virtuosoqa.com/blog/shadow-dom-automation-challenges
- **Key lesson:** Enterprise apps using Web Components (Salesforce Lightning, ServiceNow) fail automation because locators can't reach shadow elements.
- **Use this for:** Business impact framing

### Secondary Sources
- Web Components Standard (MDN) — for technical correctness
- Salesforce Lightning Web Components (LWC) documentation — real-world enterprise example

### What to Extract From Each Source
- **Failure mode:** What specifically breaks (slot boundaries, encapsulation, async rendering)
- **Detection gap:** Why traditional selectors fail
- **Recovery pattern:** How intent-based locators solve it
- **Enterprise relevance:** Why this matters for real SaaS products

---

## Architecture (Hybrid: Demo App + Test Harness)

This repo needs:
1. **A demo app** with realistic Shadow DOM components (the system-under-test)
2. **A test harness** that demonstrates intent-based automation patterns
3. **A reporting dashboard** that shows selector resilience metrics
4. **Reusable fixture library** for shadow DOM traversal

```
shadow-dom-intent-testing/
├── app-under-test/                     # The demo app with Shadow DOM
│   ├── src/
│   │   ├── components/
│   │   │   ├── slotted-dialog/         # Dialog with slotted content
│   │   │   │   ├── dialog.html
│   │   │   │   └── dialog.js
│   │   │   ├── nested-form/            # Form inside 3 levels of shadow
│   │   │   │   ├── form.html
│   │   │   │   └── form.js
│   │   │   ├── async-component/        # Component that loads async
│   │   │   │   ├── component.html
│   │   │   │   └── component.js
│   │   │   └── design-system/          # Reusable UI library
│   │   │       ├── button.js
│   │   │       ├── input.js
│   │   │       └── modal.js
│   │   └── index.html                  # Main page
│   ├── package.json
│   └── README.md
├── tests/
│   ├── fixtures/                       # Reusable shadow DOM fixtures
│   │   ├── shadow-traversal.js         # Core traversal utilities
│   │   ├── intent-locators.js          # Semantic locator builders
│   │   └── async-wait.js               # Async component waiting
│   ├── scenarios/
│   │   ├── slotted-dialog.test.js      # Scenario 1
│   │   ├── nested-form.test.js         # Scenario 2
│   │   └── async-component.test.js     # Scenario 3
│   └── regression/
│       ├── traditional-selectors.test.js  # Shows what breaks
│       └── intent-based-selectors.test.js # Shows what works
├── flake-control-plane/                # (Optional) Test resilience metrics
│   ├── classifier.js
│   ├── report-generator.js
│   └── runtime/
│       ├── selector-history.json
│       └── resilience-metrics.json
├── support-console/
│   ├── server.js
│   └── ui/index.html                   # Operator dashboard
├── reports/
│   └── sample-selector-resilience.md
├── docs/
│   ├── research-blueprint.md
│   ├── shadow-dom-patterns.md
│   ├── intent-locator-patterns.md
│   └── enterprise-relevance.md
├── package.json
├── README.md
└── .gitignore
```

---

## Required Dependencies (package.json)

```json
{
  "name": "shadow-dom-intent-testing",
  "version": "1.0.0",
  "description": "Intent-based automation for Shadow DOM and modern componentized UIs",
  "scripts": {
    "start:app": "npx serve app-under-test -p 3001",
    "test:traditional": "vitest run tests/regression/traditional-selectors.test.js",
    "test:intent": "vitest run tests/regression/intent-based-selectors.test.js",
    "test:scenarios": "vitest run tests/scenarios",
    "test:all": "vitest run tests",
    "console": "node support-console/server.js",
    "start:all": "concurrently -n app,console -c blue,green \"npm run start:app\" \"npm run console\""
  },
  "dependencies": {
    "concurrently": "^8.2.2",
    "chalk": "^4.1.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "vitest": "^1.2.0",
    "serve": "^14.2.0"
  }
}
```

**Why these dependencies:**
- `@playwright/test` — primary automation framework (best Shadow DOM support)
- `serve` — lightweight static server for demo app
- `vitest` — test runner for unit tests
- `concurrently` — multi-process orchestration

---

## Deterministic Scenarios (3 Required)

### Scenario 1: Slotted Dialog Automation
**Problem:** A dialog component uses `<slot>` to inject content. Traditional `getByRole("dialog").getByRole("button")` fails because the button is in a different shadow tree.

**Demo app structure:**
```html
<!-- app-under-test/src/components/slotted-dialog/dialog.html -->
<template id="dialog-template">
  <style>
    :host { display: block; }
    .dialog { border: 1px solid #ccc; padding: 1rem; }
  </style>
  <div class="dialog" role="dialog" aria-modal="true">
    <h2><slot name="title">Default Title</slot></h2>
    <div class="content"><slot name="content"></slot></div>
    <button id="confirm-btn" role="button">Confirm</button>
  </div>
</template>
```

**Test that breaks (traditional):**
```javascript
// This FAILS because button is in shadow DOM
await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
```

**Test that works (intent-based):**
```javascript
// This WORKS using shadow traversal fixture
const dialog = await page.locator('my-dialog').shadowRoot();
await dialog.locator('button[role="button"]').click();
```

**Expected outcome:**
- Traditional test fails with timeout
- Intent-based test passes reliably
- Report shows selector resilience improvement

---

### Scenario 2: Nested Form (3 Levels Deep)
**Problem:** A form is nested inside 3 levels of Shadow DOM (app → layout → form-container → form). Traditional selectors can't reach input fields.

**Demo app structure:**
```
my-app
  └─ shadowRoot
      └─ my-layout
          └─ shadowRoot
              └─ my-form-container
                  └─ shadowRoot
                      └─ my-form
                          └─ input[name="email"]
```

**Test that breaks (traditional):**
```javascript
await page.locator('input[name="email"]').fill('test@example.com');
// FAILS: Element not found
```

**Test that works (intent-based):**
```javascript
// Recursive shadow traversal
async function findInShadow(page, selector) {
  const elements = await page.$$(selector);
  for (const el of elements) {
    const shadow = await el.evaluateHandle(el => el.shadowRoot);
    if (shadow) {
      const nested = await findInShadow(shadow.asElement(), selector);
      if (nested) return nested;
    }
    if (await el.isVisible()) return el;
  }
  return null;
}

const emailInput = await findInShadow(page, 'input[name="email"]');
await emailInput.fill('test@example.com');
```

**Expected outcome:**
- Traditional test fails
- Intent-based test passes
- Fixture is reusable across all nested components

---

### Scenario 3: Async Component Loading
**Problem:** A component loads asynchronously (e.g., lazy-loaded chart). Traditional `waitForSelector` fails because the element doesn't exist yet.

**Demo app structure:**
```javascript
// app-under-test/src/components/async-component/component.js
class AsyncChart extends HTMLElement {
  connectedCallback() {
    // Simulate async loading
    setTimeout(() => {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <div class="chart" role="img" aria-label="Sales Chart">
          <svg>...</svg>
        </div>
      `;
    }, 2000);
  }
}
```

**Test that breaks (traditional):**
```javascript
await page.waitForSelector('.chart');
// FAILS: Timeout after 30s (element never appears in light DOM)
```

**Test that works (intent-based):**
```javascript
// Wait for shadow DOM to be attached AND rendered
await page.waitForFunction(() => {
  const component = document.querySelector('async-chart');
  return component && component.shadowRoot && component.shadowRoot.querySelector('.chart');
});

const chart = await page.locator('async-chart').shadowRoot().locator('.chart');
await expect(chart).toBeVisible();
```

**Expected outcome:**
- Traditional test fails
- Intent-based test passes with proper async waiting
- Fixture handles both sync and async shadow DOM

---

## Required Features

### 1. Shadow Traversal Fixtures (`tests/fixtures/shadow-traversal.js`)

Core utilities for piercing Shadow DOM:
```javascript
// Recursive shadow root traversal
export async function findByIntent(page, intent) {
  // intent = { role: 'button', name: 'Confirm' }
  // Traverse all shadow roots until element found
}

// Wait for shadow DOM to be ready
export async function waitForShadowReady(page, selector) {
  // Wait for element + shadowRoot + content
}

// Get all shadow roots in page
export async function getAllShadowRoots(page) {
  // Return array of all shadow roots for debugging
}
```

### 2. Intent Locator Builder (`tests/fixtures/intent-locators.js`)

Semantic locator patterns:
```javascript
// Build locator by role + accessible name
export function byRoleAndName(role, name) {
  return `[role="${role}"][aria-label="${name}"]`;
}

// Build locator by data-testid (fallback)
export function byTestId(id) {
  return `[data-testid="${id}"]`;
}

// Build locator by text content (last resort)
export function byText(text) {
  return `:text("${text}")`;
}
```

### 3. Async Wait Utilities (`tests/fixtures/async-wait.js`)

Handle async component loading:
```javascript
export async function waitForComponentReady(page, tagName) {
  await page.waitForFunction(`
    const el = document.querySelector('${tagName}');
    return el && el.shadowRoot && el.shadowRoot.children.length > 0;
  `);
}
```

### 4. Operator Console UI (Dashboard)

The UI is a **test resilience dashboard**, not an incident console.

Required panels:
- **Summary Stats** (top): Total tests, pass rate, selector resilience score
- **Selector Comparison** (middle): Side-by-side of traditional vs intent-based
- **Shadow DOM Depth Map** (visual): Shows nesting levels of components
- **Live Simulation Buttons** (right panel):
  - "Run Traditional Tests" (shows failures)
  - "Run Intent-Based Tests" (shows passes)
  - "Generate Resilience Report"
  - "Reset Demo Data"

**CRITICAL UI WARNING:** Same as repo-01 / SUP_incident-intelligence-fastpath. Write `index.html` in ONE pass.

#### Visual Design
- Same dark operator theme
- Use color: green for passing tests, red for failing, yellow for flaky
- Show code snippets side-by-side (traditional vs intent-based)
- Include visual diagram of Shadow DOM structure

### 5. Server Endpoints

```
GET  /
GET  /api/test-results
GET  /api/resilience-metrics
GET  /api/reports
POST /api/run-traditional
POST /api/run-intent
POST /api/generate-report
POST /api/reset
```

### 6. Sample Reports

Commit a sample report to `reports/sample-selector-resilience.md`:
```markdown
# Selector Resilience Report — 2026-04-01

## Summary
- 45 tests total
- Traditional selectors: 12/45 passing (27%)
- Intent-based selectors: 43/45 passing (96%)
- Selector maintenance time reduced by 80%

## Top 5 Most Fragile Selectors
1. `.btn-primary` — breaks on every design system update
2. `#submit-form` — breaks when form ID changes
3. `div > div > button` — breaks on layout changes
...

## Recommended Patterns
1. Use `getByRole()` for interactive elements
2. Use `data-testid` for complex components
3. Avoid CSS class selectors in tests
```

---

## Acceptance Criteria

### Functional
- [ ] All 3 scenarios demonstrate traditional vs intent-based contrast
- [ ] Shadow traversal fixtures work for 1-5 levels of nesting
- [ ] Async component waiting handles both sync and async shadow DOM
- [ ] Operator dashboard shows side-by-side test results
- [ ] Reset → Simulate flow works
- [ ] Sample report committed to `reports/`

### Quality
- [ ] 20+ tests in demo suite (traditional + intent-based)
- [ ] Playwright configured correctly with shadow DOM support
- [ ] Fixtures are reusable and well-documented
- [ ] No JavaScript console errors

### Portfolio
- [ ] README explains Shadow DOM automation challenges
- [ ] At least 2 screenshots of dashboard
- [ ] Architecture diagram showing Shadow DOM structure
- [ ] Sample report committed
- [ ] Built With section lists Playwright, Vitest

---

## Critical Warnings From repo-01 / SUP_incident-intelligence-fastpath Experience

### 1. UI must have simulation buttons
Don't just build a passive dashboard. Make it interactive.

### 2. Don't edit large inline scripts with partial edits
Rewrite `index.html` in one pass.

### 3. Cache-busting headers
Same `serveFile` pattern as repo-01 / SUP_incident-intelligence-fastpath.

### 4. Test the Reset → Simulate flow
Verify that after reset, simulations regenerate state correctly.

### 5. Shadow DOM is tricky to debug
Include a "Debug Mode" in the UI that shows all shadow roots and their contents. This proves you understand the complexity.

### 6. Playwright is the best tool for this
Don't use Cypress or Selenium for Shadow DOM. Playwright has native support. Use it.

---

## Build Order

1. **Day 1: Demo App**
   - Folder structure
   - Build Shadow DOM components (dialog, form, async)
   - Test components render correctly

2. **Day 2: Fixtures**
   - Build shadow traversal utilities
   - Build intent locator builder
   - Build async wait utilities
   - Test fixtures in isolation

3. **Day 3: Tests**
   - Write traditional selector tests (that fail)
   - Write intent-based tests (that pass)
   - Write scenario tests
   - Verify contrast between approaches

4. **Day 4: Reports**
   - Build report generator
   - Generate sample resilience report
   - Commit to `reports/`

5. **Day 5: Operator Console**
   - Backend with all endpoints
   - Frontend dashboard in ONE pass
   - Side-by-side test comparison

6. **Day 6: Polish**
   - Add debug mode for shadow DOM
   - Add visual diagram of nesting
   - Final verification

7. **Day 7: README + Docs**
   - Public README with screenshots
   - Documentation of patterns
   - Final verification

---

## Public README Structure

```markdown
# Shadow DOM Intent-Based Testing Harness

> When CSS selectors break on every refactor, this is what keeps your tests alive.

## Overview
Modern UIs use Shadow DOM for encapsulation. Traditional CSS selectors fail because they can't pierce shadow boundaries. This repo demonstrates intent-based automation that survives UI refactors.

## The Startup Pain This Solves
- Tests breaking when designers change class names
- 73% of automation projects fail on Shadow DOM apps
- Hours wasted maintaining fragile selectors
- False negatives hiding real regressions

## What This Repo Demonstrates
- Shadow DOM traversal up to 5 levels deep
- Intent-based locators (role, accessible name, data-testid)
- Async component waiting patterns
- Reusable fixture library
- Selector resilience metrics

## Architecture
[Diagram showing app-under-test → shadow DOM components → test fixtures → reports]

## Demo Scenarios
1. Slotted Dialog (Playwright Issue #38166)
2. Nested Form (3 levels deep)
3. Async Component Loading

## Built With
- Playwright (best Shadow DOM support)
- Vitest (test runner)
- Vanilla JS fixtures (no framework dependencies)

## How to Run Locally
[Instructions]

## Live Dashboard
[Screenshot]

## Sample Report
[Link to reports/sample-selector-resilience.md]
```

---

## Post-Build Deliverable (Screenshot Capture)

After this repo passes the acceptance criteria, do **not** create a landing page yet.
Landing pages are built in a separate phase after the app is verified real.

Before declaring the repo done, save these screenshots to `docs/SCREENSHOTS/`:

1. `01-main-view.png` — default dashboard / empty state
2. `02-active-simulation.png` — after a simulation runs, with the main comparison/detail view populated
3. `03-side-panel-state.png` — the panel showing the most important operational context (shadow depth, resilience stats, control panel, or equivalent)

These screenshots are the raw material for the later landing-page phase.

## Success Criteria

A QA hiring manager should:
1. Open the repo
2. See real Shadow DOM components (not toy examples)
3. See traditional tests failing and intent-based tests passing
4. Run the dashboard and click buttons to see contrast
5. Read the resilience report and find it credible
6. Decide to interview within 5 minutes

If the repo just looks like "a few Playwright tests", it failed. It must look like an AUTOMATION FRAMEWORK.
