# Implementation Plan

Phased delivery plan for the **KSP Crime Intelligence & Analytical Platform**, aligned to Catalyst-mandatory deployment and role-based login.

> **For day-to-day execution**, use **[IMPLEMENTATION2.md](./IMPLEMENTATION2.md)** — it subdivides every large phase (0A–5E), with gates, tasks, demos, critical path, and scope-cut order.  
> **For tracking current progress & event history**, reference **[PROGRESS.md](./PROGRESS.md)** (checkpoint & resume state) and **[LOG.md](./LOG.md)** (chronological activity log).

---

## Goals by Phase

| Phase | Name | Outcome |
|-------|------|---------|
| 0 | Foundation | Catalyst project, auth roles, folder skeleton, CI skeleton |
| 1 | Core data & RBAC | FIR Data Store models, role login, scoped case APIs |
| 2 | Intelligence UI | Dashboards, maps, filters, station/district drill-down |
| 3 | Network analysis | Graph build, repeat offenders, MO views |
| 4 | AI / predictive | QuickML risk scores, anomaly flags, trend alerts |
| 5 | Ops hardening | Cron jobs, reports, audit, load tests, production deploy |

---

## Checkpointing & Execution Tracking Protocol

To ensure seamless progress tracking and allow any developer or AI agent to pause and resume work from an exact checkpoint:

1. **`PROGRESS.md` Maintenance**:
   - Must be updated at the conclusion of every phase or major sub-phase gate.
   - Must state the exact completion percentage, current active milestone, completed capabilities, and actionable next steps.
2. **`LOG.md` Maintenance**:
   - Must be updated chronologically whenever major updates, schema changes, tool installations, graph re-indexing, or deployments occur.
   - Each entry must include timestamp, action title, and detailed execution notes.

---

## Phase 0 — Foundation (Week 1)

### Tasks

- [ ] Create Catalyst project (Development + Production environments).
- [ ] Enable services: Authentication, Data Store, Functions, API Gateway, Cache, Stratus, Pipelines, Signals, Cron.
- [ ] Define Catalyst Auth roles: `SUPER_ADMIN`, `SCRB_ANALYST`, `DISTRICT_COMMAND`, `SHO`, `IO`, `DATA_OPERATOR`, `AUDITOR`, `VIEWER`.
- [ ] Scaffold monorepo: `apps/web`, `functions/`, `catalyst.json`, docs.
- [ ] Configure Domain Mappings (staging URL).
- [ ] Seed lookup tables: State, District, Unit, CaseCategory, CrimeHead, Act/Section samples.
- [ ] Document env vars in `CONFIGURATION.md`.
- [ ] Update [PROGRESS.md](./PROGRESS.md) checkpoint state and append activity log entry in [LOG.md](./LOG.md).

### Exit criteria

- User can register/login via Catalyst Authentication.
- Role claim present on session/token.
- Empty shell app deploys via Catalyst Pipelines.

### Catalyst services

Authentication · API Gateway · Functions · Slate/Web Client · Pipelines · Data Store

---

## Phase 1 — Core Data & RBAC (Weeks 2–3)

### Tasks

- [ ] Map FIR ER entities to Catalyst Data Store tables (see DATABASE_DESIGN.md).
- [ ] Implement `UserProfile` table linking Catalyst userId → EmployeeID / UnitID / DistrictID / Role.
- [ ] Build Function middleware: `requireAuth`, `requireRoles`, `scopeByUnit`.
- [ ] Case search & Case 360° APIs (scoped).
- [ ] Master data APIs (read-only for most roles).
- [ ] Audit log writer (Signals on sensitive reads optional; write on mutations).
- [ ] Import pipeline for sample FIR CSV → Data Store (Job / Function).
- [ ] Unit tests for RBAC matrix.
- [ ] Update [PROGRESS.md](./PROGRESS.md) checkpoint state and append activity log entry in [LOG.md](./LOG.md).

### Role → permission matrix (v1)

| Resource | SUPER_ADMIN | SCRB | DISTRICT | SHO | IO | DATA_OP | AUDITOR | VIEWER |
|----------|:-----------:|:----:|:--------:|:---:|:--:|:-------:|:-------:|:------:|
| Manage users/roles | CUD | — | — | — | — | — | R | — |
| State-wide dashboards | R | R | — | — | — | — | R* | R* |
| District dashboards | R | R | R(own) | — | — | — | R* | — |
| Station cases | R | R | R(own dist) | R(own) | R(assigned+) | RU(own) | R* | — |
| Network graph | R | R | R(own) | R(own) | R(case) | — | R* | — |
| AI predictions | R | R | R(own) | R(own) | R | — | R* | — |
| Export reports | Y | Y | Y(own) | Y(own) | Y(case) | — | Y* | — |
| PII full fields | Y | Y† | Y† | Y† | Y† | Y† | Y† | N |

\*Anonymized or masked where policy requires.  
†Subject to unit/district scope.

### Exit criteria

- Each role only sees allowed data (automated tests).
- CaseMaster CRUD/read paths work with PoliceStationID / DistrictID filters.
- Login redirects to role home dashboard.

---

## Phase 2 — Intelligence UI (Weeks 4–5)

### Tasks

