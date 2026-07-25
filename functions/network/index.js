"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = network;
/**
 * Network Function — graph queries, repeat offenders, person profiles.
 * Reference: IMPLEMENTATION2.md 3B, API_REFERENCE.md "Network".
 * Status: scaffold (3B implements BFS/DFS + scope).
 */
const logger_1 = require("../common/logger");
const errors_1 = require("../common/errors");
const auth_1 = require("../common/auth");
const datastore_1 = require("../common/datastore");
async function network(ctx) {
    const requestId = (0, logger_1.newRequestId)();
    try {
        await (0, auth_1.requireAuth)(ctx, requestId);
        const app = (0, datastore_1.catalyst)(ctx);
        const nosql = app.nosql();
        // Query NoSQL 'NetworkEdges' collection for graph relationships
        const collection = nosql.collection('NetworkEdges');
        const page = await collection.getPage({ maxRows: 100 });
        const rawEdges = page.data || [];
        // Transform NoSQL documents into Cytoscape-compatible elements
        const nodes = new Map();
        const edges = [];
        for (const doc of rawEdges) {
            if (!nodes.has(doc.SourceId)) {
                nodes.set(doc.SourceId, { data: { id: doc.SourceId, label: doc.SourceLabel || 'Unknown' } });
            }
            if (!nodes.has(doc.TargetId)) {
                nodes.set(doc.TargetId, { data: { id: doc.TargetId, label: doc.TargetLabel || 'Unknown' } });
            }
            edges.push({
                data: {
                    id: doc.ROWID,
                    source: doc.SourceId,
                    target: doc.TargetId,
                    label: doc.Relation || 'LINKED',
                }
            });
        }
        logger_1.logger.info('network.query', { requestId, route: '/network', edgesCount: edges.length });
        return (0, errors_1.ok)({
            elements: {
                nodes: Array.from(nodes.values()),
                edges: edges
            }
        });
    }
    catch (err) {
        const { status, body } = (0, errors_1.toResponse)(err, requestId);
        return { status, body };
    }
}
//# sourceMappingURL=index.js.map