# KSP Crime Intelligence & Analytical Platform

**Karnataka State Police (KSP)** — Strategic intelligence hub for SCRB, district command, and station-level officers.

This platform replaces siloed Excel-based crime reporting with an integrated, AI-assisted Crime Intelligence & Analytical system. It is built **exclusively on Zoho Catalyst** services (mandatory for deployment and submission validity).

---

## Problem Statement

| Challenge | Impact |
|-----------|--------|
| Data silos & manual Excel processes | Fragmented FIR/case data across stations |
| No AI-driven analytics | Hidden networks and MO patterns stay undiscovered |
| Limited SCRB visibility | Incomplete state-wide analysis |
| Reactive policing | No hotspot prediction or emerging-trend alerts |

**Source inputs:** `Challenge_ksp.txt`, `CATALYST_KSP .txt`, `Police_FIR_ER_Diagram.pdf`

---

## Solution Overview

A role-based Crime Intelligence platform that:

1. **Ingests & normalizes** FIR-centric police records (CaseMaster, Accused, Victim, Arrest, Act/Section, geo coords).
2. **Visualizes** district drill-down maps, spatiotemporal hotspots, and trend alerts.
3. **Maps criminal networks** — suspects, victims, locations, repeat offenders, MO links.
4. **Scores risk & anomalies** using Catalyst QuickML / Zia AutoML.
5. **Enforces RBAC** via Catalyst Authentication (station → district → SCRB → admin).
6. **Deploys fully on Catalyst** (AppSail / Slate, Functions, Data Store, API Gateway, Pipelines).

---

## Key Capabilities

| # | Capability | Catalyst services |
|---|------------|-------------------|
| 1 | Advanced geospatial & interactive dashboards | Slate/Web Client, Functions, Cache |
| 2 | Network & link analysis (node graphs) | Functions, Data Store, NoSQL |
| 3 | Predictive risk scoring & anomaly detection | QuickML, Zia AutoML |
| 4 | Pattern & trend discovery | Functions, Cron, Cache |
| 5 | Role-based secure login | **Catalyst Authentication** + API Gateway |
| 6 | Automated reports / PDF intelligence packs | SmartBrowz, Mail, Stratus |
| 7 | Event-driven pipelines (ingest → enrich → alert) | Signals, Circuits, Job Scheduling |

---

## Role-Based Access Control (RBAC)

Authentication is powered by **Catalyst Authentication**. Application roles map to police hierarchy and data scope.

| Role code | Role | Data scope | Primary modules |
|-----------|------|------------|-----------------|
| `SUPER_ADMIN` | System administrator | All state data + config | Users, roles, audit, masters |
| `SCRB_ANALYST` | State Crime Records Bureau | State-wide (read + analytics) | Dashboards, networks, AI, reports |
| `DISTRICT_COMMAND` | SP / DSP / District HQ | Own district + subordinate units | District maps, trends, IO oversight |
| `SHO` | Station House Officer | Own police station (Unit) | Station cases, local hotspots |
| `IO` | Investigating Officer | Assigned cases + unit context | Case 360°, network for case, MO |
| `DATA_OPERATOR` | Data entry / records clerk | Own unit (create/update FIR views) | Case search, limited forms |
| `AUDITOR` | Internal audit / compliance | Read-only scoped by assignment | Audit logs, access reports |
| `VIEWER` | Guest / training account | Demo / anonymized subset | Read-only dashboards |

**Enforcement layers:**

1. Catalyst Auth (login, session, MFA where enabled).
2. API Gateway (route auth + throttling).
3. Function middleware (role + unit/district claim checks).
4. Data Store row filters (`PoliceStationID`, `DistrictID`).

See [SECURITY.md](./SECURITY.md) and [API.md](./API.md).

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│  Catalyst Slate / Web Client Hosting (Next.js SPA)              │
│  Role-aware UI · Maps · Network graphs · Predictive dashboards  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + JWT
┌────────────────────────────▼────────────────────────────────────┐
│  Catalyst API Gateway  ·  Auth  ·  Rate limits  ·  CORS          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Catalyst Serverless Functions  (+ AppSail for heavy ML/API)    │
│  RBAC · FIR services · Analytics · Network · Alerts             │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
    │          │          │          │          │
 Data Store  NoSQL     Stratus    Cache     QuickML/Zia
 (FIR ER)   (graphs)  (files)   (hot)     (predict)
    │
 Signals → Circuits → Cron → Mail / Push Notifications
