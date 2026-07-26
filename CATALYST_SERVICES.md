# Catalyst Services

**Mandatory mapping** of platform capabilities to Zoho Catalyst services, based on `CATALYST_KSP .txt`.

> Using a third-party alternative when a Catalyst service is available may affect submission validity.  
> **Deployment via Catalyst is mandatory for all submissions, without exception.**

---

## 1. Service Catalog (from Catalyst brief)

| # | Capability | Required Catalyst Service | Used in this project |
|---|------------|---------------------------|----------------------|
| 1 | Serverless functions / backend logic | **Catalyst Serverless (Functions)** | Yes — all domain APIs, middleware |
| 2 | Docker image deployment | **Catalyst AppSail — Custom (OCI/Docker) Runtime** | Planned — `appsail/ml-worker` for heavy ETL/ML batch (see `appsail/README.md`) |
| 3 | Full web app in managed runtime | **Catalyst AppSail — Catalyst-Managed Runtime** | Optional — SSR path (same AppSail service as #2, alternate runtime mode) |
| 4 | Frontend / SPA / Next.js / static site | **Catalyst Slate or Web Client Hosting** | Yes — primary UI host |
| 5 | Custom domain + SSL | **Catalyst Domain Mappings** | Yes — staging/prod URLs |
| 6 | Relational database | **Catalyst Data Store** | Yes — FIR ER + profiles + aggregates |
| 7 | Unstructured / semi-structured data | **Catalyst NoSQL** | Yes — graph edges, flexible docs |
| 8 | Object / blob storage (S3-style) | **Catalyst Stratus** | Yes — imports, PDFs, exports |
| 9 | Cache | **Catalyst Cache** | Yes — KPI & map aggregates |
| 10 | Full-text search (within Data Store) | **Catalyst Data Store** | Yes — case text / CrimeNo search |
| 11 | Text LLMs / RAG / knowledge bases | **Catalyst QuickML (LLM Serving, RAG)** | Optional — SOP RAG chat; NOT wired in v1 (separate from Zia Text Analytics) |
| 12 | No-code ML pipelines | **Catalyst QuickML** | Yes — feature pipelines; Phase 2.3 predictive risk-scoring pipeline (console-side deployment pending, see `docs/QUICKML_PREDICTIVE_SETUP.md`) |
| 13 | Automated model training (tabular) | **Catalyst QuickML** (replacing Zia AutoML) | Yes — risk scoring models. Migrated from Zia AutoML → QuickML because AutoML is unavailable in IN/JP/SA/CA DCs. `functions/ai` `/retrain` calls the QuickML endpoint once `QUICKML_PIPELINE_ENDPOINT` is set. |
| 14 | Sentiment / keyword extraction (text analytics) | **Catalyst Zia Text Analytics** | Yes — `functions/ai` uses `app.zia().analyzeSentiment()` + `extractKeyword()` (distinct from QuickML LLM Serving). Live: `GET /ai` |
| 14b | Statistical anomaly detection (z-score) | **Catalyst Data Store (ZCQL)** | Yes — `functions/ai` `/ai/anomalies` computes z-scores over rolling 30-day baselines per district+category. Live: `GET /ai/anomalies` |
| 14c | Organized-crime community detection (label propagation) | **Catalyst NoSQL (NetworkEdges)** | Yes — `functions/network` `/network/communities` runs label-propagation community detection over the offender graph. Live: `GET /network/communities` |
| 15 | OCR / Face / Image / Barcode / ID | **Catalyst Zia Services** | Future — scanned annexures |
| 16 | Voice services | **Catalyst Zia Services** | Future — not v1 |
| 16 | PDF / screenshots / headless browser | **Catalyst SmartBrowz** | Yes — intelligence PDF packs |
| 17 | User auth / login / signup | **Catalyst Authentication** | Yes — **role-based login foundation** |
| 18 | API routing, throttling, auth fronting Functions | **Catalyst API Gateway** | Yes — all `/api/v1` |
| 19 | OAuth tokens for Zoho / 3rd-party | **Catalyst Connections (Cloud Scale)** | As needed for Zoho + third-party APIs (Custom Service OAuth2) |
| 20 | Scheduled jobs / cron / job pools | **Catalyst Cron / Job Scheduling** | Yes — aggregates, retrain, scans |
| 21 | Reacting to in-project events | **Catalyst Signals + Event Functions** | Yes — import & case write hooks |
| 22 | Cross-app event bus | **Catalyst Signals** | Yes — event routing |
| 23 | Multi-step workflow orchestration | **Catalyst Circuits** | Yes — import & report pipelines (unavailable in EU/AU/IN/JP/SA/CA DCs) |
| 24 | Transactional email | **Catalyst Mail** | Yes — alerts & report delivery |
| 25 | Push notifications | **Catalyst Push Notifications** | Yes — spike alerts |
| 26 | CI/CD | **Catalyst Pipelines** | Yes — build & deploy |

---

## 2. Role-Based Login — Catalyst Authentication

### Why Catalyst Authentication

It is the **required** service for user auth/login/signup. Application RBAC builds on top of it.

### Design

| Layer | Responsibility |
|-------|----------------|
| Catalyst Authentication | Identity: signup/login/session/MFA/password policies |
| `UserProfile` (Data Store) | Authorization attributes: `role`, `districtId`, `unitId`, `employeeId`, `active` |
| API Gateway | Ensure request is authenticated before Function |
| Function middleware | Role allow-list + row-level scope |
| Frontend | Hide routes/modules; show role home |

### Role codes stored in UserProfile

`SUPER_ADMIN` · `SCRB_ANALYST` · `DISTRICT_COMMAND` · `SHO` · `IO` · `DATA_OPERATOR` · `AUDITOR` · `VIEWER`

### Admin lifecycle

1. Create user in Catalyst Authentication (or invite).
2. SUPER_ADMIN maps userId → Employee (optional) + role + unit/district in `UserProfile`.
3. User logs in → `/me` returns effective permissions.
4. Deactivate: set `UserProfile.active=false` and/or disable Auth user.

---

## 3. Feature → Service Binding (solution-specific)

| Product feature | Catalyst services |
|-----------------|-------------------|
| Login & RBAC | Authentication, API Gateway, Data Store, Functions |
| Case 360° & search | Functions, Data Store, Cache, API Gateway |
| District map & hotspots | Functions, Data Store, Cache, Slate/Web Client |
| Network graph | Functions, Data Store, NoSQL |
| Trend spike alerts | Cron, Functions, Signals, Mail, Push Notifications |
| Risk prediction | Zia AutoML / QuickML, Functions, Data Store |
| PDF intelligence report | SmartBrowz, Stratus, Mail, Circuits |
| FIR bulk import | Stratus, Circuits, Functions, Signals, Data Store |
| Production URL | Domain Mappings, Pipelines |
| Optional RAG on SOPs | QuickML RAG, Stratus (docs) |

---

## 4. Services Enabled Checklist (project setup)

- [ ] Authentication  
- [ ] API Gateway  
- [ ] Functions  
- [ ] Data Store  
- [ ] NoSQL  
- [ ] Stratus  
- [ ] Cache  
- [ ] Slate and/or Web Client Hosting  
- [ ] AppSail (if Docker/ML workers)  
- [ ] Domain Mappings  
- [ ] Signals  
- [ ] Circuits  
- [ ] Cron / Job Scheduling  
- [ ] Mail  
- [ ] Push Notifications  
- [ ] QuickML  
- [ ] Zia AutoML  
- [ ] SmartBrowz  
- [ ] Pipelines  
- [ ] Connections (if OAuth needed)  

---

## 5. Anti-Patterns (do not)

| Anti-pattern | Risk |
|--------------|------|
| Host API on non-Catalyst cloud | Submission invalid |
| Primary DB outside Data Store/NoSQL | Submission risk |
| Auth0/Firebase as system of record for login | Violates service #17 |
| OpenAI as only LLM path | Violates service #11 |
| Skip API Gateway (open Function URLs) | Weaker auth/throttle story |

---

## 6. Data-Center Restrictions (verified 2026-07-25)

The following Catalyst components have regional availability limits. **Before any
production deploy, confirm the project's data center in
`Settings → General → Project Info`** (see `CATALYST_CONSOLE_RUNBOOK.md`, Step 0).

| Component | Unavailable DCs | Doc source |
|-----------|-----------------|------------|
| Zia AutoML | EU, AU, IN, JP, SA, CA | https://docs.catalyst.zoho.com/en/zia-services/help/automl/introduction/ |
| Zia Text Analytics | (verify in console; no listed restriction at time of check) | https://docs.catalyst.zoho.com/en/zia-services/help/text-analytics/introduction/ |
| QuickML LLM Serving | Available only in US, IN, EU | https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/llm-serving/ |
| Circuits | EU, AU, IN, JP, SA, CA | https://docs.catalyst.zoho.com/en/serverless/help/circuits/introduction/ |
| Job-Scheduling-triggered Circuits | EU, AU, IN, CA (subset of Circuits restriction) | https://docs.catalyst.zoho.com/en/job-scheduling/getting-started/benefits/ |

**Impact on this project (KSP — Karnataka State Police, likely IN DC):**
- **AutoML** (`jobs/weekly_model_retrain.json` → `functions/ai` retrain branch): if DC is IN,
  the retrain job cannot use Zia AutoML. Migrate to a QuickML no-code ML pipeline
  (no regional restriction). Code branch already annotated; see runbook Issue 1.
- **Circuits** (`circuits/fir_import_pipeline.json`, `circuits/report_generate.json`):
  if DC is IN, Circuits cannot be used at all — not only via Job Scheduling. Both
  circuits must be reimplemented as a sequence of Cron-triggered Basic I/O functions
  or an AppSail workflow. See runbook Issue 4.

---

## 7. Connections vs. Legacy Connectors (verified 2026-07-25)

This project's planned third-party (non-Zoho) police-API OAuth integration must use
the **Cloud Scale Connections** component (`connections`), NOT the legacy
**Connectors** SDK (Zoho-services-only).

- Connections (Cloud Scale) supports Zoho AND third-party services via Default or
  Custom Services (OAuth2 / API Key / Basic Auth).
- Doc: https://docs.catalyst.zoho.com/en/cloud-scale/help/connections/introduction/
- Custom Service setup: https://docs.catalyst.zoho.com/en/cloud-scale/help/connections/establish-custom-connection/
- Console configuration of the third-party OAuth Client ID/Secret/Endpoints is a
  manual step — see `CATALYST_CONSOLE_RUNBOOK.md`, Issue 3.

> Note: no Catalyst Connector/Connection SDK import exists in the codebase today
> (grep for `connector|connection` in `functions/**/*.ts` returns zero matches).
> The OAuth-token-manager role is documented in `TECH_STACK.md` and `ROADMAP.md`
> but not yet implemented. When implemented, use the Connections server SDK, not
> the legacy Connectors SDK.

---

## 8. Related

- [CATALYST_INTEGRATION.md](./CATALYST_INTEGRATION.md)
- [CATALYST_CONSOLE_RUNBOOK.md](./CATALYST_CONSOLE_RUNBOOK.md)
- [SECURITY.md](./SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
