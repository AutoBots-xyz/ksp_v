# Implementation Plan 2 — Phase-Wise Build (Subdivided)

Detailed, execution-ready plan for the **KSP Crime Intelligence & Analytical Platform**.  
This supersedes the high-level timeline in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) by **splitting large phases into sub-phases** with clear dependencies, tasks, owners streams, and exit gates.

**Sources:** all project docs (`README`, architecture, Catalyst, FIR ER, API, frontend, security, testing).

**Non-negotiables**

1. Deploy **only on Zoho Catalyst** (mandatory).
2. Prefer Catalyst services for every capability (`CATALYST_SERVICES.md`).
3. **Role-based login** end-to-end (Catalyst Authentication + `UserProfile` + API scope filters).

---

## How to use this document

| Symbol | Meaning |
|--------|---------|
| **Gate** | Must pass before next sub-phase starts (hard dependency) |
| **Soft parallel** | Can overlap with another sub-phase if staffing allows |
| **DoD** | Definition of Done for that sub-phase |
| **Stream** | Platform · Data · Backend · Frontend · AI · DevOps |

**Suggested calendar:** ~12–14 weeks for full v1 (buffer included). Compress only by parallelizing Soft parallel items, not by skipping Gates.

### Checkpointing & Execution Tracking Protocol

- **Checkpoint Status ([PROGRESS.md](./PROGRESS.md))**: At every phase gate (0C, 1F, 2F, 3D, 4E, 5E), update `PROGRESS.md` to record completion percentages, active milestone state, completed tasks, and exact resume instructions.
- **Activity Log ([LOG.md](./LOG.md))**: Chronologically log every major architectural milestone, schema modification, tool installation/update, graph re-indexing, or deployment with timestamp and execution context.


---

## Master phase map

```
P0 Foundation
 ├── 0A Catalyst project & services
 ├── 0B Monorepo scaffold
 └── 0C Auth shell + Pipeline skeleton
         │
         ▼
P1 Data & RBAC core
 ├── 1A FIR + app schema (Data Store)
 ├── 1B UserProfile + authz middleware
 ├── 1C Masters APIs
 ├── 1D Cases APIs (search + 360°)
 ├── 1E Synthetic seed + CSV import v1
 └── 1F RBAC test matrix (blocking)
         │
         ▼
P2 Intelligence platform (UI + analytics)
 ├── 2A Web shell, login, RBAC routing
 ├── 2B Aggregate tables + analytics APIs
 ├── 2C Map & filter system
 ├── 2D Role home dashboards
 ├── 2E Case list + Case 360° UI
 └── 2F Cache warm + performance pass
         │
         ▼
P3 Network & link analysis
 ├── 3A Graph model + edge builder
 ├── 3B Network APIs
 ├── 3C Network UI
 └── 3D Repeat offender + associations
         │
         ▼
P4 AI, trends, alerts
 ├── 4A Feature tables + socio overlay
 ├── 4B Spike / emerging trends
 ├── 4C QuickML / Zia risk scores
 ├── 4D Alerts + Mail/Push
 └── 4E Predictive UI
         │
         ▼
P5 Reports, ops, production
 ├── 5A Cron / Circuits / jobs
 ├── 5B SmartBrowz reports
 ├── 5C Admin + Audit UI
 ├── 5D Security hardening
 └── 5E Staging UAT + Production go-live
```

| Phase | Sub-phases | Est. duration | Demo milestone |
|-------|------------|---------------|----------------|
| **P0** | 0A–0C | 1–1.5 weeks | Empty app deploys; login works |
| **P1** | 1A–1F | 2.5–3.5 weeks | Scoped case API; M1 RBAC demo |
| **P2** | 2A–2F | 3–3.5 weeks | M2 map drill-down |
| **P3** | 3A–3D | 2 weeks | M3 network graph |
| **P4** | 4A–4E | 2–2.5 weeks | M4 red-zone / risk |
| **P5** | 5A–5E | 1.5–2 weeks | M5 full path + prod |

---

# PHASE 0 — Foundation

**Outcome:** Catalyst project live, repo scaffolded, login possible, CI can deploy an empty shell.

---

## Sub-phase 0A — Catalyst project & services

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Platform, DevOps |
| **Depends on** | Zoho account |
| **Catalyst** | Project, all service enablement, Domain Mappings (dev/staging) |

### Tasks

- [ ] Create Catalyst project `ksp-crime-intelligence`.
- [ ] Create environments: **Development**, **Staging**, **Production**.
- [ ] Enable services checklist:
  - [ ] Authentication
  - [ ] API Gateway
  - [ ] Functions
  - [ ] Data Store
  - [ ] NoSQL
  - [ ] Stratus
  - [ ] Cache
  - [ ] Slate **or** Web Client Hosting
  - [ ] Signals
  - [ ] Circuits
  - [ ] Cron / Job Scheduling
  - [ ] Mail
  - [ ] Push Notifications
  - [ ] QuickML
  - [ ] Zia AutoML
  - [ ] SmartBrowz
  - [ ] Pipelines
  - [ ] AppSail (enable now even if used later)
  - [ ] Connections (optional for later)
- [ ] Configure Domain Mappings for dev/staging hostnames + SSL.
- [ ] Document project IDs / env URLs in team notes (not secrets in git).

### DoD / Gate 0A

- [ ] All required services show **Enabled** in console.
- [ ] At least Development environment usable via CLI (`catalyst login`, project linked).

---

