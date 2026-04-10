# API Contract — Shadow DOM Intent-Based Testing Harness

This file is the source of truth for the repo's HTTP surface. Any AI building this repo must follow these request/response contracts exactly unless there is a documented reason to extend them.

## General Rules

- Content type for JSON routes: `application/json`
- All successful POST simulation endpoints return `{ success: true, action: <name> }`
- All failed requests return `{ success: false, error: <message> }`
- The test resilience dashboard depends on these routes. Do not rename them casually.

---

## 1. Console and Report Routes

### `GET /`
Serve `support-console/ui/index.html`

### `GET /api/test-results`
Returns current test run results with pass/fail status.

**Response 200**
```json
{
  "last_run": "2026-04-06T08:00:00.000Z",
  "traditional": {
    "total": 15,
    "passed": 4,
    "failed": 11,
    "pass_rate": 0.27,
    "failures": [
      {
        "test": "slotted-dialog.test.js",
        "error": "Timeout waiting for selector 'button[role=\"button\"]'",
        "selector_used": "getByRole('dialog').getByRole('button')",
        "shadow_boundary": "slot"
      },
      {
        "test": "nested-form.test.js",
        "error": "Element not found: input[name=\"email\"]",
        "selector_used": "input[name=\"email\"]",
        "shadow_depth": 3
      }
    ]
  },
  "intent_based": {
    "total": 15,
    "passed": 14,
    "failed": 1,
    "pass_rate": 0.93,
    "failures": []
  }
}
```

### `GET /api/resilience-metrics`
Returns selector resilience comparison metrics.

**Response 200**
```json
{
  "traditional_pass_rate": 0.27,
  "intent_pass_rate": 0.93,
  "improvement_factor": 3.4,
  "top_fragile_selectors": [
    {
      "selector": ".btn-primary",
      "failure_rate": 0.89,
      "reason": "breaks on design system updates"
    },
    {
      "selector": "#submit-form",
      "failure_rate": 0.72,
      "reason": "breaks when form ID changes"
    },
    {
      "selector": "div > div > button",
      "failure_rate": 0.65,
      "reason": "breaks on layout changes"
    }
  ],
  "maintenance_time_saved_pct": 80,
  "selector_types": {
    "css_class": { "pass_rate": 0.31, "count": 8 },
    "css_id": { "pass_rate": 0.42, "count": 3 },
    "role_based": { "pass_rate": 0.91, "count": 6 },
    "testid": { "pass_rate": 1.0, "count": 4 }
  }
}
```

### `GET /api/shadow-depth`
Returns the shadow DOM nesting structure for the demo app.

**Response 200**
```json
{
  "components": [
    {
      "name": "my-app",
      "shadow_depth": 0,
      "children": ["my-layout"]
    },
    {
      "name": "my-layout",
      "shadow_depth": 1,
      "children": ["my-form-container"]
    },
    {
      "name": "my-form-container",
      "shadow_depth": 2,
      "children": ["my-form"]
    },
    {
      "name": "my-form",
      "shadow_depth": 3,
      "children": ["input[name=\"email\"]"]
    },
    {
      "name": "slotted-dialog",
      "shadow_depth": 1,
      "has_slots": true,
      "slot_names": ["title", "content"]
    }
  ],
  "max_depth": 3,
  "total_shadow_roots": 4
}
```

### `GET /api/reports`
Returns available report metadata.

**Response 200**
```json
[
  {
    "id": "report_2026_04_06",
    "generated_at": "2026-04-06T08:00:00.000Z",
    "type": "resilience",
    "summary": "Traditional: 27% pass, Intent-based: 93% pass",
    "ref": "reports/selector-resilience-2026-04-06.md"
  }
]
```

### `GET /api/reports/:id`
Returns a generated markdown report.

---

## 2. Health and Runtime Routes

### `GET /api/health`
Returns current system health.

**Response 200**
```json
{
  "demo_app": "operational",
  "test_runner": "operational",
  "report_generator": "operational"
}
```

### `POST /api/reset`
Clears runtime state and test results.

**Response 200**
```json
{ "success": true }
```

---

## 3. Test Execution Routes

### `POST /api/run-traditional`
Runs the traditional selector test suite.

**Response 200**
```json
{
  "success": true,
  "action": "run-traditional",
  "results_ref": "runtime/test-results-traditional.json",
  "summary": {
    "passed": 4,
    "failed": 11,
    "pass_rate": 0.27
  }
}
```

### `POST /api/run-intent`
Runs the intent-based selector test suite.

**Response 200**
```json
{
  "success": true,
  "action": "run-intent",
  "results_ref": "runtime/test-results-intent.json",
  "summary": {
    "passed": 14,
    "failed": 1,
    "pass_rate": 0.93
  }
}
```

---

## 4. Control Routes

### `POST /api/generate-report`
Generates a new resilience report.

**Response 200**
```json
{
  "success": true,
  "report_id": "report_2026_04_06",
  "ref": "reports/selector-resilience-2026-04-06.md"
}
```

---

## 5. Debug Routes (Optional)

### `GET /api/debug/shadow-tree`
Returns full shadow DOM tree for debugging.

### `GET /api/debug/selectors/:test_name`
Returns selector breakdown for a specific test.

These are optional. Do not block the MVP on them.

---

## Implementation Notes

- The server must send **no-cache headers** on HTML and markdown responses.
- The UI assumes the test result endpoints are directly readable.
- Test execution should update runtime state, then the UI polls for results.
- Shadow depth information should be pre-computed from the demo app structure.
