# Backend Architecture

Structural design of server-side components on Zoho Catalyst.

---

## 1. Deployment Units

| Unit | Catalyst | Role |
|------|----------|------|
| Advanced I/O or Basic I/O Functions | Serverless Functions | Request/response APIs |
| Event Functions | Signals | React to DB/file/user events |
| Circuits | Circuits | Multi-step long workflows |
| Cron / Jobs | Cron, Job Scheduling | Schedules |
| AppSail service | AppSail | Heavy ETL, long ML batch |
| API Gateway | API Gateway | Public HTTPS surface |

---

## 2. Request Path

```
Client
  → Domain Mapping (SSL)
  → API Gateway (auth, throttle, route)
  → Function handler
       → common/auth (profile + RBAC)
       → domain service
       → Data Store / NoSQL / Cache / QuickML / Stratus
  → JSON response
```

---

## 3. Layering Inside Functions

```
handler.ts
  ├── http (parse, status)
  ├── authz (roles, scope)
  ├── services/ (pure-ish domain)
  ├── repos/ (Data Store access)
  └── integrations/ (QuickML, Mail, SmartBrowz)
```

Keep handlers thin; put query building in repos for testability.

---

## 4. Scope Filter Architecture

```ts
type Scope = {
  role: Role;
  districtId?: number;
  unitId?: number;
  employeeId?: number;
};

function caseScopeFilter(scope: Scope): Filter {
  switch (scope.role) {
    case 'SUPER_ADMIN':
    case 'SCRB_ANALYST':
      return {}; // state-wide
    case 'DISTRICT_COMMAND':
      return { DistrictID: scope.districtId }; // via Unit join or denormalized
    case 'SHO':
    case 'DATA_OPERATOR':
      return { PoliceStationID: scope.unitId };
    case 'IO':
      return { OR: [{ PolicePersonID: scope.employeeId }, { PoliceStationID: scope.unitId }] };
    case 'AUDITOR':
      return auditorConfiguredScope(scope);
    case 'VIEWER':
      return { IsDemo: true };
  }
}
```

**Denormalization recommendation:** store `DistrictID` on CaseMaster (or maintain view table) for efficient district filters without multi-hop joins on every request.

---

## 5. Caching Architecture

| Key pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `kpi:state:{hash(filters)}` | 5–15 min | Cron rebuild / ingest signal |
| `kpi:district:{id}:{hash}` | 5 min | same |
| `masters:all` | 1 h | admin master update |
| `me:{userId}` | 5 min | role change |

Cache-aside only; never sole source of truth for legal case rows.

---

## 6. Event-Driven Architecture

```
Data Store CaseMaster write
    → Signal
    → Event Function: touch Agg dirty flags
    → (async) recompute unit-day aggregate

Stratus import upload
    → Signal
    → Circuit fir_import_pipeline
         validate → load → graph refresh → notify admin
```

Circuits for steps that need branching, retries, and parallel fan-out.

---

## 7. Network Data Model (backend)

**Relational source of truth:** Accused, Victim, CaseMaster, Unit.

**Serving model (NoSQL):**

```json
{
  "edgeId": "...",
  "srcType": "PERSON",
  "srcId": "A-123",
  "dstType": "CASE",
  "dstId": "CM-9",
  "rel": "ACCUSED_IN",
  "weight": 1,
  "districtId": 443,
  "updatedAt": "..."
}
```

Graph query Function: BFS/DFS limited hops with scope filter on edges.

---

## 8. AI Integration Architecture

```
Feature builder (Cron/AppSail)
  → feature rows in Data Store / Stratus
  → Zia AutoML / QuickML train
  → model registry meta in Data Store
  → inference Function ai/risk
  → RiskScore table
  → Analytics API reads scores
```

Failures: return last known scores + `stale: true`.

---

## 9. Multi-Environment

| Concern | Pattern |
|---------|---------|
| Secrets | Catalyst env config per environment |
| Table names | Same logical names per env project |
| Gateway URLs | Env-specific |
| CORS origins | Env-specific allowlist |

---

## 10. Observability

- Structured log line per request: `requestId, userId, role, route, latencyMs, status`.
- Alert on Function error rate via operational practice (Catalyst logs).
- Business metrics: import fail count, alert volume.

---

## 11. Resilience

| Failure | Strategy |
|---------|----------|
| Cache down | Bypass to Data Store |
| ML down | Serve last RiskScore |
| Partial ingest | Row-level error file to Stratus |
| Timeout risk | Move work to Job/Circuit/AppSail |

---

## Related

- [BACKEND.md](./BACKEND.md)
- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)
- [CATALYST_INTEGRATION.md](./CATALYST_INTEGRATION.md)