## Sub-phase 0B — Monorepo scaffold

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend, Frontend, DevOps |
| **Depends on** | 0A (soft: can start folder layout offline) |
| **Catalyst** | `catalyst.json`, Functions stub, Client stub |

### Tasks

- [ ] Create root workspace: `package.json`, `.gitignore`, `.env.example` (align `CONFIGURATION.md`).
- [ ] Scaffold `apps/web` (Next.js or Vite+React + TypeScript + Tailwind).
- [ ] Scaffold `functions/` with folders from `FOLDER_STRUCTURE.md`:
  - `common/`, `auth_context/`, `cases/`, `masters/`, `analytics/`, `network/`, `ai/`, `alerts/`, `reports/`, `admin/`, `ingest/`, `events/`
- [ ] Add stub health Function: `GET` → `{ status: "ok" }`.
- [ ] Add empty `datastore/schema/`, `scripts/`, `tests/` trees.
- [ ] Wire `catalyst.json` for client + functions.
- [ ] Local: `catalyst serve` boots client + health function.
- [ ] Commit baseline (docs already present).

### DoD / Gate 0B

- [ ] `catalyst serve` runs without errors.
- [ ] Health endpoint reachable locally.
- [ ] Folder layout matches agreed structure.

---

## Sub-phase 0C — Auth shell + Pipeline skeleton

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Platform, Frontend, DevOps |
| **Depends on** | **Gate 0A**, **Gate 0B** |
| **Catalyst** | Authentication, API Gateway, Pipelines, Web hosting |

### Tasks

- [ ] Configure Catalyst Authentication (email login; open signup **off** in prod-like envs).
- [ ] Create 3–4 test Auth users (admin, scrb, sho, viewer).
- [ ] Minimal login page in web (Catalyst Auth SDK).
- [ ] Register API Gateway route: `/api/v1/health` (public or auth — document choice).
- [ ] Register placeholder authenticated route for later `/api/v1/me`.
- [ ] CORS: allow local + Catalyst client origin.
- [ ] Catalyst Pipeline: install → lint (optional) → build web → deploy functions + client to **Development**.
- [ ] Deploy once via Pipeline successfully.

### DoD / Gate 0C (**end of P0**)

- [ ] User can log in / log out via Catalyst Auth on deployed dev URL.
- [ ] Pipeline deploys empty shell to Development.
- [ ] Roles **not** fully enforced yet — but Auth identity works.

**Demo checkpoint D0:** “We deploy on Catalyst; officers can sign in.”

---

# PHASE 1 — Data model & RBAC core

**Outcome:** FIR schema in Data Store, role-scoped case APIs, import of sample data, **blocking RBAC tests**.

> Phase 1 is the largest backend phase — **do not merge 1A–1F into one sprint.**

---

## Sub-phase 1A — FIR + app schema (Data Store)

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Data |
| **Depends on** | Gate 0C |
| **Catalyst** | Data Store |
| **Refs** | `DATABASE_DESIGN.md`, `Police_FIR_ER_Diagram.pdf` |

### Tasks

**Masters / org**

- [ ] `State`, `District`, `Unit`, `UnitType`
- [ ] `Rank`, `Designation`, `Employee`
- [ ] `Court`
- [ ] `CaseCategory`, `GravityOffence`, `CaseStatusMaster`
- [ ] `CrimeHead`, `CrimeSubHead`, `CrimeHeadActSection`
- [ ] `Act`, `Section`
- [ ] `CasteMaster`, `ReligionMaster`, `OccupationMaster`

**Transactional**

- [ ] `CaseMaster` (+ extensions: `DistrictID`, `IsDemo`, `IngestBatchId`, `UpdatedAt`)
- [ ] `ComplainantDetails`, `Victim`, `Accused` (+ optional `PersonKey`)
- [ ] `ActSectionAssociation`
- [ ] `ArrestSurrender` (+ junction if modeled)
- [ ] `ChargesheetDetails`

**App**

- [ ] `App_UserProfile`
- [ ] `App_AuditLog`
- [ ] `App_ImportJob` (minimal)
- [ ] `App_AppConfig` (optional early)

**Indexes (design + create where supported)**

- [ ] Unique `CrimeNo`
- [ ] `CaseMaster(PoliceStationID, CrimeRegisteredDate)`
- [ ] `CaseMaster(DistrictID, CrimeRegisteredDate)`
- [ ] Unique `App_UserProfile.CatalystUserId`

- [ ] Schema JSON/docs under `datastore/schema/`
- [ ] Seed script skeleton for masters only

### DoD / Gate 1A

- [ ] All v1 tables exist in Development Data Store.
- [ ] Seed can insert ≥1 State, few Districts, few Units, sample CrimeHeads/Acts.

---

## Sub-phase 1B — UserProfile + authz middleware

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Backend, Platform |
| **Depends on** | **Gate 1A** |
| **Catalyst** | Authentication, Functions, Data Store, API Gateway |
| **Refs** | `SECURITY.md`, `BACKEND_ARCHITECTURE.md` |

### Tasks

- [ ] Implement `functions/common/auth.ts`:
  - [ ] `requireAuth()`
  - [ ] `loadUserProfile()`
  - [ ] `requireRoles([...])`
  - [ ] `caseScopeFilter(scope)` / `applyScope()`
  - [ ] Deny-by-default for unknown/inactive
- [ ] Implement `functions/common/errors.ts` (envelope + codes).
- [ ] Implement `functions/common/logger.ts` (`requestId`, no PII).
- [ ] Implement `GET /api/v1/me` (`auth_context` Function).
- [ ] Seed `UserProfile` for all 8 roles (test personas):
  - `SUPER_ADMIN`, `SCRB_ANALYST`, `DISTRICT_COMMAND`, `SHO`, `IO`, `DATA_OPERATOR`, `AUDITOR`, `VIEWER`
