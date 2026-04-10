// flake-control-plane/report-generator.js
// Generates markdown resilience reports from metrics

const fs = require('fs');
const path = require('path');
const store = require('../runtime/store');
const classifier = require('./classifier');
const metricsEngine = require('./metrics-engine');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');

/**
 * Ensure reports directory exists
 */
function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generate a markdown resilience report
 * @param {Object} options - Report options
 * @param {string} options.date - Report date (YYYY-MM-DD)
 * @returns {Object} - { report_id, file_path }
 */
function generateReport(options = {}) {
  ensureReportsDir();
  
  const date = options.date || new Date().toISOString().split('T')[0];
  const reportId = `selector-resilience-${date}`;
  const filePath = path.join(REPORTS_DIR, `${reportId}.md`);
  
  // Compute metrics
  const metrics = metricsEngine.computeAllMetrics();
  const detailedFailures = classifier.getDetailedFailures('traditional');
  
  // Build report content
  const content = buildReportContent(metrics, detailedFailures, date);
  
  // Write report file
  fs.writeFileSync(filePath, content, 'utf8');
  
  // Add to reports index
  store.addReport({
    report_id: reportId,
    file_path: filePath,
    date: date,
    type: 'selector-resilience'
  });
  
  return { report_id: reportId, file_path: filePath };
}

/**
 * Build markdown report content
 * @param {Object} metrics - Resilience metrics
 * @param {Array} detailedFailures - Detailed failure analysis
 * @param {string} date - Report date
 * @returns {string} - Markdown content
 */
function buildReportContent(metrics, detailedFailures, date) {
  const lines = [];
  
  // Header
  lines.push(`# Selector Resilience Report — ${date}`);
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  lines.push('');
  const totalTests = metrics.traditional.total_tests + metrics.intent_based.total_tests;
  lines.push(`- ${totalTests} tests total`);
  lines.push(`- Traditional selectors: ${metrics.traditional.passed}/${metrics.traditional.total_tests} passing (${Math.round(metrics.traditional.pass_rate * 100)}%)`);
  lines.push(`- Intent-based selectors: ${metrics.intent_based.passed}/${metrics.intent_based.total_tests} passing (${Math.round(metrics.intent_based.pass_rate * 100)}%)`);
  lines.push(`- Selector maintenance time reduced by ${metrics.improvement.maintenance_time_saved_pct}%`);
  lines.push('');
  
  // Improvement Factor
  lines.push('## Improvement Analysis');
  lines.push('');
  lines.push(`- **Pass Rate Delta**: ${Math.round(metrics.improvement.pass_rate_delta * 100)}% improvement`);
  lines.push(`- **Improvement Factor**: ${metrics.improvement.improvement_factor}x more reliable`);
  lines.push(`- **Maintenance Savings**: ${metrics.improvement.maintenance_time_saved_pct}% less time fixing broken tests`);
  lines.push('');
  
  // Top Fragile Selectors
  lines.push('## Top 5 Most Fragile Selectors');
  lines.push('');
  if (metrics.top_fragile_selectors.length === 0) {
    lines.push('No fragile selectors detected.');
  } else {
    metrics.top_fragile_selectors.forEach((item, index) => {
      lines.push(`${index + 1}. \`${item.selector}\` — ${item.reason}`);
      lines.push(`   - Recommended: ${item.recommended_alternative}`);
    });
  }
  lines.push('');
  
  // Failure Breakdown
  lines.push('## Failure Breakdown by Type');
  lines.push('');
  lines.push('| Category | Traditional | Intent-Based |');
  lines.push('|----------|-------------|--------------|');
  lines.push(`| Shadow Boundary | ${metrics.traditional.failure_breakdown.shadow_boundary} | ${metrics.intent_based.failure_breakdown.shadow_boundary} |`);
  lines.push(`| Async Rendering | ${metrics.traditional.failure_breakdown.async_rendering} | ${metrics.intent_based.failure_breakdown.async_rendering} |`);
  lines.push(`| Selector Fragility | ${metrics.traditional.failure_breakdown.selector_fragility} | ${metrics.intent_based.failure_breakdown.selector_fragility} |`);
  lines.push('');
  
  // Selector Type Analysis
  lines.push('## Selector Type Analysis');
  lines.push('');
  if (Object.keys(metrics.selector_type_analysis).length === 0) {
    lines.push('No selector type data available.');
  } else {
    lines.push('| Type | Pass Rate | Count | Recommendation |');
    lines.push('|------|-----------|-------|----------------|');
    for (const [type, data] of Object.entries(metrics.selector_type_analysis)) {
      lines.push(`| ${type} | ${Math.round(data.pass_rate * 100)}% | ${data.count} | ${data.recommendation} |`);
    }
  }
  lines.push('');
  
  // Recommended Patterns
  lines.push('## Recommended Patterns');
  lines.push('');
  lines.push('1. Use `getByRole()` for interactive elements (buttons, links, inputs)');
  lines.push('2. Use `data-testid` for complex components without clear roles');
  lines.push('3. Avoid CSS class selectors in tests (`.btn-primary`, `.submit-btn`)');
  lines.push('4. Use `getByText()` only as a last resort');
  lines.push('5. For Shadow DOM: traverse shadow roots explicitly or use intent-based locators');
  lines.push('');
  
  // Footer
  lines.push('---');
  lines.push(`*Generated by Shadow DOM Intent Testing Harness on ${date}*`);
  
  return lines.join('\n');
}

module.exports = {
  generateReport,
  buildReportContent
};
