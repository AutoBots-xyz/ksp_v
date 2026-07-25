"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = health;
/**
 * Health Function — GET /api/v1/health
 * Public (auth:false). Returns service status + environment.
 * Reference: IMPLEMENTATION2.md 0B/0C, API_REFERENCE.md "GET /api/v1/health".
 */
const config_1 = require("../common/config");
const logger_1 = require("../common/logger");
const errors_1 = require("../common/errors");
async function health(_ctx) {
    const requestId = (0, logger_1.newRequestId)();
    const cfg = (0, config_1.config)();
    logger_1.logger.info('health.check', { requestId, route: '/health' });
    return (0, errors_1.ok)({ status: 'ok', env: cfg.env });
}
//# sourceMappingURL=index.js.map