- [ ] Map each persona to district/unit/employee as required.
- [ ] Gateway: protect `/api/v1/*` except health.
- [ ] Unit tests: scope filter table for every role.

### DoD / Gate 1B

- [ ] `/me` returns `role`, `districtId`, `unitId`, `permissions` for each persona.
- [ ] Inactive / missing profile → blocked cleanly (`PROFILE_REQUIRED`).
- [ ] Scope unit tests green.

**Demo checkpoint D1a:** Login as SHO vs SCRB → different `/me` payload.

---

## Sub-phase 1C — Masters APIs

| | |
|--|--|
| **Duration** | 2 days |
| **Streams** | Backend |
| **Depends on** | **Gate 1B** |
| **Catalyst** | Functions, Data Store, API Gateway, Cache (optional) |
| **Refs** | `API.md` masters section |

### Tasks

- [ ] `GET /masters/districts`
- [ ] `GET /masters/units` (filter `districtId`; scope-limited for non-SCRB)
- [ ] `GET /masters/crime-heads`, `crime-sub-heads`
- [ ] `GET /masters/case-statuses`, `case-categories`
- [ ] `GET /masters/acts`, `sections?actCode=`
- [ ] Validation with Zod/Joi
- [ ] Optional Cache key `masters:all` TTL 1h

### DoD / Gate 1C

- [ ] All master endpoints return seeded data.
- [ ] SHO cannot list all state units if policy locks to own district (assert).

---

## Sub-phase 1D — Cases APIs (search + Case 360°)

| | |
|--|--|
| **Duration** | 4–5 days |
| **Streams** | Backend |
| **Depends on** | **Gate 1C** (needs masters for joins/labels) |
| **Catalyst** | Functions, Data Store, API Gateway |
| **Refs** | `API.md`, `API_REFERENCE.md`, `EDGE_CASES.md` |

### Tasks

- [ ] `GET /cases` — filters, pagination, sort, **mandatory scope**
- [ ] `GET /cases/{caseMasterId}` — summary + brief facts (role PII rules)
- [ ] `GET /cases/by-crime-no/{crimeNo}`
- [ ] `GET /cases/{id}/people` — complainant, victim, accused (mask for VIEWER)
- [ ] `GET /cases/{id}/acts`
- [ ] `GET /cases/{id}/arrests`
- [ ] `GET /cases/{id}/chargesheets`
- [ ] Out-of-scope id → **404** (not 403) per ADR-012
- [ ] Date range cap (`MAX_DATE_RANGE_DAYS`)
- [ ] CrimeNo treated as **string** (leading zeros)
- [ ] Audit write on Case 360° PII view (basic `App_AuditLog`)
- [ ] Integration fixtures: Unit A, Unit B same district, Unit C other district

### DoD / Gate 1D

- [ ] SHO Unit A never receives Unit B/C cases.
- [ ] DISTRICT sees A+B not C.
- [ ] SCRB sees all.
- [ ] Case 360° returns people/acts/arrests for in-scope case.

---

## Sub-phase 1E — Synthetic seed + CSV import v1

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Data, Backend |
| **Depends on** | **Gate 1D** (soft parallel after 1A tables exist; harden after 1D) |
| **Catalyst** | Stratus, Functions, Circuits (or Job), Signals, Data Store |
| **Refs** | `CATALYST_INTEGRATION.md` import circuit, `EDGE_CASES` import |

### Tasks

- [ ] `scripts/generate-synthetic-data.ts` — multi-district, lat/long, co-accused pairs, time spread.
- [ ] Mark demo rows `IsDemo=true` for VIEWER path.
- [ ] Stratus folders: `imports/raw/`, `imports/errors/`.
- [ ] `POST /admin/import` (SUPER_ADMIN) or CLI-triggered Function.
- [ ] Parse CSV/JSON → validate → upsert by `CrimeNo`.
- [ ] `App_ImportJob` status: PENDING → … → COMPLETE/FAILED.
- [ ] Circuit `fir_import_pipeline` v1 (even if linear Function first, structure for Circuit).
- [ ] Error rows written to Stratus.
- [ ] Load **≥ 500** synthetic cases for map/analytics later.

### DoD / Gate 1E

- [ ] Re-running import is idempotent on `CrimeNo`.
- [ ] Failed rows do not block good rows.
- [ ] Dev Data Store has enough geo-tagged cases for dashboards.

---

## Sub-phase 1F — RBAC test matrix (blocking)

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend, DevOps |
| **Depends on** | **Gate 1D**, **Gate 1E** (data fixtures) |
| **Catalyst** | Pipelines (run tests), Functions |
| **Refs** | `TESTING.md` |

### Tasks

- [ ] Table-driven tests: each role × case/master/admin endpoints.
- [ ] Personas: SHO A, DISTRICT D1, SCRB, IO assigned, VIEWER, unauthenticated.
- [ ] PII mask tests for VIEWER.
- [ ] Wire tests into Pipeline — **fail deploy on RBAC failure**.
- [ ] Document matrix results in `tests/rbac/README` (short).

### DoD / Gate 1F (**end of P1**)

- [ ] CI red if any role escalates scope.
- [ ] M1 demo ready: “SHO vs SCRB different data.”

**Demo checkpoint M1:** Login as SHO vs SCRB — different case lists & `/me`.

---

# PHASE 2 — Intelligence UI + analytics

