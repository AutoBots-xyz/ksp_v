"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheKey = cacheKey;
exports.hashFilters = hashFilters;
exports.cacheAside = cacheAside;
/**
 * Cache-aside helpers (Catalyst Cache).
 * Reference: BACKEND_ARCHITECTURE.md #5, CATALYST_INTEGRATION.md #7.
 *
 * Key pattern: {env}:{segment}:{scope}:{filterHash}
 */
const config_1 = require("./config");
function cacheKey(segment, scope, filterHash) {
    return `${(0, config_1.config)().env}:${segment}:${scope}:${filterHash}`;
}
/** Stable hash of a filter object for cache keys. */
function hashFilters(filters) {
    const json = JSON.stringify(filters, Object.keys(filters).sort());
    let h = 0;
    for (let i = 0; i < json.length; i++) {
        h = (h << 5) - h + json.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h).toString(36);
}
/** Get-or-compute helper implementing cache-aside. */
async function cacheAside(_cacheInstance, _key, _ttl, compute) {
    // STUB (2B): real Catalyst Cache get/set wired then.
    return compute();
}
//# sourceMappingURL=cache.js.map