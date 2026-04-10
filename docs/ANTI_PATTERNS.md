# Anti-Patterns — Shadow DOM Intent-Based Testing Harness

Do NOT let an AI drift into these mistakes.

## 1. Framework Demo Only

Bad:
- just a few Playwright snippets with no coherent demo app
- isolated test examples without context
- no reusable fixtures

Good:
- realistic component surface (dialog, form, async)
- reusable shadow traversal fixtures
- intent locator builder library
- reporting dashboard

## 2. No Contrast

Bad:
- only intent-based examples
- no traditional selector failures shown
- no side-by-side comparison

Good:
- show traditional selectors failing
- show intent-based selectors succeeding
- side-by-side code comparison in UI
- specific error messages for traditional failures

## 3. No Enterprise Relevance

Bad:
- toy components with no real UI complexity
- single-level shadow DOM only
- no slot boundaries

Good:
- slotted dialog (Playwright Issue #38166)
- nested form (3+ levels deep)
- async component loading
- realistic enterprise patterns

## 4. No Operator Dashboard

Bad:
- raw test output only
- CLI-only interaction
- no visual comparison

Good:
- resilience dashboard with metrics
- side-by-side test results
- shadow DOM visualization
- clickable test details

## 5. Hardcoded Shadow Traversal

Bad:
- specific path for each test
- no reusable fixture
- copy-paste traversal code

Good:
- generic shadow traversal fixture
- intent locator builder
- works for any depth
- reusable across projects

## 6. Missing Shadow Depth Info

Bad:
- no indication of nesting level
- no visualization of shadow boundaries
- generic "element not found" errors

Good:
- shadow depth shown in test results
- visual diagram of component nesting
- specific error about shadow boundary

## 7. No Async Handling

Bad:
- assumes all components render instantly
- no wait utilities
- flaky async tests

Good:
- async wait fixtures
- proper waitForShadowReady implementation
- handles lazy-loaded components

## 8. Generic Error Messages

Bad:
- "Element not found"
- "Timeout waiting for selector"
- no context about why

Good:
- "Element not found at shadow depth 3"
- "Slot boundary crossed without traversal"
- "Async component not ready after 2000ms"

## 9. No Slot Boundary Handling

Bad:
- ignores slot elements
- treats slotted content as regular DOM
- no special handling for `<slot>`

Good:
- explicit slot boundary detection
- different traversal for slotted content
- references Playwright Issue #38166

## 10. Over-Engineering

Bad:
- full E2E framework implementation
- custom test runner
- complex abstraction layers

Good:
- lightweight fixtures
- Playwright-native approach
- simple, composable utilities

## 11. Missing Selector Type Analysis

Bad:
- no breakdown by selector type
- no recommendations
- no fragile selector identification

Good:
- CSS class vs role vs testid analysis
- pass rates per selector type
- recommended alternatives for fragile selectors

## 12. Generic README

Bad:
- tutorial tone
- vague claims about "better selectors"
- no Shadow DOM specifics

Good:
- QA-first automation framing
- concrete scenarios (slotted, nested, async)
- clear explanation of shadow boundaries
- Playwright Issue #38166 reference