**Outcome:** Role homes, maps, filters, KPIs, Case UI; SCRB drill State → District → Station → Case.

> Original Phase 2 was too large — split into **API aggregates first (2B)**, then **map (2C)**, then **role UIs (2D–2E)**.

---

## Sub-phase 2A — Web shell, login, RBAC routing

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Frontend |
| **Depends on** | Gate 1B (needs `/me`); best after Gate 1F |
| **Catalyst** | Auth, Web Client/Slate |
| **Refs** | `FRONTEND.md`, `FRONTEND_ARCHITECTURE.md`, `UI_UX_DESIGN.md` |

### Tasks

- [ ] Design tokens: colors, type, status pills (`UI_UX_DESIGN.md`).
- [ ] App shell: top bar, left nav, scope lock banner, profile menu.
- [ ] `lib/catalyst-auth.ts`, `lib/api-client.ts`, `lib/rbac.ts`
- [ ] `UserContext` from `/me`
- [ ] Routes + guards: `/login`, `/`, `/hub`, `/district`, `/station`, `/cases`, `/network`, `/predict`, `/reports`, `/admin`, `/audit`, `/forbidden`
- [ ] Role → default home redirect
- [ ] Nav visibility matrix (hide Admin, Predict, etc.)
- [ ] Logout clears TanStack Query cache
- [ ] Empty placeholders for each home (no map yet)

### DoD / Gate 2A

- [ ] Each role lands on correct home shell.
- [ ] SHO cannot open `/admin` (UI + will 403 API later).
- [ ] Scope banner shows unit/district name.

---

## Sub-phase 2B — Aggregate tables + analytics APIs

| | |
|--|--|
| **Duration** | 4–5 days |
| **Streams** | Backend, Data |
| **Depends on** | **Gate 1E** (case volume) |
| **Catalyst** | Data Store, Functions, Cache, Cron (manual trigger OK first) |
| **Refs** | `BACKEND.md` analytics, `API.md` analytics, `SCALING.md` |

### Tasks

- [ ] Tables: `Ana_AggDistrictDay`, `Ana_AggUnitDay` (counts by head/sub-head/status/gravity as needed)
- [ ] Rebuild Function: `rebuildAggregates(dateFrom, dateTo | dirty units)`
- [ ] Run full rebuild on synthetic data
- [ ] APIs:
  - [ ] `GET /analytics/kpis`
  - [ ] `GET /analytics/district-summary`
  - [ ] `GET /analytics/unit-summary`
  - [ ] `GET /analytics/trends`
  - [ ] `GET /analytics/time-of-day`
  - [ ] `GET /analytics/hotspots` (server binning / geohash)
  - [ ] `GET /analytics/emerging` (v1 simple ratio vs baseline — full polish in P4)
- [ ] Apply **same scope helper** as cases
- [ ] Cache-aside for KPIs (`CACHE_TTL_SECONDS_KPI`)
- [ ] Always require date range (default last 30/90 days)

### DoD / Gate 2B

- [ ] SCRB KPIs match SQL/manual count on sample (±1).
- [ ] SHO KPI scoped to unit only.
- [ ] Hotspots return lat/lng clusters for mapped cases.

**Soft parallel:** 2A and 2B can run in parallel after Gate 1F.

---

## Sub-phase 2C — Map & filter system

| | |
|--|--|
| **Duration** | 4–5 days |
| **Streams** | Frontend |
| **Depends on** | **Gate 2A**, **Gate 2B** |
| **Catalyst** | Web hosting (GeoJSON static or Stratus) |
| **Refs** | `FRONTEND.md` maps, `FLOW_STATE.md` drill-down |

### Tasks

- [ ] Add Karnataka districts GeoJSON under `public/geo/`
- [ ] `MapCanvas` + choropleth layer (district-summary)
- [ ] Station markers (unit-summary)
- [ ] Incident/hotspot layer
- [ ] Shared `FilterBar`: dateFrom/To, crime head, sub-head, gravity, status, category
- [ ] Filters synced to **URL search params**
- [ ] Breadcrumb: State > District > Station
- [ ] Time slider (optional v1: hour filter wired to time-of-day API)
- [ ] Legend, recenter, reset filters
- [ ] Loading skeletons + empty states
- [ ] `prefers-reduced-motion` for any pulse CSS

### DoD / Gate 2C

- [ ] Click district → station list/map updates.
- [ ] Click station → cases/hotspots for unit.
- [ ] Shareable URL restores filters.

---

## Sub-phase 2D — Role home dashboards

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Frontend |
| **Depends on** | **Gate 2C** |
| **Refs** | `FRONTEND.md` personas |

### Tasks

- [ ] **SCRB Hub** (`/hub`): state map, KPI cards, emerging list (basic), trends chart
- [ ] **District board** (`/district`): district map, station ranking table, risk placeholder
- [ ] **Station board** (`/station`): local pins, open queue, 7/30-day sparkline
- [ ] **IO home**: `cases?mine=1` emphasis
- [ ] **DATA_OPERATOR**: records desk (search + recent)
- [ ] **VIEWER**: demo watermark + `IsDemo` data only
- [ ] KPI card component (value, delta, sparkline)

### DoD / Gate 2D

- [ ] All operational roles have a usable home (not blank shell).
- [ ] VIEWER never shows real PII names.

---

## Sub-phase 2E — Case list + Case 360° UI

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Frontend |
| **Depends on** | **Gate 2A**, **Gate 1D** |
| **Refs** | `FRONTEND.md` Case 360°, `FLOW_STATE.md` |

