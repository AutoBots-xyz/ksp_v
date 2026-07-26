# API Reference

Detailed reference for **KSP Crime Intelligence** REST API (`/api/v1`).  
Design overview: [API.md](./API.md).

**Auth:** Catalyst Authentication (via API Gateway).  
**RBAC:** Enforced per endpoint; scope applied automatically.

---

## Common

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` / session cookie | Yes* | Catalyst auth material as configured |
| `Content-Type` | POST/PATCH | `application/json` |
| `X-Request-Id` | No | Client correlation id |

\*Except optional public health.

### Pagination meta

```json
"meta": {
  "page": 1,
  "pageSize": 20,
  "total": 134
}
```

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_ROLE",
    "message": "Role SHO cannot access admin users.",
    "requestId": "a1b2c3"
  }
}
```

### Common error codes

| Code | HTTP |
|------|------|
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN_ROLE` | 403 |
| `FORBIDDEN_SCOPE` | 403 |
| `NOT_FOUND` | 404 |
| `VALIDATION_ERROR` | 400 |
| `CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `INTERNAL` | 500 |
| `DEPENDENCY_UNAVAILABLE` | 503 |

---

## GET /api/v1/health

**Auth:** optional  
**Roles:** any  

**Response 200**

```json
{ "success": true, "data": { "status": "ok", "env": "staging" } }
```

---

## GET /api/v1/me

**Roles:** all authenticated  

**Response 200** — see API.md example.  

**Errors:** `PROFILE_REQUIRED` if UserProfile missing.

---

## Masters

### GET /api/v1/masters/districts

**Roles:** authenticated  

**Query:** `active=true`  

**Response**

```json
{
  "success": true,
  "data": [
    { "districtId": 443, "districtName": "Bengaluru Urban", "stateId": 29 }
  ]
}
```

### GET /api/v1/masters/units

**Query:** `districtId`, `active`  

**Scope:** non-SCRB roles may only receive own unit/district units.

### GET /api/v1/masters/crime-heads

### GET /api/v1/masters/crime-sub-heads?crimeHeadId=

### GET /api/v1/masters/case-statuses

### GET /api/v1/masters/case-categories

### GET /api/v1/masters/acts

### GET /api/v1/masters/sections?actCode=

---

## Cases

### GET /api/v1/cases

**Roles:** SUPER_ADMIN, SCRB_ANALYST, DISTRICT_COMMAND, SHO, IO, DATA_OPERATOR, AUDITOR  

**Query parameters**

| Param | Type | Notes |
|-------|------|-------|
| `q` | string | CrimeNo, CaseNo, partial |
| `districtId` | int | SCRB/admin; ignored if out of scope |
| `unitId` | int | |
| `crimeHeadId` | int | |
| `crimeSubHeadId` | int | |
| `gravityOffenceId` | int | |
| `caseStatusId` | int | |
| `caseCategoryId` | int | |
| `dateFrom` | date | ISO date |
| `dateTo` | date | ISO date |
| `mine` | bool | IO: assigned only |
| `page` | int | default 1 |
| `pageSize` | int | default 20 max 100 |
| `sort` | string | e.g. `CrimeRegisteredDate:desc` |

**Response item (summary)**

```json
{
  "caseMasterId": 1,
  "crimeNo": "104430006202600001",
  "caseNo": "202600001",
  "crimeRegisteredDate": "2026-01-15",
  "policeStationId": 60006,
  "districtId": 443,
  "crimeMajorHeadName": "Crimes Against Body",
  "crimeMinorHeadName": "Murder",
  "gravity": "Heinous",
  "caseStatusName": "Under Investigation",
  "latitude": 12.97,
  "longitude": 77.59
}
```

### GET /api/v1/cases/{caseMasterId}

**Roles:** operational (scoped)  

**Response:** Case 360° aggregate:

- summary fields  
- optional nested counts  
- `briefFacts` if authorized  

### GET /api/v1/cases/by-crime-no/{crimeNo}

Lookup; same authz as get-by-id.

### GET /api/v1/cases/{id}/people

Returns complainants, victims, accused.  
PII fields null/masked if `!canSeePii`.

### GET /api/v1/cases/{id}/acts

Act-section association list ordered by ActOrderID, SectionOrderID.

### GET /api/v1/cases/{id}/arrests

ArrestSurrender events (+ accused link).

### GET /api/v1/cases/{id}/chargesheets

ChargesheetDetails list.

---

## Analytics

**Typical roles:** SUPER_ADMIN, SCRB_ANALYST, DISTRICT_COMMAND, SHO (unit-limited), AUDITOR (policy)

**Shared query:** `dateFrom`, `dateTo`, `crimeHeadId`, `crimeSubHeadId`, `gravityOffenceId`, `caseCategoryId`

### GET /api/v1/analytics/kpis

