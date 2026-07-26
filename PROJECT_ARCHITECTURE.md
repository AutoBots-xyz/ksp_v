# Project Architecture

System architecture for the **KSP Crime Intelligence & Analytical Platform** on Zoho Catalyst.

---

## 1. Architectural Style

| Aspect | Choice |
|--------|--------|
| Overall style | Serverless-first modular monolith on Catalyst |
| API style | REST JSON via Catalyst API Gateway |
| UI | SPA / Next.js hosted on Catalyst Slate or Web Client Hosting |
| Auth | Catalyst Authentication + application RBAC claims |
| Data | Relational FIR core (Data Store) + analytical/graph (NoSQL) + objects (Stratus) |
| Async | Signals, Circuits, Cron / Job Scheduling |
| AI | Catalyst QuickML + Zia AutoML / Zia Services |

**Principle:** Prefer a Catalyst service whenever the capability is listed in `CATALYST_KSP .txt`. Third-party substitutes risk invalid submission. **Deployment via Catalyst is mandatory.**

---

## 2. Context Diagram (C4 L1)

```
                    ┌──────────────────┐
                    │  Police Officers │
                    │  SCRB / SP / SHO │
                    │  IO / Operators  │
                    └────────┬─────────┘
                             │ HTTPS
                    ┌────────▼─────────┐
                    │  KSP Intelligence │
                    │  Platform (this)  │
                    └────────┬─────────┘
           ┌─────────────────┼─────────────────┐
           │                 │                 │
   ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
   │ FIR / CCTNS  │  │ Socio-econ   │  │ Email/Push   │
   │ data import  │  │ overlay CSVs │  │ (Catalyst)   │
   └──────────────┘  └──────────────┘  └──────────────┘
```

External systems are integrated via **import jobs** and **Catalyst Connections** where OAuth is needed—not by bypassing Catalyst hosting.

---

## 3. Container Diagram (C4 L2)

