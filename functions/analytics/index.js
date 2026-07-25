"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = analytics;
/**
 * Analytics Function — KPIs, district/unit summaries, trends, hotspots, emerging.
 * Reference: IMPLEMENTATION2.md 2B/4B, API_REFERENCE.md "Analytics".
 * Status: scaffold (2B implements aggregates).
 */
const logger_1 = require("../common/logger");
const errors_1 = require("../common/errors");
const auth_1 = require("../common/auth");
async function analytics(ctx) {
    const requestId = (0, logger_1.newRequestId)();
    try {
        await (0, auth_1.requireAuth)(ctx, requestId);
        logger_1.logger.info('analytics.stub', { requestId, route: '/analytics' });
        return (0, errors_1.ok)({ message: 'analytics endpoint scaffolded — implemented in sub-phase 2B' });
    }
    catch (err) {
        const { status, body } = (0, errors_1.toResponse)(err, requestId);
        return { status, body };
    }
}
//# sourceMappingURL=index.js.map