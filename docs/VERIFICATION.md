# Verification — Shadow DOM Intent-Based Testing Harness

This file is the final gate before pushing the repo publicly.

## 1. Install and Start

```bash
npm install
npm run reset
npm run start:all
```

This should start:
- Demo app on port 3000
- Support console on port 3001

## 2. Unit Tests

```bash
npm test
```

Target: 10+ unit tests passing.

Tests should cover:
- Shadow traversal fixtures
- Intent locator builders
- Async wait utilities
- Selector comparison logic

## 3. Integration Tests

```bash
npm run test:integration
```

Target: 10+ integration tests passing.

Tests should cover:
- Full test execution flow
- Shadow DOM traversal in real components
- Async component waiting
- Report generation

## 4. Manual UI Verification

Open `http://localhost:3001`

### Scenario A — Slotted Dialog

1. Click `Run Traditional Tests`
2. Confirm slotted-dialog.test.js appears as FAILED
3. Click on the failed test
4. Confirm center pane shows:
   - Traditional selector code
   - Error message about slot boundary
   - Shadow DOM visualization
5. Click `Run Intent-Based Tests`
6. Confirm slotted-dialog.test.js appears as PASSED
7. Click on the passed test
8. Confirm center pane shows:
   - Intent-based selector code
   - Success message
   - Shadow traversal confirmation

### Scenario B — Nested Form (3 Levels Deep)

1. Click `Reset Demo Data`
2. Click `Run Traditional Tests`
3. Confirm nested-form.test.js fails
4. Click on the test
5. Confirm shadow depth shows "3"
6. Confirm error indicates element not found
7. Click `Run Intent-Based Tests`
8. Confirm nested-form.test.js passes
9. Confirm shadow traversal shows "depth: 3"

### Scenario C — Async Component

1. Click `Reset Demo Data`
2. Click `Run Traditional Tests`
3. Confirm async-component.test.js fails with timeout
4. Click `Run Intent-Based Tests`
5. Confirm async-component.test.js passes
6. Confirm wait time is shown (should be ~2000ms)

### Scenario D — Full Comparison

1. Click `Reset Demo Data`
2. Click `Run All Tests`
3. Confirm both suites execute
4. Confirm resilience metrics show:
   - Traditional: ~27% pass rate
   - Intent-based: ~93% pass rate
5. Click `Generate Report`
6. Confirm report appears in reports list
7. Click report link
8. Confirm markdown report renders correctly

## 5. Critical Bug Check

**Reset → Run Tests flow**

This is a mandatory check:
1. Click `Reset Demo Data`
2. Confirm test results are cleared
3. Confirm resilience metrics show empty state
4. Click `Run Traditional Tests`
5. Confirm NEW test results appear
6. Click `Run Intent-Based Tests`
7. Confirm NEW comparison is shown

If this fails, the repo is not ready.

## 6. Shadow DOM Visualization Check

1. Run tests for each scenario
2. Click on each failed test
3. Confirm shadow DOM diagram is visible
4. Confirm nesting levels are correct
5. Confirm slot boundaries are shown (for slotted-dialog)

## 7. Selector Comparison Check

For each failed traditional test:
1. Confirm traditional selector code is shown
2. Confirm error message is specific (not generic)
3. Confirm intent-based alternative is shown
4. Confirm intent-based test passes

## 8. Browser Console

Open devtools and confirm:
- no uncaught JS errors
- no duplicate declaration errors
- no 404s for artifacts or reports
- API calls return expected JSON structure

## 9. Demo App Verification

The demo app must have:
- Slotted dialog component with slot boundaries
- Nested form with 3+ levels of shadow DOM
- Async component with delayed rendering

Visit `http://localhost:3000/src/` and verify:
- All components render correctly
- Shadow DOM structure matches expected depth
- Async component loads after delay

## 10. README Review

Read README from top to bottom as if you are a hiring manager.

Ask:
- Can I understand what this repo solves in 60 seconds?
- Is the Shadow DOM challenge explained clearly?
- Do the commands actually work?
- Is the selector contrast obvious?

If any answer is no, fix it first.

## 11. Report Quality Check

Open generated report and verify:
- Summary with pass rates for both approaches
- Top fragile selectors listed with specific reasons
- Shadow DOM challenges section
- Recommended patterns section
- Selector type analysis table

If report is empty or generic, the report generator needs fixes.

## 12. Fixture Reusability Check

Verify that fixtures can be used independently:
```bash
node -e "const { findByIntent } = require('./tests/fixtures/shadow-traversal.js'); console.log(typeof findByIntent);"
```

Should output: `function`

This proves fixtures are reusable, not hardcoded to the demo app.
