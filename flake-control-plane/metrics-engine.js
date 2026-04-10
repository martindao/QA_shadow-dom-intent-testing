// flake-control-plane/metrics-engine.js
// Computes resilience metrics from selector history

const store = require('../runtime/store');
const classifier = require('./classifier');

/**
 * Detect selector type from selector string
 * @param {string} selector - Selector string
 * @returns {string} - 'css_class', 'css_id', 'role_based', or 'testid'
 */
function detectSelectorType(selector) {
    if (selector.includes('getByTestId') || selector.includes('data-testid')) {
        return 'testid';
    }
    if (selector.includes('getByRole') || selector.includes('getByLabelText') || selector.includes('findByRole')) {
        return 'role_based';
    }
    if (selector.startsWith('#') || selector.includes('[id=') || selector.includes('#')) {
        return 'css_id';
    }
    return 'css_class';
}

/**
 * Calculate pass rate
 * @param {number} passed 
 * @param {number} total 
 * @returns {number} - Pass rate as decimal (0-1)
 */
function calcPassRate(passed, total) {
    return total === 0 ? 0 : Math.round((passed / total) * 100) / 100;
}

/**
 * Compute metrics for a specific approach
 * @param {string} approach - 'traditional' or 'intent-based'
 * @returns {Object} - Metrics object
 */
function computeApproachMetrics(approach) {
    const history = store.getSelectorHistory();
    const entries = history.filter(e => e.approach === approach);
    
    const total = entries.length;
    const passed = entries.filter(e => e.result === 'passed').length;
    const failed = entries.filter(e => e.result === 'failed').length;
    const passRate = calcPassRate(passed, total);
    
    const failureBreakdown = classifier.getFailureBreakdown(approach);
    
    return {
        total_tests: total,
        passed,
        failed,
        pass_rate: passRate,
        avg_duration_ms: 0, // Would need duration data from entries
        failure_breakdown: failureBreakdown
    };
}

/**
 * Compute improvement metrics
 * @param {Object} traditional - Traditional metrics
 * @param {Object} intentBased - Intent-based metrics
 * @returns {Object} - Improvement metrics
 */
function computeImprovement(traditional, intentBased) {
    const passRateDelta = intentBased.pass_rate - traditional.pass_rate;
    const improvementFactor = traditional.pass_rate === 0 
        ? 0 
        : Math.round((intentBased.pass_rate / traditional.pass_rate) * 10) / 10;
    
    return {
        pass_rate_delta: Math.round(passRateDelta * 100) / 100,
        improvement_factor: improvementFactor,
        maintenance_time_saved_pct: Math.round(passRateDelta * 100)
    };
}

/**
 * Analyze selector types across all history
 * @returns {Object} - Selector type analysis
 */
function analyzeSelectorTypes() {
    const history = store.getSelectorHistory();
    const typeStats = {};
    
    for (const entry of history) {
        const type = detectSelectorType(entry.selector);
        if (!typeStats[type]) {
            typeStats[type] = { passed: 0, total: 0 };
        }
        typeStats[type].total++;
        if (entry.result === 'passed') {
            typeStats[type].passed++;
        }
    }
    
    const analysis = {};
    for (const [type, stats] of Object.entries(typeStats)) {
        const passRate = calcPassRate(stats.passed, stats.total);
        let recommendation = 'use_sparingly';
        if (passRate >= 0.9) recommendation = 'preferred';
        else if (passRate < 0.5) recommendation = 'avoid';
        
        analysis[type] = {
            pass_rate: passRate,
            count: stats.total,
            recommendation
        };
    }
    
    return analysis;
}

/**
 * Find top fragile selectors
 * @param {number} limit - Max number to return
 * @returns {Array} - Top fragile selectors
 */
function findTopFragileSelectors(limit = 5) {
    const history = store.getSelectorHistory();
    const selectorStats = {};
    
    for (const entry of history) {
        if (!selectorStats[entry.selector]) {
            selectorStats[entry.selector] = { passed: 0, failed: 0, errors: [] };
        }
        if (entry.result === 'passed') {
            selectorStats[entry.selector].passed++;
        } else {
            selectorStats[entry.selector].failed++;
            if (entry.error) selectorStats[entry.selector].errors.push(entry.error);
        }
    }
    
    const fragilityList = [];
    for (const [selector, stats] of Object.entries(selectorStats)) {
        const total = stats.passed + stats.failed;
        if (total > 0 && stats.failed > 0) {
            const failureRate = Math.round((stats.failed / total) * 100) / 100;
            fragilityList.push({
                selector,
                failure_rate: failureRate,
                reason: stats.errors[0] || 'Unknown reason',
                recommended_alternative: suggestAlternative(selector)
            });
        }
    }
    
    // Sort by failure rate descending
    fragilityList.sort((a, b) => b.failure_rate - a.failure_rate);
    
    return fragilityList.slice(0, limit);
}

/**
 * Suggest alternative selector
 * @param {string} selector - Original selector
 * @returns {string} - Suggested alternative
 */
function suggestAlternative(selector) {
    if (selector.startsWith('.') || selector.includes(' > ')) {
        return "getByRole('button')";
    }
    if (selector.startsWith('#')) {
        return "getByTestId('...')";
    }
    return 'Use intent-based selector';
}

/**
 * Compute all resilience metrics and write to store
 * @returns {Object} - Complete metrics object
 */
function computeAllMetrics() {
    const traditional = computeApproachMetrics('traditional');
    const intentBased = computeApproachMetrics('intent-based');
    const improvement = computeImprovement(traditional, intentBased);
    const topFragile = findTopFragileSelectors(5);
    const selectorTypeAnalysis = analyzeSelectorTypes();
    
    const metrics = {
        traditional,
        intent_based: intentBased,
        improvement,
        top_fragile_selectors: topFragile,
        selector_type_analysis: selectorTypeAnalysis
    };
    
    // Write to store
    store.updateResilienceMetrics(metrics);
    
    return metrics;
}

module.exports = {
    detectSelectorType,
    computeApproachMetrics,
    computeAllMetrics,
    analyzeSelectorTypes,
    findTopFragileSelectors
};
