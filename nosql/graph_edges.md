# NoSQL Collections

Reference: DATABASE_DESIGN.md #5, BACKEND_ARCHITECTURE.md #7.

## graph_edges

Criminal network edges (source of truth: relational Accused/Victim/CaseMaster; serving: NoSQL).

```json
{
  "edgeId": "uuid",
  "srcType": "PERSON",
  "srcId": "A-123",
  "dstType": "CASE",
  "dstId": "CM-9",
  "rel": "ACCUSED_IN",
  "weight": 1,
  "districtId": 443,
  "updatedAt": "2026-07-24T12:00:00+05:30"
}
```

Edge types (v1 subset): `ACCUSED_IN`, `VICTIM_IN`, `COMPLAINANT_IN`, `CO_ACCUSED`, `SHARED_SECTION`, `SAME_LOCATION_PERIOD`.

Indexed by `srcId` / `dstId` for BFS/DFS traversal (capped at `GRAPH_MAX_HOPS=2`, `GRAPH_MAX_NODES=300`).

## import_errors

Per-row import failures (consumed by Stratus error CSV export).

## user_prefs

UI preferences (optional, v1 not required).