- [ ] Login / MFA UX with Catalyst Auth SDK.
- [ ] Role home: SCRB state map, District command map, SHO station board, IO case list.
- [ ] Interactive Karnataka district map (choropleth + drill to stations).
- [ ] Spatiotemporal filters: date range, time-of-day, crime head, gravity, status.
- [ ] Hotspot layer (grid / DBSCAN-style aggregation via Functions).
- [ ] Emerging trend indicators (compare vs historical average).
- [ ] Case detail drawer: complainant, victims, accused, acts, geo pin.
- [ ] Responsive layout (desktop-first for SCRB; tablet for stations).
- [ ] Cache popular aggregates in Catalyst Cache.
- [ ] Update [PROGRESS.md](./PROGRESS.md) checkpoint state and append activity log entry in [LOG.md](./LOG.md).

### Exit criteria

- SCRB can drill State → District → Station → Case.
- Filters update maps and KPI cards in &lt; 2s for sample dataset.
- Role-based nav hides forbidden modules.

---

## Phase 3 — Network & Link Analysis (Weeks 6–7)

### Tasks

- [ ] Graph model in NoSQL / edge tables: Person–Case–Location–MO.
- [ ] Entity resolution strategy for repeat accused (name+age+gender heuristics; KGID later).
- [ ] Network visualization (force-directed / hierarchical).
- [ ] Repeat offender profiles with multi-jurisdiction cases.
- [ ] Association detection (shared co-accused, shared locations, shared sections).
- [ ] Export graph snapshot to Stratus + SmartBrowz PDF for court brief (optional).
- [ ] Update [PROGRESS.md](./PROGRESS.md) checkpoint state and append activity log entry in [LOG.md](./LOG.md).

### Exit criteria

- IO can open network for a CaseMasterID and expand 1–2 hops.
- SCRB can search person hubs with highest degree centrality (scoped).

---

## Phase 4 — AI / Predictive Intelligence (Weeks 8–9)

### Tasks

- [ ] Feature store tables: district-week crime counts, socio-economic overlays (static CSV).
- [ ] Zia AutoML / QuickML tabular models for high-risk zone scoring.
- [ ] Anomaly detection Function (z-score / isolation-style on time series).
- [ ] Alert rules → Signals → Push/Mail for SCRB & District roles.
- [ ] Predictive dashboard widgets (risk heat, emerging typology).
- [ ] Model versioning notes in DECISIONS.md; retrain Cron weekly.
- [ ] Update [PROGRESS.md](./PROGRESS.md) checkpoint state and append activity log entry in [LOG.md](./LOG.md).

### Exit criteria

- Risk score visible per district/station with last-trained timestamp.
- Spike alert fires on synthetic anomaly in staging.
- No third-party LLM/ML cloud outside Catalyst QuickML/Zia (submission rule).

---

## Phase 5 — Hardening & Production (Week 10)

### Tasks

- [ ] Catalyst Cron: nightly aggregates, weekly model retrain, cache warm.
- [ ] SmartBrowz intelligence report PDFs → Stratus → Mail.
- [ ] Full audit dashboard for AUDITOR / SUPER_ADMIN.
- [ ] Security review: secrets, CORS, rate limits, PII masking.
- [ ] Load test critical APIs; tune Cache & indexes.
- [ ] Production deploy via Catalyst Pipelines + Domain Mapping + SSL.
- [ ] Runbook + rollback in DEPLOYMENT.md.
- [ ] UAT with role personas.
- [ ] Final update to [PROGRESS.md](./PROGRESS.md) checkpoint state and append release log in [LOG.md](./LOG.md).

### Exit criteria

- Production URL live on Catalyst custom domain.
- All checklist items in SECURITY.md green.
- Demo script covers challenge capabilities 1–6.

---

## Workstreams (parallel)

```
          ┌──────────── Auth / RBAC ────────────┐
Data ─────┤                                     ├──── Frontend
Schema    │         Domain APIs                 │     Maps/Graphs
ETL ──────┤                                     ├──── AI Features
          └──────────── Catalyst Ops ───────────┘
                     Pipelines · Cron · Signals
```

| Stream | Owner focus | Depends on |
|--------|-------------|------------|
| Platform / Catalyst | Project config, services | Phase 0 |
| Data | ER mapping, import | Phase 0 |
| Backend APIs | Functions + Gateway | Data, Auth |
| Frontend | Slate app | Auth, APIs |
| AI | QuickML/Zia | Aggregates |
| DevOps | Pipelines, envs | All |

---

## Milestones & Demo Checkpoints

| Milestone | Demo story |
|-----------|------------|
| M1 | Login as SHO vs SCRB — different home screens & data |
| M2 | Map drill-down Bengaluru Urban → station → FIR pin |
| M3 | Graph of co-accused across two stations |
| M4 | Red-zone pulse when theft spikes vs 8-week baseline |
| M5 | Full path: alert → case → network → PDF report |

---

## Risk Register (implementation)

| Risk | Mitigation |
|------|------------|
| Entity resolution false merges | Conservative matching; manual “link person” for SUPER_ADMIN/SCRB |
| Large FIR volume | Aggregates + Cache; paginate case lists; NoSQL for graph |
| Catalyst service limits | AppSail for heavy jobs; Job Scheduling pools |
| PII leakage in demos | VIEWER role + synthetic data environment |
| Schema drift vs real CCTNS | Versioned import adapters; keep ER as source of truth |

---

## Definition of Done (release)

- [ ] Deployed entirely on Catalyst (no external host for app/API/DB).
- [ ] Role-based login enforced end-to-end.
- [ ] Challenge capabilities 1–6 demonstrable.
- [ ] Docs complete (this set).
- [ ] Automated tests for RBAC + critical APIs.
- [ ] Security checklist signed off.
- [ ] Checkpoint status verified in [PROGRESS.md](./PROGRESS.md) and activity history logged in [LOG.md](./LOG.md).
