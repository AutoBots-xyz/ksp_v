# KSP Crime Intelligence & Analytical Platform — Master Codebase Reference (`code.md`)

This document serves as the authoritative, comprehensive technical encyclopedia and developer reference for the **Karnataka State Police (KSP) Crime Intelligence & Analytical Platform**. It synthesizes the project's architectural principles, technology stack, directory structure, domain workflows, role-based access control (RBAC), and Zoho Catalyst cloud integrations.

---

## 1. Executive Summary & Core Mission

The KSP Platform is a strategic intelligence and analytical hub designed for State Crime Records Bureau (SCRB) analysts, District SP/Command officers, Station House Officers (SHOs), and Investigating Officers (IOs). 

### Core Objectives
- **Eliminate Data Silos:** Transition from fragmented, manual Excel-based crime reporting to an automated, centralized, spatiotemporal crime database.
- **Proactive Intelligence:** Replace reactive record-keeping with AI-driven anomaly detection, spatiotemporal hotspot forecasting, and automated trend alerts.
- **Link Analysis:** Uncover hidden criminal syndicates, repeat offenders, and modus operandi (MO) networks through high-speed graph traversals.
- **Mandatory Cloud Target:** Built **exclusively on Zoho Catalyst** serverless infrastructure (Slate/Web Hosting, Serverless Functions, Data Store, NoSQL, Cache, QuickML, and Stratus), ensuring compliance with hackathon and production deployment mandates.

---

## 2. System Architecture & Tech Stack

