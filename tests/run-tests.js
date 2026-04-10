// tests/run-tests.js
// Test suite for Shadow DOM Intent Testing

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import modules to test
const shadowTraversal = require('./fixtures/shadow-traversal');
const intentLocators = require('./fixtures/intent-locators');
const asyncWait = require('./fixtures/async-wait');
const classifier = require('../flake-control-plane/classifier');
const metricsEngine = require('../flake-control-plane/metrics-engine');
const store = require('../runtime/store');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

console.log('\n=== Shadow DOM Intent Testing — Unit Tests ===\n');

// Reset runtime before tests
store.resetRuntime();

// --- Shadow Traversal Fixture Tests ---
console.log('Shadow Traversal Fixture:');

test('findByIntent returns function', () => {
  assert.strictEqual(typeof shadowTraversal.findByIntent, 'function');
});

test('waitForShadowReady returns function', () => {
  assert.strictEqual(typeof shadowTraversal.waitForShadowReady, 'function');
});

test('getAllShadowRoots returns function', () => {
  assert.strictEqual(typeof shadowTraversal.getAllShadowRoots, 'function');
});

// --- Intent Locator Tests ---
console.log('\nIntent Locators:');

test('byRoleAndName produces correct selector', () => {
  const selector = intentLocators.byRoleAndName('button', 'Submit');
  assert.strictEqual(selector, '[role="button"][aria-label="Submit"]');
});

test('byTestId produces correct selector', () => {
  const selector = intentLocators.byTestId('login-btn');
  assert.strictEqual(selector, '[data-testid="login-btn"]');
});

test('byText produces correct selector', () => {
  const selector = intentLocators.byText('Click me');
  assert.strictEqual(selector, ':text("Click me")');
});

// --- Async Wait Tests ---
console.log('\nAsync Wait Utilities:');

test('waitForComponentReady returns function', () => {
  assert.strictEqual(typeof asyncWait.waitForComponentReady, 'function');
});

test('waitForComponentsReady returns function', () => {
  assert.strictEqual(typeof asyncWait.waitForComponentsReady, 'function');
});

test('waitForShadowElement returns function', () => {
  assert.strictEqual(typeof asyncWait.waitForShadowElement, 'function');
});

// --- Classifier Tests ---
console.log('\nClassifier:');

test('classifies shadow boundary failures', () => {
  const entry = {
    result: 'failed',
    shadow_boundary_crossed: true,
    error: 'Element not found'
  };
  const category = classifier.classifyFailure(entry);
  assert.strictEqual(category, 'shadow_boundary');
});

test('classifies async rendering failures', () => {
  const entry = {
    result: 'failed',
    error: 'Timeout waiting for element'
  };
  const category = classifier.classifyFailure(entry);
  assert.strictEqual(category, 'async_rendering');
});

test('classifies selector fragility as default', () => {
  const entry = {
    result: 'failed',
    error: 'Element not found'
  };
  const category = classifier.classifyFailure(entry);
  assert.strictEqual(category, 'selector_fragility');
});

test('classifies by shadow_depth_traversed', () => {
  const entry = {
    result: 'failed',
    shadow_depth_traversed: 2,
    error: 'Element not found'
  };
  const category = classifier.classifyFailure(entry);
  assert.strictEqual(category, 'shadow_boundary');
});

// --- Metrics Engine Tests ---
console.log('\nMetrics Engine:');

test('computes pass rate correctly', () => {
  // Add test data
  store.resetRuntime();
  store.appendSelectorHistory({ approach: 'traditional', selector: '.btn', result: 'passed', test: 'test1' });
  store.appendSelectorHistory({ approach: 'traditional', selector: '.btn', result: 'passed', test: 'test2' });
  store.appendSelectorHistory({ approach: 'traditional', selector: '.btn', result: 'failed', test: 'test3' });

  const metrics = metricsEngine.computeApproachMetrics('traditional');
  assert.strictEqual(metrics.total_tests, 3);
  assert.strictEqual(metrics.passed, 2);
  assert.strictEqual(metrics.failed, 1);
  // Pass rate should be 0.67 (2/3 rounded to 2 decimal places)
  assert.ok(metrics.pass_rate >= 0.66 && metrics.pass_rate <= 0.67);
});

test('detects selector types correctly', () => {
  assert.strictEqual(metricsEngine.detectSelectorType('getByTestId("btn")'), 'testid');
  assert.strictEqual(metricsEngine.detectSelectorType('[data-testid="login"]'), 'testid');
  assert.strictEqual(metricsEngine.detectSelectorType('getByRole("button")'), 'role_based');
  assert.strictEqual(metricsEngine.detectSelectorType('#submit-btn'), 'css_id');
  assert.strictEqual(metricsEngine.detectSelectorType('.btn-primary'), 'css_class');
});

test('computeAllMetrics includes improvement data', () => {
  store.resetRuntime();
  // Add traditional approach data with failures
  store.appendSelectorHistory({ approach: 'traditional', selector: '.btn', result: 'failed', test: 'test1' });
  store.appendSelectorHistory({ approach: 'traditional', selector: '.btn', result: 'failed', test: 'test2' });
  // Add intent-based approach data with passes
  store.appendSelectorHistory({ approach: 'intent-based', selector: '[role="button"]', result: 'passed', test: 'test3' });
  store.appendSelectorHistory({ approach: 'intent-based', selector: '[role="button"]', result: 'passed', test: 'test4' });

  const metrics = metricsEngine.computeAllMetrics();
  assert.ok(metrics.traditional, 'Should have traditional metrics');
  assert.ok(metrics.intent_based, 'Should have intent_based metrics');
  assert.ok(metrics.improvement, 'Should have improvement metrics');
  assert.ok(typeof metrics.improvement.pass_rate_delta === 'number', 'Should have pass_rate_delta');
});

// --- Store Tests ---
console.log('\nStore:');

test('reset clears all state', () => {
  store.appendSelectorHistory({ approach: 'test', selector: '.test', result: 'passed' });
  store.resetRuntime();
  const history = store.getSelectorHistory();
  assert.strictEqual(history.length, 0);
});

test('append/read selector history works', () => {
  store.resetRuntime();
  store.appendSelectorHistory({ approach: 'traditional', selector: '.btn', result: 'passed', test: 'test1' });
  store.appendSelectorHistory({ approach: 'intent-based', selector: '[role="button"]', result: 'passed', test: 'test2' });
  const history = store.getSelectorHistory();
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0].approach, 'traditional');
  assert.strictEqual(history[1].approach, 'intent-based');
});

test('test results can be set and retrieved', () => {
  store.resetRuntime();
  const results = {
    total: 10,
    passed: 8,
    failed: 2,
    pass_rate: 0.8,
    failures: []
  };
  store.setTestResults('traditional', results);
  const testResults = store.getTestResults();
  assert.strictEqual(testResults.traditional.total, 10);
  assert.strictEqual(testResults.traditional.passed, 8);
});

test('reports can be added and retrieved', () => {
  store.resetRuntime();
  store.addReport({ name: 'test-report', type: 'resilience' });
  const reports = store.getReportsIndex();
  assert.strictEqual(reports.length, 1);
  assert.strictEqual(reports[0].name, 'test-report');
});

// --- Results ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failed > 0) {
  process.exit(1);
}
