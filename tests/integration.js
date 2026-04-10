// tests/integration.js
// Full-system integration tests for Shadow DOM Intent-Based Testing Harness
// Tests the complete flow: Store → Metrics Engine → Classifier → Report Generator
// Uses the shared runtime store directly (no HTTP server required)

const fs = require('fs');
const path = require('path');
const store = require('../runtime/store');
const classifier = require('../flake-control-plane/classifier');
const metricsEngine = require('../flake-control-plane/metrics-engine');
const reportGenerator = require('../flake-control-plane/report-generator');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(` ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(` ✗ ${name}`);
    console.log(`   ${err.message}`);
    failed++;
  }
}

function resetSystem() {
  store.resetRuntime();
  // Clean up any existing reports
  if (fs.existsSync(REPORTS_DIR)) {
    const files = fs.readdirSync(REPORTS_DIR);
    files.forEach(f => {
      if (f.endsWith('.md')) {
        fs.unlinkSync(path.join(REPORTS_DIR, f));
      }
    });
  }
}

async function runIntegrationTests() {
  console.log('\n=== Integration Tests — Full System ===\n');

  // --- Test 1: Reset clears all runtime state ---
  console.log('Test 1: Reset clears all runtime state');
  resetSystem();

  test('reset clears selector history', () => {
    const history = store.getSelectorHistory();
    if (history.length !== 0) throw new Error(`Expected empty history, got ${history.length} entries`);
  });

  test('reset clears test results', () => {
    const results = store.getTestResults();
    if (results.traditional.total !== 0) throw new Error('Traditional results not cleared');
    if (results.intent_based.total !== 0) throw new Error('Intent-based results not cleared');
  });

  test('reset clears resilience metrics', () => {
    const metrics = store.getResilienceMetrics();
    if (metrics.traditional.total_tests !== 0) throw new Error('Traditional metrics not cleared');
    if (metrics.intent_based.total_tests !== 0) throw new Error('Intent-based metrics not cleared');
  });

  test('reset clears reports index', () => {
    const reports = store.getReportsIndex();
    if (reports.length !== 0) throw new Error(`Expected empty reports, got ${reports.length}`);
  });

  // --- Test 2: Run traditional simulation populates selector history ---
  console.log('\nTest 2: Run traditional simulation populates selector history');
  resetSystem();

  // Simulate traditional test run
  const traditionalSelectors = [
    { selector: '.btn-primary', type: 'css_class', result: 'failed', test: 'button-click.test.js', approach: 'traditional', shadow_depth: 2 },
    { selector: '#submit-form', type: 'css_id', result: 'failed', test: 'form-submit.test.js', approach: 'traditional', shadow_depth: 1 },
    { selector: 'div > div > button', type: 'css_structural', result: 'failed', test: 'deep-nested.test.js', approach: 'traditional', shadow_depth: 3 },
    { selector: 'input[name="email"]', type: 'attribute', result: 'failed', test: 'nested-form.test.js', approach: 'traditional', shadow_depth: 3 },
    { selector: 'getByRole(\'button\')', type: 'role_based', result: 'passed', test: 'simple-button.test.js', approach: 'traditional' },
    { selector: '[data-testid="submit"]', type: 'testid', result: 'passed', test: 'testid-submit.test.js', approach: 'traditional' }
  ];

  traditionalSelectors.forEach(s => {
    store.appendSelectorHistory({
      selector: s.selector,
      type: s.type,
      result: s.result,
      test: s.test,
      approach: s.approach,
      shadow_depth: s.shadow_depth || 0
    });
  });

  test('traditional run populates selector history', () => {
    const history = store.getSelectorHistory();
    if (history.length !== 6) throw new Error(`Expected 6 entries, got ${history.length}`);
  });

  test('traditional entries have correct approach', () => {
    const history = store.getSelectorHistory();
    const allTraditional = history.every(e => e.approach === 'traditional');
    if (!allTraditional) throw new Error('Not all entries are traditional approach');
  });

  test('traditional failures are classified correctly', () => {
    const breakdown = classifier.getFailureBreakdown('traditional');
    if (breakdown.shadow_boundary !== 4) throw new Error(`Expected 4 shadow_boundary failures, got ${breakdown.shadow_boundary}`);
  });

  // --- Test 3: Run intent-based simulation populates selector history ---
  console.log('\nTest 3: Run intent-based simulation populates selector history');
  resetSystem();

  // Simulate intent-based test run
  const intentSelectors = [
    { selector: 'getByRole(\'button\', { name: /submit/i })', type: 'role_based', result: 'passed', test: 'button-click.test.js', approach: 'intent-based' },
    { selector: 'getByRole(\'button\', { name: /submit/i })', type: 'role_based', result: 'passed', test: 'form-submit.test.js', approach: 'intent-based' },
    { selector: 'getByLabel(/email/i)', type: 'accessible', result: 'passed', test: 'nested-form.test.js', approach: 'intent-based' },
    { selector: 'getByTestId(\'submit-btn\')', type: 'testid', result: 'passed', test: 'testid-submit.test.js', approach: 'intent-based' },
    { selector: 'getByRole(\'dialog\')', type: 'role_based', result: 'passed', test: 'slotted-dialog.test.js', approach: 'intent-based' },
    { selector: 'getByText(/confirm/i)', type: 'text', result: 'failed', test: 'confirm-dialog.test.js', approach: 'intent-based', error: 'Timeout waiting for element' }
  ];

  intentSelectors.forEach(s => {
    store.appendSelectorHistory({
      selector: s.selector,
      type: s.type,
      result: s.result,
      test: s.test,
      approach: s.approach,
      error: s.error
    });
  });

  test('intent-based run populates selector history', () => {
    const history = store.getSelectorHistory();
    if (history.length !== 6) throw new Error(`Expected 6 entries, got ${history.length}`);
  });

  test('intent-based entries have correct approach', () => {
    const history = store.getSelectorHistory();
    const allIntent = history.every(e => e.approach === 'intent-based');
    if (!allIntent) throw new Error('Not all entries are intent-based approach');
  });

  test('intent-based failures are classified as async_rendering', () => {
    const breakdown = classifier.getFailureBreakdown('intent-based');
    if (breakdown.async_rendering !== 1) throw new Error(`Expected 1 async_rendering failure, got ${breakdown.async_rendering}`);
  });

  // --- Test 4: Resilience metrics computed correctly after both runs ---
  console.log('\nTest 4: Resilience metrics computed correctly after both runs');
  resetSystem();

  // Add both traditional and intent-based data
  const tradData = [
    { selector: '.btn-primary', type: 'css_class', result: 'failed', test: 't1', approach: 'traditional', shadow_depth: 2 },
    { selector: '.submit-btn', type: 'css_class', result: 'failed', test: 't2', approach: 'traditional', shadow_depth: 1 },
    { selector: '#form', type: 'css_id', result: 'failed', test: 't3', approach: 'traditional', shadow_depth: 1 },
    { selector: 'getByRole(\'button\')', type: 'role_based', result: 'passed', test: 't4', approach: 'traditional' }
  ];

  const intentData = [
    { selector: 'getByRole(\'button\')', type: 'role_based', result: 'passed', test: 'i1', approach: 'intent-based' },
    { selector: 'getByTestId(\'submit\')', type: 'testid', result: 'passed', test: 'i2', approach: 'intent-based' },
    { selector: 'getByLabel(/email/)', type: 'accessible', result: 'passed', test: 'i3', approach: 'intent-based' }
  ];

  [...tradData, ...intentData].forEach(s => {
    store.appendSelectorHistory({
      selector: s.selector,
      type: s.type,
      result: s.result,
      test: s.test,
      approach: s.approach,
      shadow_depth: s.shadow_depth || 0
    });
  });

  const metrics = metricsEngine.computeAllMetrics();

  test('traditional metrics show correct pass rate', () => {
    if (metrics.traditional.pass_rate !== 0.25) throw new Error(`Expected 0.25 pass rate, got ${metrics.traditional.pass_rate}`);
  });

  test('intent-based metrics show correct pass rate', () => {
    if (metrics.intent_based.pass_rate !== 1) throw new Error(`Expected 1.0 pass rate, got ${metrics.intent_based.pass_rate}`);
  });

  test('improvement factor is computed', () => {
    if (metrics.improvement.improvement_factor !== 4) throw new Error(`Expected 4x improvement, got ${metrics.improvement.improvement_factor}`);
  });

  test('top fragile selectors are identified', () => {
    if (metrics.top_fragile_selectors.length === 0) throw new Error('No fragile selectors identified');
    const hasBtnPrimary = metrics.top_fragile_selectors.some(s => s.selector === '.btn-primary');
    if (!hasBtnPrimary) throw new Error('.btn-primary not in fragile selectors');
  });

  // --- Test 5: Report generation creates markdown file ---
  console.log('\nTest 5: Report generation creates markdown file');
  resetSystem();

  // Add test data
  store.appendSelectorHistory({ selector: '.btn', type: 'css_class', result: 'failed', test: 't1', approach: 'traditional', shadow_depth: 1 });
  store.appendSelectorHistory({ selector: 'getByRole(\'button\')', type: 'role_based', result: 'passed', test: 'i1', approach: 'intent-based' });

  const reportResult = reportGenerator.generateReport({ date: '2026-04-10' });

  test('report generation returns report_id', () => {
    if (!reportResult.report_id) throw new Error('No report_id returned');
    if (!reportResult.report_id.includes('2026-04-10')) throw new Error('Report ID does not contain date');
  });

  test('report file is created', () => {
    if (!fs.existsSync(reportResult.file_path)) throw new Error('Report file not created');
  });

  test('report file contains required sections', () => {
    const content = fs.readFileSync(reportResult.file_path, 'utf8');
    const requiredSections = ['Summary', 'Improvement Analysis', 'Top 5 Most Fragile Selectors', 'Selector Type Analysis'];
    for (const section of requiredSections) {
      if (!content.includes(section)) throw new Error(`Missing section: ${section}`);
    }
  });

  // --- Test 6: Reports index updated after generation ---
  console.log('\nTest 6: Reports index updated after generation');

  test('reports index contains new report', () => {
    const reports = store.getReportsIndex();
    if (reports.length === 0) throw new Error('Reports index is empty');
    const hasReport = reports.some(r => r.report_id && r.report_id.includes('2026-04-10'));
    if (!hasReport) throw new Error('Generated report not in index');
  });

  // --- Test 7: Shadow depth endpoint returns correct structure ---
  console.log('\nTest 7: Shadow depth endpoint returns correct structure');

  test('shadow structure has required fields', () => {
    const structure = store.getShadowStructure();
    if (!structure.hasOwnProperty('app_name')) throw new Error('Missing app_name');
    if (!structure.hasOwnProperty('components')) throw new Error('Missing components');
    if (!structure.hasOwnProperty('max_depth')) throw new Error('Missing max_depth');
    if (!structure.hasOwnProperty('total_shadow_roots')) throw new Error('Missing total_shadow_roots');
  });

  // --- Test 8: Health endpoint returns all operational ---
  console.log('\nTest 8: Health endpoint returns all operational');

  test('health check structure is valid', () => {
    // Simulate health check by verifying store is operational
    const results = store.getTestResults();
    const metrics = store.getResilienceMetrics();
    const history = store.getSelectorHistory();
    const reports = store.getReportsIndex();

    if (typeof results !== 'object') throw new Error('Test results not accessible');
    if (typeof metrics !== 'object') throw new Error('Resilience metrics not accessible');
    if (!Array.isArray(history)) throw new Error('Selector history not accessible');
    if (!Array.isArray(reports)) throw new Error('Reports index not accessible');
  });

  // --- Test 9: Reset after simulation clears everything ---
  console.log('\nTest 9: Reset after simulation clears everything');

  // Add data
  store.appendSelectorHistory({ selector: '.test', type: 'css_class', result: 'failed', test: 'test', approach: 'traditional' });
  store.setTestResults('traditional', { total: 10, passed: 5, failed: 5, pass_rate: 0.5, failures: [] });
  store.addReport({ report_id: 'test-report', type: 'test' });

  // Reset
  store.resetRuntime();

  test('all state cleared after reset', () => {
    const history = store.getSelectorHistory();
    const results = store.getTestResults();
    const reports = store.getReportsIndex();

    if (history.length !== 0) throw new Error('History not cleared');
    if (results.traditional.total !== 0) throw new Error('Test results not cleared');
    if (reports.length !== 0) throw new Error('Reports not cleared');
  });

  // --- Test 10: Sequential: reset → traditional → intent → metrics shows correct improvement ---
  console.log('\nTest 10: Sequential flow shows correct improvement');

  // Reset
  resetSystem();

  // Run traditional simulation
  const tradSeq = [
    { selector: '.btn-primary', type: 'css_class', result: 'failed', test: 's1', approach: 'traditional', shadow_depth: 2 },
    { selector: '#submit', type: 'css_id', result: 'failed', test: 's2', approach: 'traditional', shadow_depth: 1 },
    { selector: 'div > button', type: 'css_structural', result: 'failed', test: 's3', approach: 'traditional', shadow_depth: 3 },
    { selector: 'getByRole(\'link\')', type: 'role_based', result: 'passed', test: 's4', approach: 'traditional' }
  ];

  tradSeq.forEach(s => {
    store.appendSelectorHistory({
      selector: s.selector,
      type: s.type,
      result: s.result,
      test: s.test,
      approach: s.approach,
      shadow_depth: s.shadow_depth || 0
    });
  });

  // Run intent-based simulation
  const intentSeq = [
    { selector: 'getByRole(\'button\', { name: /submit/i })', type: 'role_based', result: 'passed', test: 's1', approach: 'intent-based' },
    { selector: 'getByTestId(\'submit-btn\')', type: 'testid', result: 'passed', test: 's2', approach: 'intent-based' },
    { selector: 'getByRole(\'button\')', type: 'role_based', result: 'passed', test: 's3', approach: 'intent-based' },
    { selector: 'getByRole(\'link\')', type: 'role_based', result: 'passed', test: 's4', approach: 'intent-based' }
  ];

  intentSeq.forEach(s => {
    store.appendSelectorHistory({
      selector: s.selector,
      type: s.type,
      result: s.result,
      test: s.test,
      approach: s.approach
    });
  });

  // Compute metrics
  const seqMetrics = metricsEngine.computeAllMetrics();

  test('sequential flow: traditional has 25% pass rate', () => {
    if (seqMetrics.traditional.pass_rate !== 0.25) throw new Error(`Expected 0.25, got ${seqMetrics.traditional.pass_rate}`);
  });

  test('sequential flow: intent-based has 100% pass rate', () => {
    if (seqMetrics.intent_based.pass_rate !== 1) throw new Error(`Expected 1.0, got ${seqMetrics.intent_based.pass_rate}`);
  });

  test('sequential flow: improvement factor is 4x', () => {
    if (seqMetrics.improvement.improvement_factor !== 4) throw new Error(`Expected 4x, got ${seqMetrics.improvement.improvement_factor}`);
  });

  test('sequential flow: maintenance time saved is 75%', () => {
    if (seqMetrics.improvement.maintenance_time_saved_pct !== 75) throw new Error(`Expected 75%, got ${seqMetrics.improvement.maintenance_time_saved_pct}`);
  });

  test('sequential flow: shadow boundary failures detected', () => {
    if (seqMetrics.traditional.failure_breakdown.shadow_boundary !== 3) {
      throw new Error(`Expected 3 shadow_boundary failures, got ${seqMetrics.traditional.failure_breakdown.shadow_boundary}`);
    }
  });

  // --- Results ---
  console.log(`\n=== Integration Results: ${passed} passed, ${failed} failed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests().catch(err => {
  console.error('Integration test runner failed:', err);
  process.exit(1);
});
