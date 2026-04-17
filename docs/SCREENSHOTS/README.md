# Operator Dashboard Screenshots

These screenshots show the operator dashboard for the Shadow DOM Intent-Based Testing Harness.

## Files

| File | Description |
|------|-------------|
| `01-main-view.png` | Dashboard main view showing test comparison interface |
| `02-active-simulation.png` | Active test simulation with results populating |
| `03-side-panel-state.png` | Side panel showing selector resilience metrics |

## How to Capture Fresh Screenshots

If screenshots need refreshing:

```bash
# Start the operator dashboard
npm run start:all

# Open http://localhost:3001
# Capture screenshots at 1038x753 resolution for consistency
```

## Related Evidence

- **Selector comparison:** [`../proof/selector-comparison.md`](../proof/selector-comparison.md)
- **Locator patterns:** [`../proof/locator-patterns.md`](../proof/locator-patterns.md)
- **Sample report:** [`../../reports/sample-selector-resilience.md`](../../reports/sample-selector-resilience.md)
