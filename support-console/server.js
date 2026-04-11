// support-console/server.js
// Support-facing web console for test resilience dashboard

const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('../runtime/store');

const PORT = process.env.CONSOLE_PORT || 3001;
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

function serveFile(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(content);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
  }
}

// --- Simulation Endpoints ---

function simulateTraditionalRun(res) {
  try {
    const results = {
      total: 15,
      passed: 4,
      failed: 11,
      pass_rate: 0.27,
      failures: [
        {
          test: 'slotted-dialog.test.js',
          error: 'Timeout waiting for selector \'button[role="button"]\'',
          selector_used: 'getByRole(\'dialog\').getByRole(\'button\')',
          shadow_boundary: 'slot'
        },
        {
          test: 'nested-form.test.js',
          error: 'Element not found: input[name="email"]',
          selector_used: 'input[name="email"]',
          shadow_depth: 3
        },
        {
          test: 'button-click.test.js',
          error: 'Selector \'.btn-primary\' not found',
          selector_used: '.btn-primary',
          shadow_depth: 2
        },
        {
          test: 'form-submit.test.js',
          error: 'Timeout: #submit-form not visible',
          selector_used: '#submit-form',
          shadow_depth: 1
        },
        {
          test: 'deep-nested.test.js',
          error: 'Traversal failed at depth 3',
          selector_used: 'div > div > button',
          shadow_depth: 3
        }
      ]
    };
    
    store.setTestResults('traditional', results);
    
    // Generate selector history entries
    const selectors = [
      { selector: '.btn-primary', type: 'css_class', passed: false, test: 'button-click.test.js' },
      { selector: '#submit-form', type: 'css_id', passed: false, test: 'form-submit.test.js' },
      { selector: 'div > div > button', type: 'css_structural', passed: false, test: 'deep-nested.test.js' },
      { selector: 'input[name="email"]', type: 'attribute', passed: false, test: 'nested-form.test.js' },
      { selector: 'getByRole(\'button\')', type: 'role_based', passed: true, test: 'simple-button.test.js' },
      { selector: '[data-testid="submit"]', type: 'testid', passed: true, test: 'testid-submit.test.js' }
    ];
    
    selectors.forEach(s => {
      store.appendSelectorHistory({
        selector: s.selector,
        type: s.type,
        passed: s.passed,
        test: s.test,
        approach: 'traditional',
        shadow_depth: s.passed ? 0 : Math.floor(Math.random() * 3) + 1
      });
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      action: 'run-traditional',
      results_ref: 'runtime/test-results-traditional.json',
      summary: {
        passed: results.passed,
        failed: results.failed,
        pass_rate: results.pass_rate
      }
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

function simulateIntentRun(res) {
  try {
    const results = {
      total: 15,
      passed: 14,
      failed: 1,
      pass_rate: 0.93,
      failures: []
    };
    
    store.setTestResults('intent_based', results);
    
    // Generate selector history entries for intent-based approach
    const selectors = [
      { selector: 'getByRole(\'button\', { name: /submit/i })', type: 'role_based', passed: true, test: 'button-click.test.js' },
      { selector: 'getByRole(\'button\', { name: /submit/i })', type: 'role_based', passed: true, test: 'form-submit.test.js' },
      { selector: 'getByLabel(/email/i)', type: 'accessible', passed: true, test: 'nested-form.test.js' },
      { selector: 'getByTestId(\'submit-btn\')', type: 'testid', passed: true, test: 'testid-submit.test.js' },
      { selector: 'getByRole(\'dialog\')', type: 'role_based', passed: true, test: 'slotted-dialog.test.js' }
    ];
    
    selectors.forEach(s => {
      store.appendSelectorHistory({
        selector: s.selector,
        type: s.type,
        passed: s.passed,
        test: s.test,
        approach: 'intent_based',
        shadow_depth: 0
      });
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      action: 'run-intent',
      results_ref: 'runtime/test-results-intent.json',
      summary: {
        passed: results.passed,
        failed: results.failed,
        pass_rate: results.pass_rate
      }
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

function generateReport(res) {
  try {
    const testResults = store.getTestResults();
    const reportId = `report_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`;
    const reportDate = new Date().toISOString();
    
    const report = {
      id: reportId,
      generated_at: reportDate,
      type: 'resilience',
      summary: `Traditional: ${Math.round((testResults.traditional?.pass_rate || 0) * 100)}% pass, Intent-based: ${Math.round((testResults.intent_based?.pass_rate || 0) * 100)}% pass`,
      ref: `reports/selector-resilience-${reportDate.split('T')[0]}.md`
    };
    
    store.addReport(report);
    
    // Generate markdown report file
    const reportContent = `# Selector Resilience Report

Generated: ${reportDate}

## Summary

- **Traditional Approach**: ${testResults.traditional?.passed || 0}/${testResults.traditional?.total || 0} tests passed (${Math.round((testResults.traditional?.pass_rate || 0) * 100)}%)
- **Intent-Based Approach**: ${testResults.intent_based?.passed || 0}/${testResults.intent_based?.total || 0} tests passed (${Math.round((testResults.intent_based?.pass_rate || 0) * 100)}%)

## Improvement Factor

${testResults.traditional?.pass_rate > 0 ? Math.round((testResults.intent_based?.pass_rate || 0) / testResults.traditional.pass_rate * 10) / 10 : 'N/A'}x improvement with intent-based selectors

## Top Fragile Selectors (Traditional)

1. \`.btn-primary\` - breaks on design system updates
2. \`#submit-form\` - breaks when form ID changes
3. \`div > div > button\` - breaks on layout changes

## Recommendations

- Prefer role-based selectors for interactive elements
- Use accessible name patterns for form inputs
- Reserve testid for elements without semantic meaning
`;
    
    const reportPath = path.join(REPORTS_DIR, `selector-resilience-${reportDate.split('T')[0]}.md`);
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      report_id: reportId,
      ref: report.ref
    }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

function resetConsole(res) {
  try {
    store.resetRuntime();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: e.message }));
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // GET routes
  if (req.url === '/' || req.url === '/index.html') {
    serveFile(res, path.join(__dirname, 'ui', 'index.html'), 'text/html');
  } else if (req.url === '/api/test-results') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(store.getTestResults()));
  } else if (req.url === '/api/resilience-metrics') {
    const testResults = store.getTestResults();
    const metrics = {
      traditional_pass_rate: testResults.traditional?.pass_rate || 0,
      intent_pass_rate: testResults.intent_based?.pass_rate || 0,
      improvement_factor: testResults.traditional?.pass_rate > 0 
        ? Math.round((testResults.intent_based?.pass_rate || 0) / testResults.traditional.pass_rate * 10) / 10 
        : 0,
      top_fragile_selectors: [
        { selector: '.btn-primary', failure_rate: 0.89, reason: 'breaks on design system updates' },
        { selector: '#submit-form', failure_rate: 0.72, reason: 'breaks when form ID changes' },
        { selector: 'div > div > button', failure_rate: 0.65, reason: 'breaks on layout changes' }
      ],
      maintenance_time_saved_pct: 80,
      selector_types: {
        css_class: { pass_rate: 0.31, count: 8 },
        css_id: { pass_rate: 0.42, count: 3 },
        role_based: { pass_rate: 0.91, count: 6 },
        testid: { pass_rate: 1.0, count: 4 }
      }
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
  } else if (req.url === '/api/shadow-depth') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(store.getShadowStructure()));
  } else if (req.url === '/api/reports') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(store.getReportsIndex()));
  } else if (req.url.startsWith('/api/reports/')) {
    const reportId = req.url.split('/').pop();
    const reportsIndex = store.getReportsIndex();
    const reportMeta = reportsIndex.find(r => r.id === reportId);
    if (!reportMeta) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Report not found' }));
      return;
    }
    const reportFileName = reportMeta.ref.split('/').pop();
    const reportPath = path.join(REPORTS_DIR, reportFileName);
    serveFile(res, reportPath, 'text/markdown');
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      demo_app: 'operational',
      test_runner: 'operational',
      report_generator: 'operational'
    }));
  }
  // POST routes
  else if (req.method === 'POST' && req.url === '/api/run-traditional') {
    simulateTraditionalRun(res);
  } else if (req.method === 'POST' && req.url === '/api/run-intent') {
    simulateIntentRun(res);
  } else if (req.method === 'POST' && req.url === '/api/generate-report') {
    generateReport(res);
  } else if (req.method === 'POST' && req.url === '/api/reset') {
    resetConsole(res);
  }
  // 404 for unknown routes
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Support console running on http://localhost:${PORT}`);
});

module.exports = server;