The application follows a **Serverless-First Modular Monolith** architectural pattern, leveraging REST JSON over HTTPS via the Zoho Catalyst API Gateway.

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER (Next.js SPA)                            │
│           Catalyst Slate / Web Client Hosting (apps/web  ──▶ slate "ksp")             │
│    Zustand State · TanStack Query · Leaflet Maps · Cytoscape Graphs · Recharts KPIs   │
└───────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │ HTTPS + JWT (Catalyst Auth)
┌───────────────────────────────────────────▼───────────────────────────────────────────┐
│                      EDGE & ROUTING LAYER (Catalyst API Gateway)                      │
│             Base Path: /api/v1/* · Throttling · CORS · Authentication Guard           │
└───────────────────────────────────────────┬───────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼───────────────────────────────────────────┐
│                 APPLICATION / DOMAIN LAYER (Serverless Functions)                     │
│      Node.js 20+ / TypeScript · 14 Modular Domain Targets (zcatalyst-sdk-node)        │
│  ├── auth_context (RBAC claims)       ├── analytics (KPIs & trends)                   │
│  ├── cases (Case 360° & CRUD)         ├── network (Graph link analysis)               │
│  ├── masters (Districts & Acts)       ├── ai (Zia/QuickML risk scoring)               │
│  ├── alerts (Threshold rules)         ├── reports (SmartBrowz PDF generation)         │
│  ├── admin (User & audit mgmt)        ├── ingest (Batch FIR extraction)               │
│  └── entities / search / offenders / health                                           │
└────────────────┬──────────────────────────┬──────────────────────────┬────────────────┘
                 │                          │                          │
┌────────────────▼────────────────┐┌────────▼───────────────┐┌─────────▼──────────────┐
│       DATA STORE (ZCQL)         ││     NoSQL (Graphs)     ││  STRATUS (Object Storage) │
│ Relational 3NF Schema:          ││ Denormalized Edges:    ││ • Raw FIR import files    │
│ CaseMaster, Accused, Victim,    ││ graph_edges collection ││ • Generated PDF packs     │
│ PoliceStation, UserProfile      ││ (BFS/DFS traversals)   ││ • ML model artifacts      │
└─────────────────────────────────┘└────────────────────────┘└───────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────────────────────────────────┐
│                     INTEGRATION, ASYNC & INTELLIGENCE LAYER                           │
│  • Catalyst Cache: High-speed cache-aside for district KPI cards & map tiles          │
│  • Circuits (circuits/): Multi-step workflows (fir_import_pipeline, report_generate)  │
│  • Cron Jobs (jobs/): Scheduled tasks (nightly_aggregates, anomaly_scan, cache_warm)  │
│  • QuickML / Zia AutoML: Anomaly scoring and time-series forecasting                  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Matrix
| Layer | Technologies & Libraries | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 14 (App Router)](file:///d:/KSP_PROJECT/apps/web/package.json#L27), [React 18](file:///d:/KSP_PROJECT/apps/web/package.json#L29), [TypeScript](file:///d:/KSP_PROJECT/apps/web/package.json#L50) | SPA client hosted on Catalyst Slate / Web Hosting |
| **UI & Styling** | [Tailwind CSS](file:///d:/KSP_PROJECT/apps/web/package.json#L49), [Radix UI](file:///d:/KSP_PROJECT/apps/web/package.json#L15), [Lucide React](file:///d:/KSP_PROJECT/apps/web/package.json#L26), [CMDK](file:///d:/KSP_PROJECT/apps/web/package.json#L21) | Responsive, accessible design system & dark mode |
| **State & Data Fetching** | [Zustand](file:///d:/KSP_PROJECT/apps/web/package.json#L36), [TanStack React Query v5](file:///d:/KSP_PROJECT/apps/web/package.json#L18) | Global client UI state, server state caching & refetching |
| **Geospatial & Graphs** | [Leaflet](file:///d:/KSP_PROJECT/apps/web/package.json#L25) / `react-leaflet`, [Cytoscape.js](file:///d:/KSP_PROJECT/apps/web/package.json#L22) / `react-cytoscapejs`, [Recharts](file:///d:/KSP_PROJECT/apps/web/package.json#L33) | District crime mapping, criminal syndicate node graphs, KPI charts |
| **Serverless Runtime** | [Node.js 20+](file:///d:/KSP_PROJECT/functions/package.json#L19), [TypeScript](file:///d:/KSP_PROJECT/functions/package.json#L20), [zcatalyst-sdk-node](file:///d:/KSP_PROJECT/functions/package.json#L12) | 14 domain-scoped serverless targets handling business logic |
| **Database & Cache** | Zoho Catalyst Data Store (ZCQL), NoSQL, Cache | Relational FIR tables, Graph edge adjacency lists, Cache-aside |
| **Storage & ML** | Catalyst Stratus, QuickML, Zia AutoML | Object storage for annexures/PDFs, automated anomaly risk scoring |

---

## 3. Comprehensive Repository Layout

The codebase is organized as a structured monorepo separating client web applications, serverless functions, background orchestration circuits, and database schemas.

```
d:\KSP_PROJECT\
├── catalyst.json                # Master Zoho Catalyst configuration (targets, slates, circuits, jobs, CORS)
├── package.json                 # Root monorepo scripts and dependencies
├── .env / .env.example          # Local environment variables and Catalyst project bindings
├── .gitignore                   # Comprehensive git ignore rules for Node, Next.js, Catalyst, and IDEs
├── PROJECT_ARCHITECTURE.md      # Core architectural ground truth and C4 diagrams
├── API_REFERENCE.md             # Detailed REST API endpoint specification
│
├── apps/                        # Frontend applications
│   └── web/                     # Next.js App Router SPA (@ksp/web) mapped to Catalyst Slate "ksp"
│       ├── src/
│       │   ├── app/             # Role-scoped routes (/station, /district, /hub, /network, /predict, /reports, /admin, /cases)
│       │   ├── components/      # Reusable UI components (maps, charts, graphs, navigation, tables)
│       │   ├── data/ / lib/     # API client wrappers, TanStack query hooks, Zod validation schemas
│       │   └── middleware.ts    # Route guard and authentication redirection
│       ├── tailwind.config.ts   # Design tokens, custom color palettes, and animations
│       └── next.config.js       # Next.js build configuration for Catalyst Slate hosting
│
├── functions/                   # Zoho Catalyst Serverless Functions (@ksp/functions)
│   ├── common/                  # Shared domain utilities across all functions
│   │   ├── logger.ts            # Structured Pino logging with correlation requestId
│   │   ├── auth.ts              # requireAuth middleware resolving user JWT to RBAC claims
│   │   ├── datastore.ts         # ZCQL query builder and Catalyst SDK initialization
│   │   ├── errors.ts            # Standardized ApiError and HTTP response formatting (ok, toResponse)
│   │   └── repositories/        # Data Access Object (DAO) pattern implementations (CaseRepository, etc.)
│   ├── cases/                   # CaseMaster search, CRUD, and Case 360° view endpoints
│   ├── auth_context/            # User profile, role, unit, and district session context resolution
│   ├── analytics/               # Spatiotemporal aggregation, crime head trends, and hotspot calculation
│   ├── network/                 # Graph edge queries, repeat offender link analysis, and co-accused graphs
│   ├── ai/                      # QuickML / Zia anomaly scoring and risk assessment interfaces
│   ├── alerts/                  # Threshold rule monitoring and automated notification dispatch
│   ├── reports/                 # SmartBrowz PDF report triggers and Stratus export handling
│   ├── admin/                   # User account administration, role assignment, and audit log querying
│   ├── ingest/                  # Batch CSV/JSON FIR extract validation and data store loading
│   └── masters / entities / search / offenders / health # Additional specialized domain targets
│
├── circuits/                    # Zoho Catalyst Circuit workflows (State Machine Orchestration)
│   ├── fir_import_pipeline.json # 6-step ingestion workflow: download → parse/validate → upsert → graph refresh → aggregate refresh → mail notify
│   └── report_generate.json     # Asynchronous PDF report generation and email dispatch workflow
│
├── jobs/                        # Zoho Catalyst Cron / Scheduled Job definitions
│   ├── nightly_aggregates.json  # Nightly rollup of station and district crime KPI statistics
│   ├── cache_warm.json          # Pre-warming Catalyst Cache for high-traffic district dashboards
│   ├── anomaly_scan.json        # Periodic scan of crime head time-series for statistical outliers
│   └── weekly_model_retrain.json# Weekly trigger to retrain Zia/QuickML risk forecasting models
│
├── datastore/                   # Database schema definitions and migrations
│   ├── schema/                  # ZCQL table definitions (CaseMaster, Accused, Victim, Arrest, etc.)
│   └── seeds/                   # Synthetic / anonymized initial data for development and UAT
│
├── nosql/                       # NoSQL collection documentation and schemas
│   └── graph_edges.md           # Schema for criminal network edges (srcType, srcId, dstType, dstId, rel, weight)
│
├── ksp/                         # Standalone Next.js reference / sandbox environment
└── docs/ & *.md                 # 29 comprehensive architectural, database, security, and deployment runbooks
```

---

## 4. Role-Based Access Control (RBAC) & Security Architecture

Security is built on a **Role-Based, Scoped Least-Privilege Architecture** combining Zoho Catalyst Authentication with custom application claims stored in the `UserProfile` table.

### 4.1 Hierarchy & Scope Matrix
| Role Code | Title / Hierarchy | Data Scope Rule | Primary Accessible Modules |
| :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | System Administrator | Unrestricted (State-wide) | User management, role assignment, system logs, master tables |
| `SCRB_ANALYST` | State Crime Records Bureau | Unrestricted (State-wide Read/Analytics) | State dashboards, network graph analysis, AI forecasting, custom reports |
| `DISTRICT_COMMAND` | SP / DSP / District HQ | Scoped to `DistrictID = profile.districtId` | District KPI maps, station comparisons, IO investigation oversight |
| `SHO` | Station House Officer | Scoped to `PoliceStationID = profile.unitId` | Station cases, local crime hotspots, officer assignment |
| `IO` | Investigating Officer | Scoped to assigned cases $\cup$ unit context | Case 360° investigation, suspect network graph, MO matching |
| `DATA_OPERATOR` | Records Clerk | Scoped to unit (Create / Update FIR forms) | FIR data ingestion, case lookup, basic registration |
| `AUDITOR` | Internal Compliance | Read-only scoped by audit assignment | Access audit logs, data export logs, compliance tracking |
| `VIEWER` | Guest / Training | Anonymized demo dataset subset | Read-only general overview dashboards |

### 4.2 Multi-Layered Security Enforcement
1. **Edge Authentication:** The Catalyst API Gateway intercepts requests, validating session tokens / JWTs before routing to functions.
2. **Middleware Verification:** Within functions, [`requireAuth(ctx, requestId)`](file:///d:/KSP_PROJECT/functions/common/auth.ts) extracts the authenticated `userId`, querying the Data Store for the officer's `role`, `districtId`, and `unitId`.
3. **Repository Scope Injection:** Data access objects (e.g., [`CaseRepository`](file:///d:/KSP_PROJECT/functions/common/repositories/CaseRepository.ts)) automatically append WHERE clauses based on the officer's scope claim (e.g., `WHERE PoliceStationID = 104`), making horizontal privilege escalation impossible.
4. **Audit Logging:** Every access to personally identifiable information (PII) or administrative modification writes an immutable record to the `AuditLog` table.

---

## 5. Core Operational Workflows & Data Pipelines

### 5.1 FIR Ingestion & Enrichment Pipeline
When FIR extracts are uploaded by Data Operators or ingested via automated CCTNS syncing, data flows through an orchestrated pipeline:
1. **Upload & Trigger:** Raw CSV/JSON files are deposited into Catalyst Stratus object storage (`imports/raw/`), triggering the [`fir_import_pipeline`](file:///d:/KSP_PROJECT/circuits/fir_import_pipeline.json) Circuit (or Cron/Signal equivalent in DC regions where Circuits are restricted).
2. **Parse & Validate:** The `ingest` serverless function validates records against Zod schemas (checking mandatory fields like `CrimeNo`, `ActSection`, and incident timestamps).
3. **Idempotent Upsert:** Validated records are upserted into relational Data Store tables (`CaseMaster`, `Accused`, `Victim`, `Arrest`), using `CrimeNo` as a natural deduplication key.
4. **Graph Edge Refresh:** The `network` function extracts entity relationships (e.g., accused persons sharing a case or section) and writes denormalized adjacency edges into the NoSQL `graph_edges` collection.
5. **Cache Invalidation:** Aggregated district and station KPI counters in Catalyst Cache are invalidated and recomputed.

```
[Stratus Upload: CSV/JSON] ──▶ [Circuit: fir_import_pipeline] ──▶ [Validate & Parse]
                                                                        │
┌───────────────────────────────────────────────────────────────────────┘
▼
[Idempotent Upsert: Data Store] ──▶ [Rebuild Edges: NoSQL] ──▶ [Refresh KPI Cache] ──▶ [Mail Summary]
```

### 5.2 Interactive Case Investigation & Network Link Analysis
1. **Spatiotemporal Filtering:** An IO or SHO logs into the SPA (`/app/station` or `/app/district`), filtering crimes by date range and crime head (e.g., "Cybercrime" or "Robbery"). The SPA fetches cached geo-coordinates from `/api/v1/analytics/hotspots`.
2. **Case 360° Drill-Down:** Clicking an incident on the Leaflet map calls `GET /api/v1/cases/{id}`, returning full case details, chargesheets, acts, and involved persons scoped to the officer's permissions.
3. **Syndicate Expansion:** To investigate co-accused links, the officer navigates to `/app/network`. The frontend renders a Cytoscape graph by calling `GET /api/v1/network/expand?personId=A-123`. The backend performs a breadth-first search on NoSQL `graph_edges` (capped at 2 hops / 300 nodes for performance), returning connected suspects, shared crime cases, and common locations.

### 5.3 AI Anomaly Detection & Hotspot Forecasting
1. **Scheduled Scanning:** The [`anomaly_scan`](file:///d:/KSP_PROJECT/jobs/anomaly_scan.json) cron job executes periodically, rolling up daily crime counts per station and district.
2. **QuickML / Zia Inference:** The aggregated time-series vector is passed to Catalyst QuickML / Zia services to evaluate statistical divergence against historical baselines.
3. **Alert Dispatch:** If a station exhibits an anomalous spike in specific crime categories (e.g., a 400% surge in night burglaries), an alert record is written to the Data Store, and high-priority email/push notifications are dispatched to the District Command and SHO via Catalyst Mail/Push services.

---

## 6. Zoho Catalyst Integration Mapping

To ensure compliance with project guidelines, every backend capability maps directly to a native Zoho Catalyst cloud service:

| Capability / Requirement | Assigned Zoho Catalyst Service | Configuration / Code Reference |
| :--- | :--- | :--- |
| **Web Client Hosting** | Catalyst Slate / Web Client Hosting | Configured in [`catalyst.json` (slate target)](file:///d:/KSP_PROJECT/catalyst.json#L27-L32) |
| **API Routing & CORS** | Catalyst API Gateway | Configured in [`catalyst.json` (api_gateway)](file:///d:/KSP_PROJECT/catalyst.json#L33-L42) |
| **Serverless Business Logic**| Catalyst Serverless Functions (Node.js/TS)| Defined in [`catalyst.json` (functions)](file:///d:/KSP_PROJECT/catalyst.json#L7-L26) |
| **Relational Database** | Catalyst Data Store (ZCQL) | Accessed via [`datastore.ts`](file:///d:/KSP_PROJECT/functions/common/datastore.ts) |
| **Graph / Entity Relationships**| Catalyst NoSQL Database | Schema defined in [`nosql/graph_edges.md`](file:///d:/KSP_PROJECT/nosql/graph_edges.md) |
| **Object & Document Storage**| Catalyst Stratus | Used for import staging and PDF reports |
| **High-Speed Caching** | Catalyst Cache | Cache-aside for district KPI dashboard cards |
| **Workflow Orchestration** | Catalyst Circuits / Signals | Defined in [`circuits/*.json`](file:///d:/KSP_PROJECT/circuits/fir_import_pipeline.json) |
| **Scheduled Background Tasks**| Catalyst Cron / Job Scheduling | Defined in [`jobs/*.json`](file:///d:/KSP_PROJECT/jobs/nightly_aggregates.json) |
| **User Authentication** | Catalyst Authentication | Handled via Catalyst Auth SDK and JWTs |
| **AI & Pattern Forecasting**| Catalyst QuickML / Zia AutoML | Managed by the `ai` serverless function target |
| **Document Generation** | Catalyst SmartBrowz | Triggered by the `reports` serverless function |

---

## 7. Development & Deployment Runbook

### 7.1 Local Development Prerequisites
- **Node.js:** v20.x or later.
- **Zoho Catalyst CLI:** Installed globally via `npm i -g zcatalyst-cli`.
- **Account Binding:** Active Zoho Account with an initialized Catalyst Project.

### 7.2 Initial Setup & Local Execution
```bash
# 1. Clone repository and install root dependencies
git clone <repository-url>
cd KSP_PROJECT
npm install

# 2. Install web and function sub-project dependencies
cd apps/web && npm install && cd ../..
cd functions && npm install && cd ..

# 3. Authenticate with Zoho Catalyst and link workspace
catalyst login
catalyst init   # Select existing project or link via CLI prompts

# 4. Configure local environment variables
cp .env.example .env

# 5. Start local Catalyst development server (serves API Gateway & Functions locally)
catalyst serve
```
*Note: To run the Next.js frontend in standalone development mode with hot-reload, execute `npm run dev` inside `apps/web` (defaults to `http://localhost:3000`).*

### 7.3 Testing & Verification
The project utilizes **Vitest** for unit and integration testing across frontend utilities and serverless domain logic:
```bash
# Run unit tests across the workspace
npm test

# Type-check TypeScript across web and functions
npm run typecheck --workspace=apps/web
npm run typecheck --workspace=functions
```

### 7.4 Production Deployment
Production deployment must be executed through the Zoho Catalyst CLI or Catalyst Pipelines to ensure proper packaging of serverless targets, routing rules, and slate bundles:
```bash
# Deploy all components (Functions, Client Slate, Circuits, Jobs, API Gateway rules)
catalyst deploy --only functions,client,circuits,cron,api-gateway
```

---

## 8. Summary of Specialized Architecture Documents
For deep-dive investigations into specific subsystems, refer to the accompanying documentation suite in the project root:
- **Architecture & Design:** [`PROJECT_ARCHITECTURE.md`](file:///d:/KSP_PROJECT/PROJECT_ARCHITECTURE.md), [`BACKEND_ARCHITECTURE.md`](file:///d:/KSP_PROJECT/BACKEND_ARCHITECTURE.md), [`FRONTEND_ARCHITECTURE.md`](file:///d:/KSP_PROJECT/FRONTEND_ARCHITECTURE.md), [`DATABASE_ARCHITECTURE.md`](file:///d:/KSP_PROJECT/DATABASE_ARCHITECTURE.md)
- **Catalyst & API Specs:** [`CATALYST_SERVICES.md`](file:///d:/KSP_PROJECT/CATALYST_SERVICES.md), [`CATALYST_INTEGRATION.md`](file:///d:/KSP_PROJECT/CATALYST_INTEGRATION.md), [`API_REFERENCE.md`](file:///d:/KSP_PROJECT/API_REFERENCE.md), [`API.md`](file:///d:/KSP_PROJECT/API.md)
- **Security & Ops:** [`SECURITY.md`](file:///d:/KSP_PROJECT/SECURITY.md), [`DEPLOYMENT.md`](file:///d:/KSP_PROJECT/DEPLOYMENT.md), [`CICD_PIPELINE.md`](file:///d:/KSP_PROJECT/CICD_PIPELINE.md), [`ENVIRONMENT_SETUP.md`](file:///d:/KSP_PROJECT/ENVIRONMENT_SETUP.md)
- **Implementation Plans:** [`IMPLEMENTATION_PLAN.md`](file:///d:/KSP_PROJECT/IMPLEMENTATION_PLAN.md), [`IMPLEMENTATION2.md`](file:///d:/KSP_PROJECT/IMPLEMENTATION2.md), [`ROADMAP.md`](file:///d:/KSP_PROJECT/ROADMAP.md)
