# Backend

Domain backend for the KSP Crime Intelligence platform on **Catalyst Serverless Functions** (and **AppSail** where required).

---

## 1. Responsibilities

- Authenticate requests (Catalyst Auth) and authorize by **role + geographic scope**.
- Serve FIR-centric case and master data from **Data Store**.
- Compute and serve analytics aggregates (hotspots, trends).
- Build network/link-analysis payloads.
- Invoke **QuickML / Zia AutoML** for risk & anomaly scores.
- Orchestrate ingest, reports, and alerts via Signals, Circuits, Cron, Mail, Push.
- Write audit logs for sensitive access.

---

## 2. Service Modules

| Module | Function folder | Description |
|--------|-----------------|-------------|
| Auth context | `auth_context` | `/me` profile: role, unit, district, employee |
| Cases | `cases` | Search, get Case 360°, limited updates |
| Masters | `masters` | District, Unit, CrimeHead, Act, Section, status… |
| Analytics | `analytics` | KPIs, choropleth series, hotspots, trends |
| Network | `network` | Graph seed expand, repeat offender profile |
| AI | `ai` | Risk scores, anomaly list, model meta |
| Alerts | `alerts` | List/ack alerts; rule evaluation helper |
| Reports | `reports` | Enqueue SmartBrowz report jobs |
| Admin | `admin` | UserProfile role mapping, config |
| Ingest | `ingest` | CSV/JSON FIR load |
| Events | `events/*` | Signal handlers |

---

## 3. Cross-Cutting Middleware

Every protected handler:

```
1. Parse request
2. requireAuth()           → Catalyst user
3. loadUserProfile()       → role, districtId, unitId, employeeId
4. requireRoles([...])     → 403 if not allowed
5. applyScope(query)       → inject DistrictID / PoliceStationID filters
6. business logic
7. auditIfSensitive()
8. JSON response
```

Shared implementation: `functions/common/auth.ts`.

---

## 4. Domain Rules (v1)

### Cases

- Unique business key: `CrimeNo` (structured per ER diagram).
- `CaseNo` = last 9 digits semantics per station/year/category.
- Reads always scope-filtered except SCRB/SUPER_ADMIN.
- IO: cases where `PolicePersonID = employeeId` OR same `PoliceStationID` (configurable).
- Mutations (if enabled): DATA_OPERATOR / SHO limited fields; full legal record assumed from upstream CCTNS import.

### Analytics

- Prefer pre-aggregated tables (`AggDistrictDay`, `AggUnitDay`) filled by Cron.
- On cache miss: compute → store Cache with TTL → return.
- Hotspots: grid/bin aggregation on lat/long for period filters.

### Network

- Nodes materialized from Accused, Victim, Complainant, Case, Unit, Location geohash.
- Edges: ACCUSED_IN, VICTIM_IN, COMPLAINANT_IN, CO_ACCUSED, SAME_UNIT_PERIOD, SHARED_SECTION.
- Repeat offender: person key heuristic → list of CaseMasterIDs.

### AI

- Input features from aggregate tables + optional socio-economic overlay.
- Output stored in `RiskScore` table: scopeType, scopeId, score, modelVersion, computedAt.
- Never present score as legal proof.

### Alerts

- Rule: metric &gt; baseline * threshold for crime head + region.
- Persist `Alert` rows; notify via Mail/Push to role inboxes.

---

## 5. Catalyst SDK Usage (Node)

| Need | SDK / service |
|------|----------------|
| Current user | Authentication |
| Tables | Data Store |
| Graph docs | NoSQL |
| Files | Stratus |
| Hot KPIs | Cache |
| Predict | QuickML / Zia |
| Email | Mail |
| Push | Push Notifications |

Patterns: [CATALYST_INTEGRATION.md](./CATALYST_INTEGRATION.md).

---

## 6. Error Model

| HTTP | When |
|------|------|
| 400 | Validation (Zod) |
| 401 | Missing/invalid session |
| 403 | Role or scope violation |
| 404 | Entity not found **in scope** (do not leak existence cross-scope) |
| 409 | Duplicate CrimeNo on ingest |
| 429 | Gateway throttle |
| 500 | Unexpected; log `requestId` |
| 503 | Dependency (ML/cache) degraded — return partial if safe |

Response shape:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_SCOPE",
    "message": "You cannot access this district.",
    "requestId": "uuid"
  }
}
```

---

## 7. Ingest Backend

1. Upload file → Stratus.
2. Start Circuit or Job: parse → validate rows → upsert by CrimeNo.
3. Emit Signal `import.completed`.
4. Event Function refreshes aggregates for touched districts.
5. Admin UI shows job status (success/fail counts).

---

## 8. Reporting Backend

1. `POST /reports` with template + filters (scoped).
2. Function writes `ReportJob` row + invokes SmartBrowz / Circuit.
3. Output PDF to Stratus; signed/download URL returned when ready.
4. Optional Mail to requester.

---

## 9. Background Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Nightly aggregates | 01:30 IST | Rebuild Agg* tables |
| Cache warm | 02:00 IST | Prefill SCRB KPIs |
| Anomaly scan | hourly | Write alerts |
| Weekly retrain | Sun 03:00 | Zia AutoML / QuickML pipeline |
| Audit retention | monthly | Archive old logs policy |

---

## 10. Related

- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
