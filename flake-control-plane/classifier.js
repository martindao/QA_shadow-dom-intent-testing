// flake-control-plane/classifier.js
// Classifies test failures by type: shadow_boundary, async_rendering, selector_fragility

const store = require('../runtime/store');

/**
 * Classify a single failure entry
 * @param {Object} entry - Selector history entry with result: 'failed'
 * @returns {string} - Classification: 'shadow_boundary', 'async_rendering', or 'selector_fragility'
 */
function classifyFailure(entry) {
    // Check for shadow boundary issues first
    if (entry.shadow_boundary_crossed || entry.shadow_depth > 0 || entry.shadow_depth_traversed > 0) {
        return 'shadow_boundary';
    }
    
    // Check for async rendering issues
    if (entry.error && (
        entry.error.includes('Timeout') ||
        entry.error.includes('waiting for') ||
        entry.error.includes('detached') ||
        entry.error.includes('stale')
    )) {
        return 'async_rendering';
    }
    
    // Default to selector fragility
    return 'selector_fragility';
}

/**
 * Get failure breakdown for a specific approach
 * @param {string} approach - 'traditional' or 'intent-based'
 * @returns {Object} - { shadow_boundary: number, async_rendering: number, selector_fragility: number }
 */
function getFailureBreakdown(approach) {
    const history = store.getSelectorHistory();
    const failures = history.filter(e => e.approach === approach && e.result === 'failed');
    
    const breakdown = {
        shadow_boundary: 0,
        async_rendering: 0,
        selector_fragility: 0
    };
    
    for (const entry of failures) {
        const category = classifyFailure(entry);
        breakdown[category]++;
    }
    
    return breakdown;
}

/**
 * Get all failures categorized
 * @returns {Object} - { traditional: {...}, intent_based: {...} }
 */
function classifyAllFailures() {
    return {
        traditional: getFailureBreakdown('traditional'),
        intent_based: getFailureBreakdown('intent-based')
    };
}

/**
 * Get detailed failure analysis with test names
 * @param {string} approach - 'traditional' or 'intent-based'
 * @returns {Array} - Array of { test, selector, category, error }
 */
function getDetailedFailures(approach) {
    const history = store.getSelectorHistory();
    const failures = history.filter(e => e.approach === approach && e.result === 'failed');
    
    return failures.map(entry => ({
        test: entry.test,
        selector: entry.selector,
        category: classifyFailure(entry),
        error: entry.error || null,
        shadow_boundary_crossed: entry.shadow_boundary_crossed || null,
        shadow_depth: entry.shadow_depth || entry.shadow_depth_traversed || 0
    }));
}

module.exports = {
    classifyFailure,
    getFailureBreakdown,
    classifyAllFailures,
    getDetailedFailures
};
