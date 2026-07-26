# Catalyst Integration

How application code integrates with Zoho Catalyst services for KSP Crime Intelligence.

---

## 1. Project Bootstrap

```bash
npm i -g zcatalyst-cli
catalyst login
catalyst init
# select: functions, client (web), optionally appsail
```

Configure `catalyst.json` with:

- Function entries under `functions/`
- Client path `apps/web`
- AppSail path if used
- Pipeline hooks as documented in CICD_PIPELINE.md

---

## 2. Authentication Integration

### Web client

1. Initialize Catalyst Auth in the SPA.
2. Login / logout / password reset via Auth APIs or hosted pages.
3. On app boot: if session exists → `GET /api/v1/me`.
4. If no `UserProfile` or `active=false` → show “Contact admin” screen.

### Functions

```text
Request enters via API Gateway (authenticated)
  → SDK: get current user id
  → Data Store: UserProfile by catalystUserId
  → attach Scope to request context
```

### Role assignment

- Not only Auth “roles” if limited — use **Data Store UserProfile.role** as source of truth for app RBAC.
- Optional: mirror role name in Auth custom attributes for Gateway rules.

---

## 3. API Gateway Integration

| Step | Action |
|------|--------|
| 1 | Create routes `/api/v1/**` → target Functions |
| 2 | Enable authentication on routes |
| 3 | Configure throttling per environment |
| 4 | Set CORS origins to Slate/Web Client domains |
| 5 | Map custom domain paths if needed |

Health route (optional): `/api/v1/health` without auth for uptime checks (no data).

---

## 4. Data Store Integration

### Tables (logical)

See [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) for full FIR ER + app tables.

### Access pattern

```text
repo.listCases(scope, filters, page)
  → build query with mandatory scope predicates
  → Data Store query
  → map to DTO (mask PII if !canSeePii)
```

### Indexes (design for)

- `CrimeNo` unique  
- `CaseMaster`: PoliceStationID + CrimeRegisteredDate  
- `CaseMaster`: DistrictID + CrimeRegisteredDate (if denormalized)  
- `UserProfile`: catalystUserId unique  
- `AggUnitDay`: unitId + date  

---

## 5. NoSQL Integration

Use for:

- Graph edges bulk read by `srcId` / `dstId`
- Temporary import error documents
- Flexible alert payloads

Do **not** duplicate full CaseMaster as sole truth in NoSQL.

---

## 6. Stratus Integration

| Object prefix | Content |
|---------------|---------|
| `imports/raw/` | Uploaded FIR extracts |
| `imports/errors/` | Row error CSVs |
| `reports/` | Generated PDFs |
| `geo/` | Optional GeoJSON hosting |
| `ml/features/` | Feature snapshots |

Functions generate time-limited download URLs for authorized roles only.

---

## 7. Cache Integration

```text
key = f"{env}:kpi:{scope}:{filterHash}"
get → if miss → compute from Agg tables → set TTL → return
```

On Signal `aggregates.refreshed` → delete key patterns for affected districts.

---

## 8. Signals + Event Functions

| Event | Handler | Effect |
|-------|---------|--------|
| Stratus object created under imports/raw | start Circuit / Job | ingest |
| Data Store CaseMaster insert/update | mark dirty aggregate | recompute |
| UserProfile role change | invalidate `me:{userId}` cache | force re-fetch |
| Alert inserted | push/email dispatcher | notify |

---

## 9. Circuits Integration

### Circuit: `fir_import_pipeline`

```
Start
 → Download Stratus object
 → Parse & validate (Function)
 → Batch upsert Data Store (Function)
 → Rebuild graph edges for touched persons (Function)
 → Refresh aggregates (Function)
 → Mail summary to admin
 → End
```

### Circuit: `report_generate`

```
Start
 → Load template data (Function, scoped)
 → SmartBrowz render PDF
 → Put Stratus
 → Update ReportJob
 → Optional Mail
 → End
```

---

## 10. Cron / Job Scheduling

| Name | Cron (IST) | Function |
|------|------------|----------|
| nightly_aggregates | `30 1 * * *` | rebuild Agg* |
| cache_warm | `0 2 * * *` | prefill KPIs |
| anomaly_scan | `0 * * * *` | emerging + anomalies |
| weekly_retrain | `0 3 * * 0` | QuickML/Zia pipeline |

---

## 11. QuickML / Zia AutoML Integration

1. Export training frame (district-week features) to Stratus or dataset accepted by AutoML.
2. Train tabular model (risk label = future spike / high volume).
3. Deploy inference endpoint / invoke from Function `ai`.
4. Persist scores to `RiskScore` with `modelVersion`.

For RAG (SOPs): store PDFs in Stratus → QuickML knowledge base → Function Q&A restricted to SCRB+.

---

## 12. SmartBrowz Integration

- Input: HTML report template URL or generated HTML from Function.
- Output: PDF bytes → Stratus `reports/{jobId}.pdf`.
- Used for District Weekly & Network Brief.

---

## 13. Mail & Push

| Channel | Use |
|---------|-----|
| Mail | Import summaries, report ready, critical spikes for SCRB |
| Push | Near-real-time red-zone alerts for subscribed roles |

Deep link in notification: `/hub?alertId=` or district board.

---

## 14. AppSail Integration (optional)

Package Docker image when:

- Python ML feature engineering exceeds Function timeout
- Large CSV transform memory needs

Still invoked from Cron/Circuit; results written to Data Store/Stratus.

---

## 15. Connections

Use Catalyst Connections for OAuth to Zoho services if the solution sends data to Zoho CRM/Analytics later. Not required for core FIR intelligence path.

---

## 16. Local Dev Integration

```bash
catalyst serve
# serves client + functions with local emulation where supported
```

Point web env `NEXT_PUBLIC_API_BASE` to local Gateway/serve URL.  
See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md).

---

## 17. Related

- [CATALYST_SERVICES.md](./CATALYST_SERVICES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [CONFIGURATION.md](./CONFIGURATION.md)