### Tasks

- [ ] `/cases` table: CrimeNo mono, status pill, gravity, dates
- [ ] Global search → CrimeNo / CaseNo
- [ ] Case drawer or `/cases/[id]` tabs:
  - Summary, People, Legal, Process, Location, Network (stub), Audit (elevated)
- [ ] Map pin on Location tab
- [ ] Nearby cases query (simple radius or same unit recent)
- [ ] PII hide toggle for screen-share
- [ ] Deep link from map pin → case

### DoD / Gate 2E

- [ ] Full path map → case works for SCRB and SHO (scoped).
- [ ] People tab respects PII rules.

---

## Sub-phase 2F — Cache warm + performance pass

| | |
|--|--|
| **Duration** | 2 days |
| **Streams** | Backend, Frontend, DevOps |
| **Depends on** | **Gate 2B–2E** |
| **Catalyst** | Cache, Cron (optional), Pipelines |

### Tasks

- [ ] Cache key design documented in code comments / CONFIG
- [ ] Invalidate/rebuild after import (hook or manual admin action)
- [ ] Frontend: code-split map route; limit point payload
- [ ] Measure KPI & case search on staging sample; tune indexes/queries
- [ ] Fix N+1 master lookups (batch labels)
- [ ] “Data as of {asOf}” on analytics panels

### DoD / Gate 2F (**end of P2**)

- [ ] Cached KPI p95 within budget on sample (`SCALING.md` targets as guide)
- [ ] M2 demo stable

**Demo checkpoint M2:** Bengaluru Urban (or sample district) → station → FIR pin → Case 360°.

---

# PHASE 3 — Network & link analysis

**Outcome:** Node-link graph from FIR relationships; repeat offenders; co-accused associations.

---

## Sub-phase 3A — Graph model + edge builder

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Data, Backend |
| **Depends on** | Gate 1E |
| **Catalyst** | NoSQL, Data Store, Functions, Circuits/Jobs |
| **Refs** | `BACKEND_ARCHITECTURE.md` network model, `DECISIONS.md` ADR-010 |

### Tasks

- [ ] Define node types: PERSON, CASE, UNIT, LOCATION
- [ ] Define edge types: `ACCUSED_IN`, `VICTIM_IN`, `COMPLAINANT_IN`, `CO_ACCUSED`, `SHARED_SECTION`, `SAME_LOCATION_PERIOD` (v1 subset OK)
- [ ] NoSQL collection `graph_edges` document shape
- [ ] Conservative `PersonKey` rules (name+age+gender+unit heuristics; **no auto-merge on name alone**)
- [ ] Batch builder Function: cases batch → upsert edges
- [ ] Hook builder to end of import pipeline
- [ ] Dedupe edges; store `districtId` on edges for scope filtering
- [ ] Cap-friendly indexing by `srcId` / `dstId`

### DoD / Gate 3A

- [ ] Synthetic co-accused pair produces `CO_ACCUSED` + `ACCUSED_IN` edges.
- [ ] Rebuild job completes on full synthetic set.

---

## Sub-phase 3B — Network APIs

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend |
| **Depends on** | **Gate 3A**, Gate 1B |
| **Catalyst** | Functions, NoSQL, Data Store |
| **Refs** | `API_REFERENCE.md` network |

### Tasks

- [ ] `GET /network/graph?seedType&seedId&hops`
- [ ] BFS/DFS with `GRAPH_MAX_HOPS`, `GRAPH_MAX_NODES`
- [ ] Scope filter on edges/nodes for DISTRICT/SHO/IO
- [ ] Out-of-scope nodes as restricted stubs or omitted (document choice)
- [ ] Hydrate labels from Data Store (CrimeNo, names if PII allowed)
- [ ] `truncated: true` when cap hit
- [ ] `GET /network/persons/{personKey}`
- [ ] `GET /network/repeat-offenders` (ranked, scoped)

### DoD / Gate 3B

- [ ] Seed by CASE returns person+case nodes.
- [ ] Expand hop 2 respects max nodes.
- [ ] SHO cannot pull full state hub list.

---

## Sub-phase 3C — Network UI

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | Frontend |
| **Depends on** | **Gate 3B**, Gate 2A |
| **Refs** | `FRONTEND.md` network, `UI_UX_DESIGN.md` |

### Tasks

- [ ] `/network` page: seed search typeahead
- [ ] Graph canvas (Cytoscape / vis-network)
- [ ] Layout controls, legend, expand hops
- [ ] Node detail drawer
- [ ] Open case from CASE node
- [ ] Hide PII labels toggle
- [ ] Warn on node budget
- [ ] Entry from Case 360° Network tab

### DoD / Gate 3C

- [ ] IO opens network from a case and expands 1–2 hops.
- [ ] Graph usable with ~100 nodes.

---

## Sub-phase 3D — Repeat offender + association polish

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend, Frontend |
| **Depends on** | **Gate 3B**, **Gate 3C** |

### Tasks

- [ ] Repeat offender profile UI: multi-case timeline, sub-heads as MO proxy, multi-jurisdiction flag
- [ ] Association panel: shared co-accused, shared sections, shared locations
- [ ] SCRB “top hubs” widget on hub or network page
- [ ] Optional PNG export client-side (PDF pack deferred to P5 if needed)
- [ ] Tests: graph dedupe, hop cap, scope

### DoD / Gate 3D (**end of P3**)

- [ ] M3 demo: co-accused across two stations visible for SCRB

**Demo checkpoint M3:** Graph of co-accused across two stations.

---

