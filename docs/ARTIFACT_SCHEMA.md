# Artifact Schema — Shadow DOM Intent-Based Testing Harness

Every test run must generate or update these runtime artifacts. These files are the source of truth for the dashboard and reports.

## 1. selector-history.json

Historical selector pass/fail outcomes across multiple runs.

```json
[
  {
    "test": "slotted-dialog.test.js",
    "approach": "traditional",
    "selector": "getByRole('dialog').getByRole('button')",
    "result": "failed",
    "error": "Timeout waiting for selector",
    "shadow_boundary_crossed": "slot",
    "timestamp": "2026-04-06T08:00:00.000Z",
    "run_id": "run_001"
  },
  {
    "test": "slotted-dialog.test.js",
    "approach": "intent-based",
    "selector": "shadowRoot().locator('button[role=\"button\"]')",
    "result": "passed",
    "shadow_traversal": true,
    "timestamp": "2026-04-06T08:00:05.000Z",
    "run_id": "run_001"
  },
  {
    "test": "nested-form.test.js",
    "approach": "traditional",
    "selector": "input[name=\"email\"]",
    "result": "failed",
    "error": "Element not found",
    "shadow_depth": 3,
    "timestamp": "2026-04-06T08:00:10.000Z",
    "run_id": "run_001"
  },
  {
    "test": "nested-form.test.js",
    "approach": "intent-based",
    "selector": "findByIntent({ role: 'textbox', name: 'email' })",
    "result": "passed",
    "shadow_traversal": true,
    "shadow_depth_traversed": 3,
    "timestamp": "2026-04-06T08:00:15.000Z",
    "run_id": "run_001"
  }
]
```

**Required fields:**
- `test` — test file name
- `approach` — "traditional" or "intent-based"
- `selector` — the selector that was used
- `result` — passed or failed
- `timestamp` — ISO 8601 timestamp
- `run_id` — unique identifier for the test run batch

**Optional fields (when applicable):**
- `shadow_boundary_crossed` — "slot", "nested", or null
- `shadow_depth` — nesting level where failure occurred
- `shadow_traversal` — boolean, true if shadow DOM was traversed

## 2. resilience-metrics.json

Selector resilience comparison with detailed breakdown.

```json
{
  "generated_at": "2026-04-06T08:30:00.000Z",
  "traditional": {
    "total_tests": 15,
    "passed": 4,
    "failed": 11,
    "pass_rate": 0.27,
    "avg_duration_ms": 2340,
    "failure_breakdown": {
      "shadow_boundary": 6,
      "async_rendering": 3,
      "selector_fragility": 2
    }
  },
  "intent_based": {
    "total_tests": 15,
    "passed": 14,
    "failed": 1,
    "pass_rate": 0.93,
    "avg_duration_ms": 1890,
    "failure_breakdown": {
      "shadow_boundary": 0,
      "async_rendering": 1,
      "selector_fragility": 0
    }
  },
  "improvement": {
    "pass_rate_delta": 0.66,
    "improvement_factor": 3.4,
    "maintenance_time_saved_pct": 80
  },
  "top_fragile_selectors": [
    {
      "selector": ".btn-primary",
      "failure_rate": 0.89,
      "reason": "breaks on design system updates",
      "recommended_alternative": "getByRole('button', { name: 'Submit' })"
    },
    {
      "selector": "#submit-form",
      "failure_rate": 0.72,
      "reason": "breaks when form ID changes",
      "recommended_alternative": "getByTestId('submit-form')"
    },
    {
      "selector": "div > div > button",
      "failure_rate": 0.65,
      "reason": "breaks on layout changes",
      "recommended_alternative": "getByRole('button')"
    }
  ],
  "selector_type_analysis": {
    "css_class": { "pass_rate": 0.31, "count": 8, "recommendation": "avoid" },
    "css_id": { "pass_rate": 0.42, "count": 3, "recommendation": "use_sparingly" },
    "role_based": { "pass_rate": 0.91, "count": 6, "recommendation": "preferred" },
    "testid": { "pass_rate": 1.0, "count": 4, "recommendation": "preferred" }
  }
}
```

## 3. shadow-structure.json

Demo app shadow DOM structure mapping.

```json
{
  "app_name": "demo-app",
  "components": [
    {
      "tag": "my-app",
      "shadow_depth": 0,
      "has_shadow": true,
      "children": [
        {
          "tag": "my-layout",
          "shadow_depth": 1,
          "has_shadow": true,
          "children": [
            {
              "tag": "my-form-container",
              "shadow_depth": 2,
              "has_shadow": true,
              "children": [
                {
                  "tag": "my-form",
                  "shadow_depth": 3,
                  "has_shadow": true,
                  "children": [
                    { "tag": "input", "name": "email", "shadow_depth": 3 }
                  ]
                }
              ]
            }
          ]
        },
        {
          "tag": "slotted-dialog",
          "shadow_depth": 1,
          "has_shadow": true,
          "has_slots": true,
          "slots": [
            { "name": "title", "content": "Dialog Title" },
            { "name": "content", "content": "Dialog content here" }
          ]
        },
        {
          "tag": "async-chart",
          "shadow_depth": 1,
          "has_shadow": true,
          "async_render": true,
          "render_delay_ms": 2000
        }
      ]
    }
  ],
  "max_depth": 3,
  "total_shadow_roots": 4,
  "total_slots": 2,
  "async_components": 1
}
```

## 4. reports/selector-resilience-YYYY-MM-DD.md

Human-readable resilience report.

```markdown
# Selector Resilience Report — 2026-04-06

## Summary
- 45 tests total
- Traditional selectors: 12/45 passing (27%)
- Intent-based selectors: 42/45 passing (93%)
- Selector maintenance effort reduced significantly

## Shadow DOM Challenges Detected
- Slotted content: 6 test failures (traditional approach)
- Nested shadow roots (3+ levels): 4 test failures
- Async component rendering: 3 test failures

## Top 5 Most Fragile Selectors
1. `.btn-primary` — 89% failure rate, breaks on design system updates
2. `#submit-form` — 72% failure rate, breaks when form ID changes
3. `div > div > button` — 65% failure rate, breaks on layout changes
4. `.modal-content` — 58% failure rate, shadow boundary not traversed
5. `input[type="text"]` — 45% failure rate, multiple shadow roots

## Recommended Patterns
1. Use `getByRole()` for interactive elements (91% pass rate)
2. Use `data-testid` for complex components (100% pass rate)
3. Avoid CSS class selectors in tests (31% pass rate)
4. Use shadow traversal fixtures for nested components

## Selector Type Analysis
| Type | Pass Rate | Count | Recommendation |
|------|-----------|-------|----------------|
| CSS Class | 31% | 8 | Avoid |
| CSS ID | 42% | 3 | Use sparingly |
| Role-based | 91% | 6 | Preferred |
| Test ID | 100% | 4 | Preferred |

## Shadow DOM Depth Impact
- Depth 1: 95% pass rate (intent-based)
- Depth 2: 92% pass rate (intent-based)
- Depth 3: 88% pass rate (intent-based)
- Depth 3+ (traditional): 12% pass rate
```

## Quality Rules

- Artifacts must be deterministic and readable
- Do not omit shadow depth information from selector history
- Do not generate empty resilience metrics
- The UI must be able to render all artifacts without transformation errors
- Reports must include specific selector examples, not just percentages
