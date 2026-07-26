# Folder Structure

Recommended monorepo layout for the KSP Crime Intelligence platform on Catalyst.

---

## Root Layout

```
KSP_PROJECT/
├── README.md
├── IMPLEMENTATION_PLAN.md
├── PROJECT_ARCHITECTURE.md
├── TECH_STACK.md
├── FOLDER_STRUCTURE.md
├── FRONTEND.md
├── FRONTEND_ARCHITECTURE.md
├── UI_UX_DESIGN.md
├── BACKEND.md
├── BACKEND_ARCHITECTURE.md
├── API.md
├── API_REFERENCE.md
├── CATALYST_SERVICES.md
├── CATALYST_INTEGRATION.md
├── DATABASE_DESIGN.md
├── DATABASE_ARCHITECTURE.md
├── FLOW_STATE.md
├── APPROACH.md
├── EDGE_CASES.md
├── CICD_PIPELINE.md
├── DEPLOYMENT.md
├── SCALING.md
├── SECURITY.md
├── CHANGELOG.md
├── TESTING.md
├── ROADMAP.md
├── DECISIONS.md
├── ENVIRONMENT_SETUP.md
├── CONFIGURATION.md
│
├── Challenge_ksp.txt                 # Challenge brief (source)
├── CATALYST_KSP .txt                 # Catalyst mandatory services (source)
├── Police_FIR_ER_Diagram.pdf         # FIR ER source
│
├── catalyst.json                     # Catalyst project config
├── package.json                      # Workspace root
├── .env.example
├── .gitignore
├── .catalyst/                        # CLI local metadata (gitignored secrets)
│
├── apps/
│   └── web/                          # Frontend (Slate / Web Client)
│       ├── package.json
│       ├── next.config.js            # or vite.config.ts
│       ├── public/
│       │   ├── geo/                  # Karnataka districts GeoJSON
│       │   └── icons/
│       └── src/
│           ├── app/                  # Next.js routes (or pages/)
│           ├── components/
│           │   ├── auth/
│           │   ├── maps/
│           │   ├── network/
│           │   ├── charts/
│           │   ├── cases/
│           │   ├── layout/
│           │   └── ui/
│           ├── features/
│           │   ├── dashboard-scrb/
│           │   ├── dashboard-district/
│           │   ├── dashboard-station/
│           │   ├── case-360/
│           │   ├── network-analysis/
│           │   ├── predictions/
│           │   └── admin/
│           ├── hooks/
│           ├── lib/
│           │   ├── catalyst-auth.ts
│           │   ├── api-client.ts
│           │   ├── rbac.ts
│           │   └── constants.ts
│           ├── stores/
│           ├── styles/
│           └── types/
│
├── functions/                        # Catalyst Serverless Functions
│   ├── common/
│   │   ├── auth.ts                   # requireAuth, requireRoles, scope
│   │   ├── datastore.ts
│   │   ├── cache.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── validation.ts
│   ├── auth_context/
│   │   └── index.ts                  # GET /me profile + role
│   ├── cases/
│   │   └── index.ts
│   ├── masters/
│   │   └── index.ts
│   ├── analytics/
│   │   └── index.ts
│   ├── network/
│   │   └── index.ts
│   ├── ai/
│   │   └── index.ts
│   ├── alerts/
│   │   └── index.ts
│   ├── reports/
│   │   └── index.ts
│   ├── admin/
│   │   └── index.ts
│   ├── ingest/
│   │   └── index.ts
│   └── events/                       # Signal / Event Functions
│       ├── on_case_write/
│       └── on_import_complete/
│
├── appsail/                          # Optional heavy workers
│   └── ml-worker/
│       ├── Dockerfile
│       └── src/
│
├── circuits/                         # Circuit definitions (JSON/export)
│   ├── fir_import_pipeline.json
│   └── weekly_retrain.json
│
├── jobs/                             # Cron / Job Scheduling specs
│   ├── nightly_aggregates.json
│   ├── cache_warm.json
│   └── weekly_model_retrain.json
│
├── datastore/                        # Schema docs & seed
│   ├── schema/
│   │   ├── case_master.json
│   │   ├── user_profile.json
│   │   └── ...
│   └── seeds/
│       ├── districts.json
│       ├── units_sample.json
│       └── roles.json
│
├── nosql/                            # NoSQL collection docs
│   └── graph_edges.md
│
├── scripts/
│   ├── seed-local.ts
│   ├── import-fir-csv.ts
│   └── generate-synthetic-data.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   │   ├── login-roles.spec.ts
│   │   └── map-drilldown.spec.ts
│   └── fixtures/
│
└── docs/                             # Optional extras (diagrams, images)
    └── diagrams/
```

---

## Function Naming Convention

| Pattern | Example |
|---------|---------|
| Domain folder | `functions/cases/` |
| Entry | `index.ts` exporting Catalyst handler |
| Shared code | `functions/common/*` (bundled or relative import per Catalyst layout) |
| Event functions | `functions/events/<event_name>/` |

---

## Frontend Feature Folders

Colocate by product capability, not only by technical type:

| Folder | Role affinity |
|--------|----------------|
| `dashboard-scrb` | SCRB_ANALYST, SUPER_ADMIN |
| `dashboard-district` | DISTRICT_COMMAND |
| `dashboard-station` | SHO, DATA_OPERATOR |
| `case-360` | IO, SHO, higher |
| `network-analysis` | SCRB, DISTRICT, IO |
| `predictions` | SCRB, DISTRICT |
| `admin` | SUPER_ADMIN |

Route guards in `lib/rbac.ts` mirror backend roles.

---

## Config Files

| File | Role |
|------|------|
| `catalyst.json` | Project, functions, client, AppSail registration |
| `.env.example` | Documented env keys (no secrets) |
| `apps/web/.env.local` | Local client (gitignored) |
| Pipeline YAML/UI | Catalyst Pipelines definitions |

---

## What Not to Commit

```
.env
.env.local
.catalyst/user-config (if secret-bearing)
node_modules/
dist/
.next/
*.pem
synthetic production dumps with real PII
```

---

## Related

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [CONFIGURATION.md](./CONFIGURATION.md)
- [CICD_PIPELINE.md](./CICD_PIPELINE.md)