# PHASE 4 — AI, trends, alerts

**Outcome:** Emerging trend spikes, risk scores via Catalyst ML only, alerts to SCRB/District, predictive UI.

> Split ML data prep, rules-based spikes, and AutoML — they have different risk and can ship spikes before models.

---

## Sub-phase 4A — Feature tables + socio-economic overlay

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Data, AI, Backend |
| **Depends on** | Gate 2B aggregates |
| **Catalyst** | Data Store, Stratus |
| **Refs** | `APPROACH.md`, ADR-007 (no caste/religion in features) |

### Tasks

- [ ] Feature table(s): district-week / unit-week counts by crime family
- [ ] Static socio-economic CSV (population density, urbanization proxy) → Stratus → join on DistrictID
- [ ] Feature export job for training frame
- [ ] **Feature denylist test:** name, caste, religion, occupation excluded
- [ ] Document feature set version `district-week-v2` (or v1)

### DoD / Gate 4A

- [ ] Training frame file generated for all districts in seed.
- [ ] Automated denylist test green.

---

## Sub-phase 4B — Spike / emerging trends (rules)

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend |
| **Depends on** | Gate 2B; **Gate 4A** optional |
| **Catalyst** | Functions, Cache, Cron |
| **Refs** | `CONFIGURATION.md` SPIKE_*, `EDGE_CASES` analytics |

### Tasks

- [ ] Baseline = last N weeks average (`SPIKE_BASELINE_WEEKS`)
- [ ] Flag when current > baseline × `SPIKE_RATIO_THRESHOLD`
- [ ] Handle baseline zero → severity UNKNOWN
- [ ] Harden `GET /analytics/emerging`
- [ ] Minimum count threshold (avoid rural single-case red zones)
- [ ] Unit tests for spike detector

### DoD / Gate 4B

- [ ] Synthetic spike dataset produces HIGH severity row.
- [ ] Emerging list stable under re-query (deterministic).

---

## Sub-phase 4C — QuickML / Zia risk scores

| | |
|--|--|
| **Duration** | 3–4 days |
| **Streams** | AI, Backend |
| **Depends on** | **Gate 4A** |
| **Catalyst** | **Zia AutoML**, **QuickML**, Functions, Data Store, Cron |
| **Refs** | `CATALYST_SERVICES.md`, `TECH_STACK.md` — no external LLM/ML |

### Tasks

- [ ] Train tabular model on feature frame (label: future spike / high volume)
- [ ] Persist `Ana_RiskScore` (scopeType, scopeId, score, modelVersion, computedAt, driversJson optional)
- [ ] Inference batch Function/Job
- [ ] `GET /ai/risk-scores`, `GET /ai/models/current`
- [ ] Stale flag if compute fails (serve last scores)
- [ ] Weekly retrain Cron definition (enable in P5 if needed)
- [ ] UI trust bar fields available in API

### DoD / Gate 4C

- [ ] Risk scores visible for districts/units with `modelVersion` + `trainedAt`.
- [ ] No third-party ML API in code dependencies for this path.

---

## Sub-phase 4D — Alerts + Mail / Push

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend, Platform |
| **Depends on** | **Gate 4B** (spikes); scores optional for alert types |
| **Catalyst** | Data Store, Cron, Signals, **Mail**, **Push Notifications** |

### Tasks

- [ ] `Alert` table: type, scope, severity, payload, status OPEN/ACK/EXPIRED
- [ ] Hourly (or on-demand) anomaly/spike scan job writes alerts
- [ ] Dedupe key: scope + crime + time bucket
- [ ] Rate-limit / digest to avoid alert storms
- [ ] `GET /alerts`, `POST /alerts/{id}/ack`
- [ ] Notify SCRB + District roles via Mail; Push if web push configured
- [ ] Deep link payload to hub filters

### DoD / Gate 4D

- [ ] Synthetic spike creates OPEN alert + notification path exercised in staging.
- [ ] Ack moves status to ACK.

---

## Sub-phase 4E — Predictive UI

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Frontend |
| **Depends on** | **Gate 4C**, **Gate 4D**, Gate 2A |
| **Refs** | `FRONTEND.md` predictive, `UI_UX_DESIGN.md` voice |

### Tasks

- [ ] `/predict` page: ranked risk list, heat affordance on map optional
- [ ] ModelTrustBar: version, trainedAt, coverage
- [ ] Anomaly / emerging call-outs with “why flagged”
- [ ] In-app alert bell → list → deep link
- [ ] Copy: **“Risk estimate — not a charge or evidence”**
- [ ] Role gate: SCRB, DISTRICT, SUPER_ADMIN (+ optional IO read)

### DoD / Gate 4E (**end of P4**)

- [ ] M4 demo: red-zone / spike + risk list

**Demo checkpoint M4:** Red-zone pulse / spike vs 8-week baseline + risk scores.

---

# PHASE 5 — Reports, ops hardening, production

**Outcome:** Scheduled jobs, PDF reports, admin/audit, security sign-off, production on Catalyst domain.

---

## Sub-phase 5A — Cron, Circuits, jobs hardening

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | DevOps, Backend |
| **Depends on** | Gates 2B, 3A, 4B–4C |
| **Catalyst** | Cron, Job Scheduling, Circuits, Signals, AppSail if timeouts |

### Tasks

- [ ] Cron IST: nightly aggregates `30 1 * * *`
- [ ] Cron: cache warm `0 2 * * *`
- [ ] Cron: anomaly scan `0 * * * *`
- [ ] Cron: weekly retrain `0 3 * * 0`
- [ ] Finalize Circuits: `fir_import_pipeline`, `report_generate` skeleton
- [ ] Move any timeout-prone job to AppSail
- [ ] Job status visible via `GET /admin/jobs`