```json
{
  "success": true,
  "data": {
    "totalCases": 1204,
    "heinousCount": 88,
    "openInvestigations": 640,
    "chargesheeted": 310,
    "deltaTotalPct": 4.2,
    "asOf": "2026-07-24T02:00:00+05:30"
  }
}
```

### GET /api/v1/analytics/district-summary

Array of `{ districtId, districtName, count, ratePer100k? }`.

### GET /api/v1/analytics/unit-summary?districtId=

Station-level comparison rows.

### GET /api/v1/analytics/hotspots

```json
{
  "success": true,
  "data": [
    {
      "geohash": "tdr1v",
      "lat": 12.99,
      "lng": 77.60,
      "count": 17,
      "intensity": 0.82
    }
  ]
}
```

### GET /api/v1/analytics/trends

Time bucket series: `{ bucketStart, count }[]` with `groupBy=day|week`.

### GET /api/v1/analytics/time-of-day

Matrix: `{ hour: 0-23, dow: 0-6, count }[]`.

### GET /api/v1/analytics/emerging

Spike list — see API.md example (`ratio`, `severity`).

---

## Network

**Roles:** SUPER_ADMIN, SCRB_ANALYST, DISTRICT_COMMAND, SHO, IO  

### GET /api/v1/network/graph

| Param | Required | Description |
|-------|----------|-------------|
| `seedType` | yes | `CASE` \| `PERSON` \| `UNIT` \| `LOCATION` |
| `seedId` | yes | id / personKey |
| `hops` | no | default 1, max `GRAPH_MAX_HOPS` |

**Response**

```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "CASE:1", "type": "CASE", "label": "10443…0001", "meta": {} }
    ],
    "edges": [
      { "id": "e1", "source": "PERSON:A-9", "target": "CASE:1", "rel": "ACCUSED_IN", "weight": 1 }
    ],
    "truncated": false
  }
}
```

### GET /api/v1/network/repeat-offenders

**Query:** `districtId`, `limit`  

Ranked persons with multi-case counts (scoped).

### GET /api/v1/network/persons/{personKey}

Profile + linked cases list (scoped).

---

## AI

**Roles:** SUPER_ADMIN, SCRB_ANALYST, DISTRICT_COMMAND (+ optional others)

### GET /api/v1/ai/risk-scores

**Query:** `scopeType=DISTRICT|UNIT`, `limit`

```json
{
  "success": true,
  "data": [
    {
      "scopeType": "UNIT",
      "scopeId": 60006,
      "scopeName": "Sample PS",
      "score": 0.81,
      "modelVersion": "risk-v3",
      "computedAt": "2026-07-20T03:00:00+05:30",
      "stale": false
    }
  ]
}
```

### GET /api/v1/ai/anomalies

Open anomaly list with explanations.

### GET /api/v1/ai/models/current

```json
{
  "success": true,
  "data": {
    "modelVersion": "risk-v3",
    "trainedAt": "2026-07-20T03:00:00+05:30",
    "featureSet": "district-week-v2",
    "notes": "Tabular AutoML on aggregates"
  }
}
```

---

## Alerts

### GET /api/v1/alerts

**Query:** `status=OPEN|ACK`, `page`

### POST /api/v1/alerts/{id}/ack

**Body:** optional `{ "note": "Reviewed" }`  

**Response:** updated alert.

---

## Reports

### POST /api/v1/reports

**Roles:** export-capable  

**Body**

```json
{
  "template": "DISTRICT_WEEKLY",
  "filters": {
    "districtId": 443,
    "dateFrom": "2026-07-01",
    "dateTo": "2026-07-24"
  }
}
```

**Templates:** `DISTRICT_WEEKLY` | `HOTSPOT_BRIEF` | `CASE_NETWORK_PACK`

**Response:** `{ jobId, status: "QUEUED" }`

### GET /api/v1/reports/{jobId}

Status + `downloadUrl` when COMPLETE.

### GET /api/v1/reports

History list for current user/scope.

---

## Admin

**Roles:** SUPER_ADMIN unless noted

### GET /api/v1/admin/users

List UserProfiles + auth linkage metadata.

### PATCH /api/v1/admin/users/{userProfileId}

```json
{
  "role": "SHO",
  "districtId": 443,
  "unitId": 60006,
  "employeeId": 10042,
  "active": true
}
```

Audited.

### GET /api/v1/admin/jobs

Import/report jobs.

### POST /api/v1/admin/import

```json
{
  "stratusPath": "imports/raw/batch-2026-07-24.csv",
  "mode": "UPSERT"
}
```

### GET /api/v1/admin/audit

**Roles:** SUPER_ADMIN, AUDITOR  

**Query:** `userId`, `action`, `dateFrom`, `dateTo`, `page`

---

## Rate limits

Gateway defaults apply; clients should backoff on `429` with `Retry-After` if present.

---

## Changelog of API

API breaking changes recorded in [CHANGELOG.md](./CHANGELOG.md).

---

## Related

- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
- [BACKEND.md](./BACKEND.md)
