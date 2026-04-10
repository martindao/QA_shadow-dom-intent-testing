# Learnings - Shadow DOM Intent-Based Testing Harness

## 2026-04-10: Runtime Store Implementation

### Pattern: File-backed JSON Store
- Reference implementation: `SUP_incident-intelligence-fastpath/runtime/store.js`
- Uses `readJSON()` and `writeJSON()` helpers for all persistence
- `ensureRuntimeFiles()` called on module load to create defaults
- `resetRuntime()` clears all state to defaults

### Key Functions Implemented
- `getTestResults()` / `setTestResults(approach, results)` - test run results
- `getResilienceMetrics()` / `updateResilienceMetrics(data)` - selector resilience
- `getSelectorHistory()` / `appendSelectorHistory(entry)` - historical outcomes
- `getShadowStructure()` - shadow DOM structure (read-only for now)
- `getReportsIndex()` / `addReport(report)` - report metadata
- `resetRuntime()` - clears all state

### Runtime Files Created
- `test-results.json` - test run results
- `resilience-metrics.json` - selector comparison metrics
- `selector-history.json` - historical pass/fail outcomes
- `shadow-structure.json` - demo app shadow DOM structure
- `reports-index.json` - report metadata index

## 2026-04-10: Test Fixtures Implementation

### Pattern: Generic Shadow DOM Traversal
- Use `page.evaluateHandle()` to recursively search shadow roots in browser context
- Check light DOM first before traversing shadow roots for performance
- Return Playwright Locator for found elements to maintain chainability

### Pattern: Intent Locators as Selector Strings
- Intent locators return CSS selector strings, NOT Playwright locators
- This allows them to be used with any traversal method
- Format: `[role="${role}"][aria-label="${name}"]` for role/name matching

### Pattern: Async Wait for Shadow Components
- Must check THREE conditions: element exists, shadowRoot exists, children.length > 0
- Use `page.waitForFunction()` with predicate for browser-side evaluation
- Added `waitForComponentsReady` for batch component waiting

### Key Insight: CommonJS Exports
- All fixtures use `module.exports` for CommonJS compatibility
- Named exports via object literal: `module.exports = { fn1, fn2 }`
- Verification: `node -e "require('./path')"` confirms proper export

### Reusability Achieved
- No hardcoded component paths
- All functions accept parameters (selectors, tag names, intents)
- Works with any Shadow DOM component, not tied to demo app

## 2026-04-10: Demo App Shadow DOM Components

### Implementation Approach
- Created 6 Web Components using vanilla JavaScript (no frameworks)
- All components use `attachShadow({ mode: 'open' })` for testability
- Followed exact specifications from INSTRUCTIONS.md

### Component Structure

#### 1. Slotted Dialog (`slotted-dialog/dialog.js`)
- Uses `<slot name="title">` and `<slot name="content">` for content projection
- Internal confirm button in shadow DOM
- Proper ARIA attributes: `role="dialog"` and `aria-modal="true"`

#### 2. Nested Form (`nested-form/form.js`)
- 4 components: `my-app` → `my-layout` → `my-form-container` → `my-form`
- Each level creates its own shadow root
- Input field at depth 3: `input[name="email"]`
- Demonstrates 3 levels of shadow DOM nesting

#### 3. Async Component (`async-component/component.js`)
- Delays `attachShadow` by exactly 2000ms using `setTimeout`
- Renders chart div with `role="img"` and `aria-label="Sales Chart"`
- Shadow DOM not attached in constructor, only in `connectedCallback`

#### 4. Design System Components
- `button.js`: Reusable button with primary/secondary variants
- `input.js`: Reusable input with label slot
- `modal.js`: Reusable modal with overlay and proper ARIA

### Key Patterns
- All shadow roots use `mode: 'open'` (never closed)
- No framework dependencies (vanilla Web Components)
- Proper `customElements.define()` registration
- Scoped styles within each shadow root

### Verification Results
- ✅ All 9 shadow roots use `attachShadow({ mode: 'open' })`
- ✅ LSP diagnostics: 0 errors across all 6 files
- ✅ Components match INSTRUCTIONS.md specifications exactly

## 2026-04-10: Regression Tests Implementation

### Pattern: Documentation/Simulation Tests
- Tests run WITHOUT browser (no Playwright execution)
- Document expected failures/passes with detailed error messages
- Use `store.appendSelectorHistory()` to record results
- Each test produces a result object with: test_name, approach, selector, result, error_message, shadow_depth

### Test Structure
- `traditional-selectors.test.js`: 3 tests that FAIL (document why traditional breaks)
- `intent-based-selectors.test.js`: 3 tests that PASS (document why intent-based works)

### Three Scenarios Covered
1. **Slotted Dialog** (shadow_depth: 1)
   - Traditional: `getByRole("dialog").getByRole("button")` - FAILS (slot boundary)
   - Intent-based: `locator('my-dialog').shadowRoot().locator('button')` - PASSES

2. **Nested Form** (shadow_depth: 3)
   - Traditional: `locator('input[name="email"]')` - FAILS (3 shadow levels)
   - Intent-based: `findInShadow(page, 'input[name="email"]')` - PASSES

3. **Async Component** (shadow_depth: 1)
   - Traditional: `waitForSelector('.chart')` - FAILS (async shadow attachment)
   - Intent-based: `waitForFunction(() => component.shadowRoot?.querySelector('.chart'))` - PASSES

### Verification Results
- ✅ Both test files run successfully via `node tests/regression/*.test.js`
- ✅ Traditional tests: 3 failures documented with detailed error messages
- ✅ Intent-based tests: 3 passes documented with "WHY IT WORKS" explanations
- ✅ All 6 results recorded in `runtime/selector-history.json`

## 2026-04-10: Support Console Server Implementation

### Pattern: Node.js http Module (No Express)
- Reference implementation: `SUP_incident-intelligence-fastpath/support-console/server.js`
- Uses native `http.createServer()` for minimal dependencies
- All routes handled via if/else chain on `req.url` and `req.method`

### Pattern: serveFile Helper with No-Cache Headers
- Required headers: `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`
- Used for HTML and markdown responses
- Returns 404 JSON error for missing files

### Pattern: Simulation Endpoints
- Do NOT actually run Playwright tests
- Generate realistic test results with failure details
- Call `store.setTestResults()` to persist results
- Call `store.appendSelectorHistory()` for each selector used
- Return `{ success: true, action: <name>, results_ref: <path>, summary: {...} }`

### Endpoints Implemented
- `GET /` → serve `support-console/ui/index.html`
- `GET /api/test-results` → return test results from store
- `GET /api/resilience-metrics` → return metrics (computed from test results)
- `GET /api/shadow-depth` → return shadow structure from store
- `GET /api/reports` → return reports index
- `GET /api/reports/:id` → return specific report markdown
- `GET /api/health` → return component health
- `POST /api/run-traditional` → simulate traditional test run
- `POST /api/run-intent` → simulate intent-based test run
- `POST /api/generate-report` → trigger report generation
- `POST /api/reset` → clear all runtime state

### Key Implementation Details
- Port: 3003 (configurable via `CONSOLE_PORT` env var)
- CORS header: `Access-Control-Allow-Origin: *` on all responses
- Reports stored in `reports/` directory as markdown files
- Report metadata tracked in `runtime/reports-index.json`

### Verification Results
- ✅ All 11 endpoints return expected responses
- ✅ No-cache headers present on HTML/markdown responses
- ✅ Selector history entries generated with realistic data
- ✅ Test results persisted across server restarts
- ✅ Reset endpoint clears all runtime state