### DoD / Gate 5A

- [ ] Nightly aggregate + anomaly scan succeed on staging schedule (or forced run).
- [ ] Import circuit end-to-end on staging sample file.

---

## Sub-phase 5B — SmartBrowz reports

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend, Frontend |
| **Depends on** | Gate 2B, 3B (for network pack), 5A helpful |
| **Catalyst** | **SmartBrowz**, Stratus, Mail, Circuits, Functions |

### Tasks

- [ ] Templates: `DISTRICT_WEEKLY`, `HOTSPOT_BRIEF`, `CASE_NETWORK_PACK`
- [ ] `POST /reports`, `GET /reports/{jobId}`, `GET /reports`
- [ ] PDF → Stratus `reports/`; authorized download URL
- [ ] Optional Mail when COMPLETE
- [ ] UI `/reports`: template picker, history, download
- [ ] Re-apply **server-side scope** on report filters

### DoD / Gate 5B

- [ ] SCRB generates District Weekly PDF successfully.
- [ ] SHO cannot generate another district’s report.

---

## Sub-phase 5C — Admin + Audit UI

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Frontend, Backend |
| **Depends on** | Gate 1B, audit writes from 1D+ |
| **Catalyst** | Functions, Data Store, Auth |

### Tasks

- [ ] Admin APIs already partial — complete:
  - [ ] `GET/PATCH /admin/users`
  - [ ] `GET /admin/jobs`
  - [ ] `POST /admin/import`
  - [ ] `GET /admin/audit`
- [ ] `/admin` UI: user-role-unit mapping, activate/deactivate
- [ ] Enforce ≥1 active SUPER_ADMIN
- [ ] `/audit` UI for AUDITOR + SUPER_ADMIN
- [ ] Audit ROLE_CHANGE, EXPORT, VIEW_CASE, IMPORT
- [ ] AppConfig feature flags UI (optional)

### DoD / Gate 5C

- [ ] Admin can create SHO mapping without console SQL.
- [ ] Auditor sees access log for a case view.

---

## Sub-phase 5D — Security hardening

| | |
|--|--|
| **Duration** | 2–3 days |
| **Streams** | Backend, Frontend, DevOps, Platform |
| **Depends on** | Feature-complete staging |
| **Catalyst** | Auth MFA, API Gateway throttle, Domain SSL |
| **Refs** | `SECURITY.md` checklist |

### Tasks

- [ ] MFA for SUPER_ADMIN + SCRB
- [ ] Session idle timeout policy for shared PS PCs
- [ ] Gateway rate limits reviewed
- [ ] CORS production allowlist only
- [ ] Secrets only in Catalyst env config
- [ ] Log redaction review (no BriefFacts)
- [ ] IDOR retest (security tests from `TESTING.md`)
- [ ] `npm audit` high+ clean or waived
- [ ] VIEWER watermark + demo isolation verified
- [ ] Security checklist sign-off recorded

### DoD / Gate 5D

- [ ] All SECURITY.md go-live items green or waived with reason.
- [ ] No known critical IDOR.

---

## Sub-phase 5E — Staging UAT + Production go-live

| | |
|--|--|
| **Duration** | 2–4 days |
| **Streams** | All |
| **Depends on** | **Gate 5A–5D** |
| **Catalyst** | Pipelines, Domain Mappings, Production env |
| **Refs** | `DEPLOYMENT.md`, `CICD_PIPELINE.md` |

### Tasks

- [ ] Staging UAT script with all 8 role personas
- [ ] Demo script covering challenge capabilities 1–6
- [ ] Load smoke on critical APIs
- [ ] Production Pipeline with **manual approval**
- [ ] Production Domain Mapping + SSL
- [ ] Production seed: masters + controlled data only (no accidental full PII dump without approval)
- [ ] Runbook: deploy, rollback, auth outage, scope incident (`DEPLOYMENT.md`)
- [ ] Tag release `v1.0.0` in `CHANGELOG.md`
- [ ] Final smoke on prod URL

### DoD / Gate 5E (**v1 release**)

- [ ] Production URL live on Catalyst.
- [ ] Role-based login enforced end-to-end in prod.
- [ ] M5 path works: **alert → case → network → PDF report**
- [ ] Definition of Done (below) complete

**Demo checkpoint M5:** Full intelligence path on production/staging as required by submission.

---

# Cross-cutting track (runs every phase)

Do not treat these as a single late phase — **touch each sprint**.

| Track | Every phase actions |
|-------|---------------------|
| **RBAC** | New endpoint → matrix row + test |
| **Catalyst compliance** | No new third-party SaaS for listed capabilities |
| **Docs** | Update CHANGELOG; adjust this file if scope cuts |
| **Observability** | Structured logs + requestId on new Functions |
| **PII** | Default mask; audit sensitive reads |
| **Performance** | Date bounds + pagination on every list |

---

# Dependency graph (critical path)

```
0A → 0B → 0C
              ↘
               1A → 1B → 1C → 1D → 1E → 1F
                          │              │
                          │              ├→ 2A ──┐
                          │              └→ 2B ──┼→ 2C → 2D
                          │                       │       ↓
                          │                       └──→ 2E → 2F
                          │
               1E ──────────────→ 3A → 3B → 3C → 3D
                          │
               2B ──────────────→ 4A → 4C → 4E
                          │         ↘
                          └────────→ 4B → 4D ↗
                                         │
               2F + 3D + 4E ─────────────→ 5A → 5B
                                            ↓
                                           5C → 5D → 5E
```

