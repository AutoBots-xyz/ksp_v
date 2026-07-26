# Flow & State

User journeys, system state machines, and client/server state for KSP Crime Intelligence.

---

## 1. Authentication & RBAC Flow

```
[Unauthenticated]
       │ open app
       ▼
  /login (Catalyst Auth)
       │ success
       ▼
  GET /api/v1/me
       │
       ├─ no profile / inactive → [Blocked: Contact Admin]
       │
       └─ active profile
              │
              ▼
       resolve role home
         SUPER_ADMIN → /admin or /hub
         SCRB_ANALYST → /hub
         DISTRICT_COMMAND → /district
         SHO / DATA_OPERATOR → /station
         IO → /cases?mine=1
         AUDITOR → /audit
         VIEWER → /hub (demo)
```

### Session state (client)

| Field | Source |
|-------|--------|
| session | Catalyst Auth |
| profile | `/me` |
| permissions | `/me.permissions` |
| scopeBanner | profile.district/unit names |

Logout → clear Query cache → Auth signOut → `/login`.

---

## 2. Map Drill-Down Flow

```
State view (SCRB)
  filters: date, crime head, gravity
       │
       ▼
 GET analytics/district-summary
       │
  click district
       ▼
 District view
 GET analytics/unit-summary?districtId=
       │
  click station
       ▼
 Station view
 GET cases?unitId= + hotspots
       │
  click incident / row
       ▼
 Case 360° drawer/page
```

**URL state example:**  
`/hub?dateFrom=2026-01-01&dateTo=2026-03-31&crimeHeadId=2&districtId=443&unitId=60006`

---

## 3. Case Investigation Flow (IO / SHO)

```
Case list (scoped)
  → open Case 360°
      → People tab (PII if allowed)
      → Legal tab
      → Location tab (nearby cases query)
      → Network tab
           → GET network/graph?seedType=CASE&seedId=
           → expand hops
      → optional Request Report
```

---

## 4. Network Analysis Flow (SCRB)

```
Search seed (person / crimeNo / unit)
  → graph render
  → select node
  → drawer details
  → "Open cases" / "Expand"
  → repeat offender profile if PERSON
```

---

## 5. Emerging Alert Flow

```
Cron anomaly_scan
  → compute spikes vs baseline
  → insert Alert OPEN
  → Signal → notify Mail/Push (SCRB, District of scope)
       │
User opens 🔔
  → GET /alerts
  → click → deep link filters on map
  → POST /alerts/{id}/ack
  → status ACK
```

### Alert state machine

```
OPEN → ACK → (optional) CLOSED
         ↘ auto-expire after policy N days → EXPIRED
```

---

## 6. Import Pipeline Flow

```
Admin uploads file → Stratus imports/raw
  → Signal
  → Circuit fir_import_pipeline
       PENDING → VALIDATING → LOADING → GRAPH → AGG → COMPLETE
                    │ fail              │ fail
                    └────→ FAILED (errors to Stratus)
```

---

## 7. Report Generation Flow

```
User POST /reports { template, filters }
  → ReportJob QUEUED
  → Circuit report_generate
       RUNNING → SmartBrowz → Stratus
  → COMPLETE with download URL
  → optional Mail
  → user GET /reports/{id}
```

States: `QUEUED | RUNNING | COMPLETE | FAILED`.

---

## 8. Predictive Score Flow

```
Weekly retrain job
  → features snapshot
  → Zia AutoML / QuickML
  → publish modelVersion
  → inference over scopes
  → upsert RiskScore
  → UI GET /ai/risk-scores
```

Stale state: if inference fails, UI shows last `computedAt` + badge `stale`.

---

## 9. Client UI State Machines

### Filter bar

```
idle → dirty (user edits) → applying (fetch) → idle | error
```

### Graph page

```
empty → loadingSeed → ready → expanding → ready | limitWarning | error
```

### Auth gate

```
unknown → checking → authenticated | anonymous | blocked
```

---

## 10. Server Request State (logging)

Each API request logs transition:

`received → auth_ok → authorized → executed → responded`  
or `received → auth_fail | forbidden | validated_fail | errored`.

---

## Related

- [FRONTEND.md](./FRONTEND.md)
- [BACKEND.md](./BACKEND.md)
- [EDGE_CASES.md](./EDGE_CASES.md)