```
┌──────────────────────────────── CATALYST PROJECT ───────────────────────────────┐
│                                                                                 │
│  ┌─────────────────────────────┐     ┌──────────────────────────────────────┐  │
│  │ Web Client (Slate / Hosting)│────▶│ API Gateway                          │  │
│  │ Next.js + Map + Graph UI    │     │ Auth · Throttle · Route              │  │
│  └─────────────────────────────┘     └──────────────────┬───────────────────┘  │
│                                                         │                       │
│                          ┌──────────────────────────────▼──────────────────┐    │
│                          │ Serverless Functions (+ optional AppSail)       │    │
│                          │ auth · cases · analytics · network · ai · admin │    │
│                          └─┬──────┬──────┬──────┬──────┬──────┬────────────┘    │
│                            │      │      │      │      │      │                 │
│                     ┌──────▼┐ ┌───▼──┐ ┌▼────┐ ┌▼───┐ ┌▼────┐ ┌▼──────────┐  │
│                     │Data   │ │NoSQL │ │Stra │ │Cach│ │Quick│ │Auth       │  │
│                     │Store  │ │      │ │tus  │ │e   │ │ML   │ │(users)    │  │
│                     └───────┘ └──────┘ └─────┘ └────┘ └─────┘ └───────────┘  │
│                                                                                 │
│  Signals ──▶ Circuits ──▶ Cron/Jobs ──▶ Mail / Push Notifications               │
│  Pipelines (CI/CD) · Domain Mappings (SSL) · SmartBrowz (reports)               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Logical Layers

### 4.1 Presentation layer

- Role-aware routes and navigation.
- MapLibre/Leaflet-style maps for Karnataka districts & stations.
- Network graph canvas for link analysis.
- Chart library for trends and risk scores.
- Catalyst Auth SDK session handling.

### 4.2 API / BFF layer

- Catalyst API Gateway routes `/api/v1/*` → Functions.
- Gateway-level authentication and rate limiting.
- CORS restricted to Catalyst-hosted origins + approved domains.

### 4.3 Application / domain layer (Functions)

| Module | Responsibility |
|--------|----------------|
| `auth-context` | Resolve user → role, unit, district |
| `cases` | Case search, Case 360°, scoped CRUD/read |
| `masters` | District, Unit, CrimeHead, Act/Section lookups |
| `analytics` | Aggregates, hotspots, trends |
| `network` | Graph queries, repeat offender profiles |
| `ai` | Risk scores, anomalies (calls QuickML/Zia) |
| `alerts` | Threshold rules, notification dispatch |
| `reports` | SmartBrowz job triggers, Stratus links |
| `admin` | Users, role assignment, audit |
| `ingest` | Batch import of FIR extracts |

### 4.4 Data layer

| Store | Contents |
|-------|----------|
| Data Store | FIR ER tables (CaseMaster, Accused, Victim, …) + UserProfile + AuditLog |
| NoSQL | Graph edges, denormalized person hubs, session analytics blobs |
| Stratus | Uploaded imports, generated PDFs, model artifacts metadata |
| Cache | District KPI cards, map tiles aggregates, role permission map |

### 4.5 Intelligence layer

- Feature generation Functions (scheduled).
- QuickML / Zia AutoML models for risk scoring.
- Anomaly detectors on time-series aggregates.
- Optional Zia OCR later for scanned annexures (not v1 core).

### 4.6 Integration / orchestration layer

- **Signals:** Data Store insert/update → recompute flags.
- **Circuits:** multi-step ingest → validate → load → reindex.
- **Cron:** nightly rollups, weekly retrain, cache warm.
- **Mail / Push:** trend alerts to SCRB / District roles.

---

## 5. Role-Based Security Architecture

```
Login (Catalyst Auth)
        │
        ▼
Session / JWT with Catalyst userId
        │
        ▼
Load UserProfile (role, districtId, unitId, employeeId)
        │
        ▼
┌───────────────────────────────┐
│ Gateway: authenticated?       │
│ Function: role ∈ allowed?     │
│ Function: row scope filter    │
│ UI: hide modules / mask PII   │
└───────────────────────────────┘
```

**Scope rules (default):**

| Role | Scope key |
|------|-----------|
| SUPER_ADMIN / SCRB_ANALYST | none (state) |
| DISTRICT_COMMAND | `DistrictID = profile.districtId` |
| SHO / DATA_OPERATOR | `PoliceStationID = profile.unitId` |
| IO | assigned cases ∪ unit |
| AUDITOR | configured scope, read-only |
| VIEWER | demo dataset flag |

Details: [SECURITY.md](./SECURITY.md).

---

## 6. Data Flow — Analytical Path

```
FIR extract (CSV/JSON)
    → Stratus upload
    → Signal / manual trigger
    → Circuit: validate schema → map to ER → upsert Data Store
    → Function: rebuild aggregates → Cache
    → Function: refresh graph edges → NoSQL
    → (schedule) retrain features → QuickML
    → UI dashboards read Cache/API
```

---

## 7. Data Flow — Interactive Investigation

```
Officer login
  → role home
  → map filter (crime head, dates)
  → analytics API (scoped)
  → select hotspot / case
  → case 360° API
  → network expand API
  → optional report Circuit (SmartBrowz → Stratus → Mail)
```

---

## 8. Cross-Cutting Concerns

| Concern | Approach |
|---------|----------|
| Logging | Structured logs in Functions; correlation `requestId` |
| Audit | `AuditLog` table for PII reads & admin actions |
| Caching | Cache-aside for aggregates; TTL by volatility |
| Idempotency | Ingest uses CrimeNo unique key |
| Versioning | API `/v1`; model `modelVersion` field |
| Config | Environment variables + Data Store `AppConfig` table |
| Resilience | Retry on Circuit steps; graceful empty states in UI |

---

## 9. Environment Topology

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Feature work | Synthetic / anonymized |
| Staging | UAT | Masked sample FIR volume |
| Production | Live | Controlled FIR feed; restricted access |

Each maps to Catalyst environments with separate credentials and Domain Mappings.

---

## 10. Deployment Topology

- **Web:** Catalyst Slate or Web Client Hosting.
- **API logic:** Serverless Functions; heavy/long jobs on **AppSail** if needed.
- **Edge routing:** API Gateway + Domain Mappings + SSL.
- **CI/CD:** Catalyst Pipelines only (preferred for submission).

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [CICD_PIPELINE.md](./CICD_PIPELINE.md).

---

## 11. Quality Attributes

| Attribute | Target (v1) |
|-----------|-------------|
| Auth latency | &lt; 1s login redirect |
| Dashboard KPI load | &lt; 2s (cached) |
| Case search p95 | &lt; 1.5s page of 50 |
| Availability | Catalyst SLA; multi-env promote |
| Security | RBAC + audit + least privilege |
| Maintainability | Modular Functions by domain |

---

## 12. Related Documents

- [TECH_STACK.md](./TECH_STACK.md)
- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)
- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [CATALYST_SERVICES.md](./CATALYST_SERVICES.md)
- [DECISIONS.md](./DECISIONS.md)