**Longest path (approx):**  
`0* → 1A–1F → 2B → 2C → 2D/2E → 2F → 3* → 4* → 5*`

**Best parallelization**

| Pair | When |
|------|------|
| 2A ∥ 2B | After 1F |
| 2E ∥ 2D | After 2A + 1D |
| 3A early | After 1E (before UI polish) |
| 4B early | After 2B (before AutoML) |
| 5C early | Admin APIs after 1B; UI after 2A |

---

# Role-based login — implementation checklist (span P0–P1–P2–P5)

| Step | Sub-phase |
|------|-----------|
| Catalyst Auth enabled | 0A, 0C |
| Login UI | 0C, 2A |
| UserProfile schema | 1A |
| `/me` + middleware | 1B |
| Scoped case/analytics APIs | 1D, 2B |
| RBAC automated tests | 1F |
| Role homes + nav | 2A, 2D |
| Admin role assignment UI | 5C |
| MFA + prod policies | 5D–5E |

---

# Challenge capability → phase coverage

| Challenge capability | Delivered in |
|----------------------|--------------|
| 1 Advanced visualization / maps / drill-down | P2 (2B–2E) |
| 2 Network & link analysis | P3 |
| 3 Sociological & AI predictive dashboards | P4 (4A–4E) |
| 4 Pattern & trend discovery | P2 + P4 (2B, 4B) |
| 5 Network & behavioral / MO | P3 (3D MO proxy) |
| 6 AI/ML-driven intelligence | P4 (4C) |
| Role-based secure access | P0–P1 + continuous |
| Catalyst deployment | P0 + P5 |

---

# Staffing suggestion (small team)

| Stream | Focus sub-phases |
|--------|------------------|
| **Platform/DevOps** | 0A, 0C, 5A, 5D, 5E |
| **Data** | 1A, 1E, 3A, 4A |
| **Backend** | 1B–1D, 1F, 2B, 2F, 3B, 4B–4D, 5B |
| **Frontend** | 2A, 2C–2E, 3C–3D, 4E, 5B–5C |
| **AI** | 4A, 4C |

If **2 people only:** sequence strictly by critical path; drop optional items (RAG, Push, Kannada, AppSail until needed).

---

# Scope cut order (if time-boxed)

Cut from the bottom first — keep RBAC + map + case + Catalyst deploy.

| Priority | Keep / cut |
|----------|------------|
| P0 | Must keep |
| P1 | Must keep |
| P2 through 2E | Must keep for challenge viz |
| 2F | Keep light (manual cache OK) |
| P3 through 3C | Strongly keep |
| 3D polish | Can thin |
| 4B + 4D | Keep rules spikes (high demo value) |
| 4C AutoML | Keep minimal one model |
| 4E | Thin widgets OK |
| 5B PDF | Keep one template |
| 5C | Minimal admin via console if needed |
| Push notifications | Cut; Mail only |
| RAG / Zia OCR / voice | Out of v1 |

---

# Definition of Done — v1 product

- [ ] Deployed entirely on Catalyst (no external primary host).
- [ ] Role-based login enforced: Auth + UserProfile + API scope + UI guards.
- [ ] FIR ER-aligned data loaded (synthetic or approved extract).
- [ ] Challenge capabilities 1–6 demonstrable (see table above).
- [ ] RBAC tests in CI.
- [ ] Security checklist signed.
- [ ] Production (or submission) URL on Domain Mappings.
- [ ] Demo script M1–M5 passes.
- [ ] CHANGELOG tagged `v1.0.0`.

---

# Sprint-style board (example 2-week sprints)

| Sprint | Sub-phases | Goal |
|--------|------------|------|
| S1 | 0A, 0B, 0C | Catalyst shell + login |
| S2 | 1A, 1B, 1C | Schema + `/me` + masters |
| S3 | 1D, 1E, 1F | Cases + import + RBAC CI |
| S4 | 2A, 2B | Shell + analytics APIs |
| S5 | 2C, 2D | Maps + role homes |
| S6 | 2E, 2F, 3A | Case UI + graph data |
| S7 | 3B, 3C, 3D | Network product |
| S8 | 4A, 4B, 4C | Features + spikes + model |
| S9 | 4D, 4E, 5A | Alerts + predict UI + jobs |
| S10 | 5B, 5C, 5D, 5E | Reports, admin, harden, go-live |

Adjust sprint length; keep **sub-phase gates** even if sprints merge.

---

# Related documents

| Doc | Use with this plan |
|-----|--------------------|
| [PROGRESS.md](./PROGRESS.md) | Checkpoint status & exact resume instructions |
| [LOG.md](./LOG.md) | Project execution history & activity log |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Original short plan (v1 summary) |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Code layout per sub-phase |
| [API_REFERENCE.md](./API_REFERENCE.md) | Endpoint contracts for P1–P5 |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Tables for 1A |
| [CATALYST_SERVICES.md](./CATALYST_SERVICES.md) | Service binding |
| [SECURITY.md](./SECURITY.md) | 5D checklist |
| [TESTING.md](./TESTING.md) | 1F and continuous |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 5E go-live |
| [ROADMAP.md](./ROADMAP.md) | Post-v1 only |


---

# Changelog for this plan

| Version | Date | Notes |
|---------|------|-------|
| IMPLEMENTATION2 v1 | 2026-07-24 | Full sub-phase split of P0–P5 from consolidated docs |
