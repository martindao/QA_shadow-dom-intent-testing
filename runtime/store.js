// runtime/store.js
// File-backed shared state store for cross-process communication
// All services read/write through this layer instead of in-memory shared objects

const fs = require('fs');
const path = require('path');

const RUNTIME_DIR = __dirname;
const TEST_RESULTS_FILE = path.join(RUNTIME_DIR, 'test-results.json');
const RESILIENCE_METRICS_FILE = path.join(RUNTIME_DIR, 'resilience-metrics.json');
const SELECTOR_HISTORY_FILE = path.join(RUNTIME_DIR, 'selector-history.json');
const SHADOW_STRUCTURE_FILE = path.join(RUNTIME_DIR, 'shadow-structure.json');
const REPORTS_INDEX_FILE = path.join(RUNTIME_DIR, 'reports-index.json');

// --- Helpers ---

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// --- Test Results ---

function getTestResults() {
  return readJSON(TEST_RESULTS_FILE, {
    last_run: null,
    traditional: { total: 0, passed: 0, failed: 0, pass_rate: 0, failures: [] },
    intent_based: { total: 0, passed: 0, failed: 0, pass_rate: 0, failures: [] }
  });
}

function setTestResults(approach, results) {
  const current = getTestResults();
  current[approach] = results;
  current.last_run = new Date().toISOString();
  writeJSON(TEST_RESULTS_FILE, current);
}

// --- Resilience Metrics ---

function getResilienceMetrics() {
  return readJSON(RESILIENCE_METRICS_FILE, {
    generated_at: null,
    traditional: { total_tests: 0, passed: 0, failed: 0, pass_rate: 0, avg_duration_ms: 0, failure_breakdown: {} },
    intent_based: { total_tests: 0, passed: 0, failed: 0, pass_rate: 0, avg_duration_ms: 0, failure_breakdown: {} },
    improvement: { pass_rate_delta: 0, improvement_factor: 0, maintenance_time_saved_pct: 0 },
    top_fragile_selectors: [],
    selector_type_analysis: {}
  });
}

function updateResilienceMetrics(data) {
  const current = getResilienceMetrics();
  Object.assign(current, data);
  current.generated_at = new Date().toISOString();
  writeJSON(RESILIENCE_METRICS_FILE, current);
}

// --- Selector History ---

function getSelectorHistory() {
  return readJSON(SELECTOR_HISTORY_FILE, []);
}

function appendSelectorHistory(entry) {
  const history = getSelectorHistory();
  history.push({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
  writeJSON(SELECTOR_HISTORY_FILE, history);
}

// --- Shadow Structure ---

function getShadowStructure() {
  return readJSON(SHADOW_STRUCTURE_FILE, {
    app_name: 'demo-app',
    components: [],
    max_depth: 0,
    total_shadow_roots: 0,
    total_slots: 0,
    async_components: 0
  });
}

// --- Reports Index ---

function getReportsIndex() {
  return readJSON(REPORTS_INDEX_FILE, []);
}

function addReport(report) {
  const index = getReportsIndex();
  index.push({ ...report, generated_at: report.generated_at || new Date().toISOString() });
  writeJSON(REPORTS_INDEX_FILE, index);
}

// --- Reset ---

function resetRuntime() {
  writeJSON(TEST_RESULTS_FILE, {
    last_run: null,
    traditional: { total: 0, passed: 0, failed: 0, pass_rate: 0, failures: [] },
    intent_based: { total: 0, passed: 0, failed: 0, pass_rate: 0, failures: [] }
  });
  writeJSON(RESILIENCE_METRICS_FILE, {
    generated_at: null,
    traditional: { total_tests: 0, passed: 0, failed: 0, pass_rate: 0, avg_duration_ms: 0, failure_breakdown: {} },
    intent_based: { total_tests: 0, passed: 0, failed: 0, pass_rate: 0, avg_duration_ms: 0, failure_breakdown: {} },
    improvement: { pass_rate_delta: 0, improvement_factor: 0, maintenance_time_saved_pct: 0 },
    top_fragile_selectors: [],
    selector_type_analysis: {}
  });
  writeJSON(SELECTOR_HISTORY_FILE, []);
  writeJSON(SHADOW_STRUCTURE_FILE, {
    app_name: 'demo-app',
    components: [],
    max_depth: 0,
    total_shadow_roots: 0,
    total_slots: 0,
    async_components: 0
  });
  writeJSON(REPORTS_INDEX_FILE, []);
}

// --- Initialize if missing ---

function ensureRuntimeFiles() {
  if (!fs.existsSync(TEST_RESULTS_FILE)) {
    writeJSON(TEST_RESULTS_FILE, {
      last_run: null,
      traditional: { total: 0, passed: 0, failed: 0, pass_rate: 0, failures: [] },
      intent_based: { total: 0, passed: 0, failed: 0, pass_rate: 0, failures: [] }
    });
  }
  if (!fs.existsSync(RESILIENCE_METRICS_FILE)) {
    writeJSON(RESILIENCE_METRICS_FILE, {
      generated_at: null,
      traditional: { total_tests: 0, passed: 0, failed: 0, pass_rate: 0, avg_duration_ms: 0, failure_breakdown: {} },
      intent_based: { total_tests: 0, passed: 0, failed: 0, pass_rate: 0, avg_duration_ms: 0, failure_breakdown: {} },
      improvement: { pass_rate_delta: 0, improvement_factor: 0, maintenance_time_saved_pct: 0 },
      top_fragile_selectors: [],
      selector_type_analysis: {}
    });
  }
  if (!fs.existsSync(SELECTOR_HISTORY_FILE)) writeJSON(SELECTOR_HISTORY_FILE, []);
  if (!fs.existsSync(SHADOW_STRUCTURE_FILE)) {
    writeJSON(SHADOW_STRUCTURE_FILE, {
      app_name: 'demo-app',
      components: [],
      max_depth: 0,
      total_shadow_roots: 0,
      total_slots: 0,
      async_components: 0
    });
  }
  if (!fs.existsSync(REPORTS_INDEX_FILE)) writeJSON(REPORTS_INDEX_FILE, []);
}

ensureRuntimeFiles();

module.exports = {
  getTestResults,
  setTestResults,
  getResilienceMetrics,
  updateResilienceMetrics,
  getSelectorHistory,
  appendSelectorHistory,
  getShadowStructure,
  getReportsIndex,
  addReport,
  resetRuntime,
  ensureRuntimeFiles
};
