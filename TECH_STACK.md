# Tech Stack

Technology choices for the KSP Crime Intelligence platform, **mapped to mandatory Zoho Catalyst services**.

---

## 1. Stack Summary

| Layer | Technology | Catalyst service |
|-------|------------|------------------|
| Frontend | Next.js 14+ (App Router) or React 18 SPA, TypeScript, Tailwind CSS | **Slate** or **Web Client Hosting** |
| Maps | MapLibre GL / Leaflet + Karnataka GeoJSON | Client-side (hosted assets on Stratus optional) |
| Charts | Recharts / ECharts | Client |
| Network graphs | Cytoscape.js or vis-network / Nivo network | Client |
| API routing | REST JSON | **API Gateway** |
| Backend logic | Node.js 18+ (TypeScript) Functions | **Serverless Functions** |
| Long-running / custom runtime | Dockerized Node/Python workers | **AppSail** |
| Auth | Catalyst Auth SDK (web) + token validation | **Authentication** |
| Relational DB | FIR ER schema | **Data Store** |
| Document / graph store | Edges, hubs, flexible docs | **NoSQL** |
| Object storage | Imports, PDFs, exports | **Stratus** |
| Cache | KPI & map aggregates | **Cache** |
| Search | Data Store full-text where applicable | **Data Store** |
| ML / LLM / RAG | Risk models, optional RAG on SOPs | **QuickML** |
| AutoML tabular | Zone risk training | **Zia AutoML** |
| Vision/OCR (future) | Scanned docs | **Zia Services** |
| PDF / headless reports | Intelligence pack generation | **SmartBrowz** |
| Email | Alert & report delivery | **Mail** |
| Push | Web push for trend spikes | **Push Notifications** |
| Events | DB/file triggers | **Signals** + Event Functions |
| Orchestration | Multi-step workflows | **Circuits** |
| Schedulers | Nightly jobs | **Cron** / **Job Scheduling** |
| OAuth connectors | Zoho or approved 3rd parties | **Connections** |
| Custom domain + SSL | Production URL | **Domain Mappings** |
| CI/CD | Build, test, deploy | **Pipelines** |

---

## 2. Languages & Runtimes

| Component | Language | Notes |
|-----------|----------|-------|
| Web app | TypeScript | Strict mode |
| Functions | TypeScript / JavaScript (Node) | Catalyst Node runtime |
| ML feature jobs | Python (if AppSail) or Node | Prefer QuickML pipelines when possible |
| IaC / config | JSON/YAML + Catalyst console | `catalyst.json` |

---

## 3. Frontend Libraries (recommended)

```
next (or vite+react)
typescript
tailwindcss
@zoho/catalyst / catalyst web SDK   # auth & client helpers
maplibre-gl | leaflet
react-map-gl (if MapLibre)
cytoscape | vis-network
recharts | echarts-for-react
tanstack-query                       # server state
zustand | jotai                      # light client state
zod                                  # schema validation
date-fns
lucide-react                         # icons
```

---

## 4. Backend Libraries (recommended)

```
zcatalyst-sdk-node                   # Data Store, Auth, Cache, Stratus, etc.
zod | joi                            # request validation
pino | console JSON                  # structured logs
date-fns
csv-parse                            # ingest
```

---

## 5. Catalyst Service → Capability Matrix

Aligned with `CATALYST_KSP .txt`:

| # | Capability | Service used |
|---|------------|--------------|
| 1 | Serverless backend logic | **Catalyst Serverless (Functions)** |
| 2 | Docker image deployment | **AppSail** (ML workers / heavy ETL) |
| 3 | Full web app managed runtime | **AppSail** (optional SSR) |
| 4 | Frontend SPA / Next.js | **Slate** or **Web Client Hosting** |
| 5 | Custom domain + SSL | **Domain Mappings** |
| 6 | Relational database | **Data Store** |
| 7 | Unstructured / semi-structured | **NoSQL** |
| 8 | Object / blob storage | **Stratus** |
| 9 | Cache | **Cache** |
| 10 | Full-text search | **Data Store** |
| 11 | Text LLMs / RAG | **QuickML** (LLM Serving, RAG) |
| 12 | No-code ML pipelines | **QuickML** |
| 13 | Automated tabular training | **Zia AutoML** |
| 14 | OCR / face / image (future) | **Zia Services** |
| 15 | Voice (future) | **Zia Services** |
| 16 | PDF / headless browser | **SmartBrowz** |
| 17 | User auth login/signup | **Authentication** |
| 18 | API routing, throttle, auth | **API Gateway** |
| 19 | OAuth tokens | **Connections** |
| 20 | Scheduled jobs | **Cron / Job Scheduling** |
| 21 | In-project events | **Signals + Event Functions** |
| 22 | Cross-app event bus | **Signals** |
| 23 | Multi-step orchestration | **Circuits** |
| 24 | Transactional email | **Mail** |
| 25 | Push notifications | **Push Notifications** |
| 26 | CI/CD | **Pipelines** |

---

## 6. Explicitly Avoided (for submission validity)

Do **not** use when Catalyst equivalent exists:

| Avoid | Use instead |
|-------|-------------|
| AWS Lambda / Azure Functions | Catalyst Functions |
| Vercel/Netlify as primary host | Slate / Web Client Hosting / AppSail |
| MongoDB Atlas / Firebase as primary DB | Data Store + NoSQL |
| S3 as primary blob | Stratus |
| Redis Cloud as primary cache | Catalyst Cache |
| Auth0 / Firebase Auth as primary | Catalyst Authentication |
| OpenAI API as primary LLM | QuickML LLM Serving |
| External GitHub Actions only | Catalyst Pipelines (primary) |

Third-party **libraries** (UI charts, map engines) running **inside** Catalyst-hosted apps are fine.

---

## 7. Role-Based Login Stack

| Piece | Tech |
|-------|------|
| Identity store | Catalyst Authentication users |
| Login UI | Catalyst hosted login or custom UI + Auth SDK |
| Session | Catalyst session / JWT |
| App roles | Custom user attributes or `UserProfile` in Data Store |
| API enforcement | API Gateway auth + Function role guard |
| MFA | Catalyst Auth MFA (enable for SUPER_ADMIN, SCRB) |

---

## 8. Tooling

| Tool | Purpose |
|------|---------|
| Node 20 LTS | Local runtime |
| Catalyst CLI (`zcatalyst-cli`) | Serve, deploy, logs |
| ESLint + Prettier | Code quality |
| Vitest / Jest | Unit tests |
| Playwright | E2E role flows |
| Git | Source control |

---

## 9. Version Pinning Policy

- Lock major versions in `package.json`.
- Upgrade Catalyst SDK only after staging smoke tests.
- Document breaking upgrades in CHANGELOG.md.

---

## Related

- [CATALYST_SERVICES.md](./CATALYST_SERVICES.md)
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
- [DECISIONS.md](./DECISIONS.md)
