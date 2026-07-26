# API Design

REST API design for KSP Crime Intelligence, fronted by **Catalyst API Gateway**.

---

## 1. Conventions

| Item | Convention |
|------|------------|
| Base path | `/api/v1` |
| Format | JSON UTF-8 |
| Auth | Catalyst Authentication bearer/session (Gateway-validated) |
| Time | ISO-8601; business default timezone Asia/Kolkata |
| Pagination | `page` (1-based), `pageSize` (default 20, max 100) |
| Sorting | `sort=field:asc\|desc` |
| Errors | envelope with `code`, `message`, `requestId` |
| Success list | `{ success, data, meta: { page, pageSize, total } }` |
| Success item | `{ success, data }` |

---

## 2. Authentication & RBAC

1. Client logs in via Catalyst Auth.
2. Client calls APIs with auth credentials configured in Gateway.
3. Each Function loads `UserProfile` and enforces role + scope.
4. Optional custom header `X-Request-Id` echoed in logs.

### Role codes

`SUPER_ADMIN` · `SCRB_ANALYST` · `DISTRICT_COMMAND` · `SHO` · `IO` · `DATA_OPERATOR` · `AUDITOR` · `VIEWER`

---

## 3. Resource Groups

### 3.1 Session

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/me` | all auth | Profile, role, scope, permissions flags |

### 3.2 Masters

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/masters/districts` | auth | District list (scoped if needed) |
| GET | `/api/v1/masters/units` | auth | Police stations/units |
| GET | `/api/v1/masters/crime-heads` | auth | Major heads |
| GET | `/api/v1/masters/crime-sub-heads` | auth | Sub-heads |
| GET | `/api/v1/masters/case-statuses` | auth | Status list |
| GET | `/api/v1/masters/case-categories` | auth | FIR/UDR/PAR… |
| GET | `/api/v1/masters/acts` | auth | Acts |
| GET | `/api/v1/masters/sections` | auth | Sections by act |

### 3.3 Cases

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/cases` | operational | Search/list scoped cases |
| GET | `/api/v1/cases/{caseMasterId}` | operational | Case 360° |
| GET | `/api/v1/cases/by-crime-no/{crimeNo}` | operational | Lookup by CrimeNo |
| GET | `/api/v1/cases/{id}/people` | operational | Complainant/victim/accused |
| GET | `/api/v1/cases/{id}/acts` | operational | Act-section list |
| GET | `/api/v1/cases/{id}/arrests` | operational | Arrest/surrender events |
| GET | `/api/v1/cases/{id}/chargesheets` | operational | Chargesheet details |

**Query params (list):** `q`, `districtId`, `unitId`, `crimeHeadId`, `crimeSubHeadId`, `gravityOffenceId`, `caseStatusId`, `caseCategoryId`, `dateFrom`, `dateTo`, `page`, `pageSize`.

Unauthorized scope params are ignored or 403 if explicit cross-scope requested.

### 3.4 Analytics

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/analytics/kpis` | dash roles | Top KPI cards |
| GET | `/api/v1/analytics/district-summary` | SCRB+ | Choropleth series |
| GET | `/api/v1/analytics/unit-summary` | district+ | Station comparison |
| GET | `/api/v1/analytics/hotspots` | dash roles | Geo clusters |
| GET | `/api/v1/analytics/trends` | dash roles | Time series |
| GET | `/api/v1/analytics/time-of-day` | dash roles | Hour/day matrix |
| GET | `/api/v1/analytics/emerging` | dash roles | Spike list |

### 3.5 Network

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/network/graph` | network roles | `seedType`, `seedId`, `hops` |
| GET | `/api/v1/network/repeat-offenders` | SCRB/district | Ranked list scoped |
| GET | `/api/v1/network/persons/{personKey}` | network roles | Profile + cases |

### 3.6 AI / Predictions

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/ai/risk-scores` | predict roles | Ranked scopes |
| GET | `/api/v1/ai/anomalies` | predict roles | Open anomalies |
| GET | `/api/v1/ai/models/current` | predict roles | modelVersion metadata |

### 3.7 Alerts

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/alerts` | dash roles | List |
| POST | `/api/v1/alerts/{id}/ack` | dash roles | Acknowledge |

### 3.8 Reports

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/api/v1/reports` | export roles | Enqueue report |
| GET | `/api/v1/reports/{jobId}` | export roles | Status + download URL |
| GET | `/api/v1/reports` | export roles | History |

### 3.9 Admin

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/v1/admin/users` | SUPER_ADMIN | List profiles |
| PATCH | `/api/v1/admin/users/{id}` | SUPER_ADMIN | Role/unit mapping |
| GET | `/api/v1/admin/jobs` | SUPER_ADMIN | Ingest/report jobs |
| POST | `/api/v1/admin/import` | SUPER_ADMIN | Start import |
| GET | `/api/v1/admin/audit` | SUPER_ADMIN, AUDITOR | Audit search |

---

## 4. Example: GET /me

```json
{
  "success": true,
  "data": {
    "userId": "cat_user_123",
    "displayName": "Inspector Rao",
    "role": "SHO",
    "employeeId": 10042,
    "districtId": 443,
    "districtName": "Bengaluru Urban",
    "unitId": 60006,
    "unitName": "Sample PS",
    "permissions": {
      "canExport": true,
      "canSeePii": true,
      "canAdmin": false,
      "canPredict": false
    }
  }
}
```

---

## 5. Example: Emerging trends

```json
{
  "success": true,
  "data": [
    {
      "scopeType": "DISTRICT",
      "scopeId": 443,
      "scopeName": "Bengaluru Urban",
      "crimeSubHeadId": 12,
      "crimeSubHeadName": "Burglary",
      "currentCount": 48,
      "baselineAvg": 22,
      "ratio": 2.18,
      "severity": "HIGH"
    }
  ]
}
```

---

## 6. Gateway Policies

| Policy | Setting (guideline) |
|--------|---------------------|
| Auth | Required on `/api/v1/*` except health |
| Rate limit | Per-user / per-IP moderate (e.g. 100 req/min) |
| Body size | Small JSON; large files via Stratus upload flow |
| CORS | Catalyst app origins + approved domains |
| Methods | GET/POST/PATCH only as defined |

---

## 7. Versioning

- URL version `/v1`.
- Breaking changes → `/v2`; document in CHANGELOG.
- Additive fields are non-breaking.

---

## 8. Related

- [API_REFERENCE.md](./API_REFERENCE.md) — detailed params & schemas
- [SECURITY.md](./SECURITY.md)
- [BACKEND.md](./BACKEND.md)