```

Full detail: [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) · [CATALYST_SERVICES.md](./CATALYST_SERVICES.md)

---

## Documentation Map (recommended order)

| Order | Document | Purpose |
|------:|----------|---------|
| 1 | [README.md](./README.md) | Project overview (this file) |
| 2 | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Phased build plan (summary) |
| 2b | [IMPLEMENTATION2.md](./IMPLEMENTATION2.md) | **Detailed phase-wise plan with sub-phases** |
| 3 | [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) | System architecture |
| 4 | [TECH_STACK.md](./TECH_STACK.md) | Languages, libs, Catalyst mapping |
| 5 | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | Repo layout |
| 6 | [FRONTEND.md](./FRONTEND.md) | UI features & screens |
| 7 | [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) | Client architecture |
| 8 | [UI_UX_DESIGN.md](./UI_UX_DESIGN.md) | Design system & UX |
| 9 | [BACKEND.md](./BACKEND.md) | Services & domain logic |
| 10 | [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) | Server design |
| 11 | [API.md](./API.md) | REST API design |
| 12 | [CATALYST_SERVICES.md](./CATALYST_SERVICES.md) | **Mandatory Catalyst usage** |
| 13 | [CATALYST_INTEGRATION.md](./CATALYST_INTEGRATION.md) | Integration patterns |
| 14 | [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | FIR ER + analytics tables |
| 15 | [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) | Storage strategy |
| 16 | [FLOW_STATE.md](./FLOW_STATE.md) | User & system flows |
| 17 | [APPROACH.md](./APPROACH.md) | Product & tech approach |
| 18 | [EDGE_CASES.md](./EDGE_CASES.md) | Edge cases & mitigations |
| 19 | [CICD_PIPELINE.md](./CICD_PIPELINE.md) | Catalyst Pipelines CI/CD |
| 20 | [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy to Catalyst |
| 21 | [SCALING.md](./SCALING.md) | Scale strategy |
| 22 | [SECURITY.md](./SECURITY.md) | AuthN/Z, data protection |
| 23 | [CHANGELOG.md](./CHANGELOG.md) | Version history |
| 24 | [TESTING.md](./TESTING.md) | Test strategy |
| 25 | [ROADMAP.md](./ROADMAP.md) | Future phases |
| 26 | [DECISIONS.md](./DECISIONS.md) | Architecture Decision Records |
| 27 | [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) | Local & Catalyst setup |
| 28 | [CONFIGURATION.md](./CONFIGURATION.md) | Config keys & environments |
| 29 | [API_REFERENCE.md](./API_REFERENCE.md) | Endpoint reference |

---

## Quick Start (developers)

```bash
# 1. Prerequisites: Node 20+, Catalyst CLI, Zoho account with Catalyst project
npm i -g zcatalyst-cli

# 2. Clone & install
cd KSP_PROJECT
npm install

# 3. Login & link Catalyst project
catalyst login
catalyst init   # or link existing project

# 4. Configure env (see ENVIRONMENT_SETUP.md)
cp .env.example .env

# 5. Run local client + functions (per Catalyst project type)
catalyst serve
```

Production deploy is **mandatory via Catalyst** (AppSail / Slate + Functions + Pipelines).  
See [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Non-Goals (v1)

- Replacing the full CCTNS operational FIR registration UI (this platform is intelligence-first).
- Public citizen complaint portal.
- Real-time body-cam or radio integration.
- Cross-state NCRB feed (roadmap).

---

## Compliance & Sensitivity

- Police FIR data is **confidential**. All environments must use least-privilege roles.
- PII (names, caste, religion, occupation) is restricted by role; analytics defaults to aggregates.
- Audit every access to case-level PII (see SECURITY.md).

---

## License & Ownership

Built for the Karnataka State Police challenge / SCRB analytical use case.  
FIR schema derived from **Police FIR System ER Diagram — Karnataka Police Department**.

---

## Contact

Project maintainers: KSP Crime Intelligence team (internal).  
Platform: [Zoho Catalyst](https://catalyst.zoho.com/)
