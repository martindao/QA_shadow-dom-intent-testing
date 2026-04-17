# UI Spec — Shadow DOM Intent-Based Testing Harness

This repo must visually match the quality bar established by repo-01 after its UI upgrade, adapted for test resilience comparison.

## Goal

The dashboard should make the reviewer instantly see why intent-based automation is better than fragile selectors. The contrast between approaches must be obvious at a glance.

## Layout

Use the same 3-column operator layout:
- **Left rail:** test queue with approach toggle
- **Center pane:** test detail with selector comparison
- **Right rail:** live test controls + resilience metrics

## Required Panels

### Left Rail — Test Queue

Each test card must show:
- test name
- suite badge (slotted-dialog, nested-form, async-component)
- approach indicator (traditional vs intent-based)
- pass/fail status icon
- shadow depth (if applicable)
- last run timestamp

**Visual hierarchy:**
- Failed tests at top (red highlight)
- Tests grouped by scenario
- Toggle to show traditional only, intent-based only, or both

### Center Pane — Test Detail

Must include inline sections:
1. **Header** — test name, scenario, shadow depth
2. **Selector Comparison** — side-by-side code snippets
   - Traditional selector (with failure reason if failed)
   - Intent-based selector (with pass confirmation)
3. **Shadow DOM Visualization** — diagram showing nesting
4. **Error Analysis** — specific failure reason
5. **Recommended Fix** — how to convert to intent-based
6. **Raw Artifact Links** — links to JSON artifacts

### Right Rail — Context

Must include:
- **Resilience Score** — large prominent comparison (27% vs 93%)
- **Maintenance Savings** — qualitative (significant reduction)
- **Live Test buttons:**
  - Run Traditional Tests
  - Run Intent-Based Tests
  - Run All Tests
- **Control buttons:**
  - Generate Report
- **Reset Demo Data button**

## Selector Comparison View

This is the most important visual element. Must show:

```
Traditional (FAILED):
getByRole('dialog').getByRole('button')
Error: Timeout — button is in different shadow tree

Intent-Based (PASSED):
shadowRoot().locator('button[role="button"]')
Success: Shadow boundary traversed correctly
```

**Visual requirements:**
- Code snippets in monospace font
- Clear pass/fail indicators (green check, red X)
- Error messages visible for failures
- Shadow boundary explanation for slot/nested cases

## Shadow DOM Visualization

Must include a visual diagram showing:
- Component nesting hierarchy
- Shadow root boundaries (dashed lines)
- Slot boundaries (dotted lines)
- Where the selector failed (highlighted)

Example:
```
my-app
├─ [shadow root]
│  └─ my-layout
│     ├─ [shadow root]
│     │  └─ slotted-dialog ← TEST TARGET
│     │     ├─ [shadow root]
│     │     │  └─ <slot name="content"> ← BOUNDARY
│     │     │     └─ <button> ← ELEMENT
```

## Resilience Metrics Panel

Must show:
- Traditional pass rate (large number, red if <50%)
- Intent-based pass rate (large number, green if >80%)
- Improvement factor (e.g., "3.4x better")
- Top fragile selectors list
- Selector type breakdown table

## Live Test Requirements

Buttons required:
- Run Traditional Tests
- Run Intent-Based Tests
- Run All Tests
- Generate Report
- Reset Demo Data

Buttons must:
- be visible even when there are no test results
- trigger test execution without CLI use
- update the queue/detail panes automatically
- show loading state during execution

## Visual Style

Copy repo-01's final console style:
- dark operator console
- compact cards
- strong pass/fail emphasis
- dense but readable detail pane
- muted borders and professional spacing

**Test-specific colors:**
- Green: passed tests, high resilience
- Red: failed tests, fragile selectors
- Yellow: async-related issues
- Blue: shadow DOM boundaries

## Hard Rules

1. Do not ship a UI that requires opening raw JSON first to understand the selector contrast.

2. The dashboard must show **side-by-side comparison** of traditional vs intent-based. If it only shows one approach, it failed the repo goal.

3. The shadow DOM visualization must be visible in the detail pane, not hidden in a modal.

4. After running tests, the UI must auto-refresh to show results.

5. The resilience score must be visible at all times, not hidden in a sub-panel.

## Required Interactions

1. **Click test card** → center pane shows test detail with selector comparison
2. **Click "Run Traditional Tests"** → traditional suite executes, results shown
3. **Click "Run Intent-Based Tests"** → intent suite executes, results shown
4. **Click "Generate Report"** → report appears in reports list
5. **Click "Reset Demo Data"** → all results cleared

## Error States

- If test execution fails: show error toast, do not crash UI
- If no test results: show empty state with "Run tests to see comparison" message
- If demo app not running: show warning in health panel
