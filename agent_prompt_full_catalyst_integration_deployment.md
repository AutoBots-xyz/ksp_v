# AI Agent Prompt — Full Catalyst Integration & Deployment (KSP Crime Intelligence Platform)

Copy everything below the line into your coding agent (e.g. Claude Code) with access to the project's codebase at `D:\KSP_PROJECT`. This is the master integration + deployment pass: wire every Catalyst service the project claims to use, deploy every deployable component, and verify the database is live and populated — using `docs.catalyst.zoho.com` as the source of truth wherever behavior needs confirming, not assumptions.

---

## ROLE

You are a senior Zoho Catalyst platform engineer responsible for taking this project from "code exists" to "fully deployed and integrated on Catalyst." The project's own architecture reference (`code.md`, already in the repo) documents 11 Catalyst services the platform is meant to use, 14 serverless function targets, 2 Circuits, 4 Cron jobs, a relational Data Store schema, a NoSQL graph collection, Cache, Stratus, Authentication, and API Gateway. Your job is to confirm each of these is genuinely wired to the real Catalyst SDK (not a stub or mock — this codebase has a documented history of hardcoded/mock data behind working-looking UI, per prior audits), fix any deployment-blocking configuration issues, deploy everything, and get the live database populated.

**Authoritative reference:** https://docs.catalyst.zoho.com/en/ — fetch and check the relevant section before configuring or asserting how any Catalyst service behaves. Console UI, CLI flags, and service availability change over time; don't rely on memory alone. Where the official docs don't cover something (e.g. a very new feature), search the web for recent Zoho Catalyst release notes or community documentation and say so explicitly.

**Tooling note:** If a `codebase-memory` MCP tool is available (this project already uses one — see `package.json`'s `brain:index`/`brain:status`/`brain:changes`/`brain:arch` scripts), use it to navigate the codebase and locate every Catalyst SDK call site before making changes.

**Ground truth documents already in this repo — read these first, don't rediscover from scratch:**
- `code.md` — master architecture reference (tech stack, directory layout, RBAC roles, Catalyst service mapping table in its Section 6, deployment runbook in Section 7)
- `catalyst.json` — deployment configuration (has a known history of JSON syntax errors — validate it's currently well-formed before trusting it)
- `CATALYST_SERVICES.md`, `CATALYST_INTEGRATION.md` — prior service-by-service documentation
- Any `docs/QUICKML_PREDICTIVE_SETUP.md`, `docs/QUICKML_CONSOLE_RUNBOOK.md`, `docs/DATASTORE_CONSOLE_RUNBOOK.md` if they exist from earlier work

---

## PHASE A — Configuration Validation (do this before anything else)

### A.1 Validate `catalyst.json`
- Confirm it's valid JSON (no trailing commas, no missing brackets).
- Confirm `functions.targets` lists all 14 function folders that actually exist under `functions/` (cross-check with `dir functions` / `ls functions` — do not trust the array without verifying against the real folder structure). Known targets per `code.md`: `health`, `auth_context`, `cases`, `masters`, `analytics`, `network`, `ai`, `alerts`, `reports`, `admin`, `ingest`, `entities`, `search`, `offenders`.
- Confirm `common`, `dist`, and `events` folders under `functions/` are intentionally excluded from `targets` (shared code, build output, and possibly event-triggered functions respectively) — verify this is correct rather than assuming.
- Confirm the `slate` entry points at `apps/web` with the correct app name.
- Confirm `api_gateway.base_path` (`/api/v1`), `auth`, and `cors.origins` match what the frontend's API client actually calls — check `apps/web/src/lib/api-client.ts` or equivalent for the base URL it targets, and flag any mismatch.
- Confirm `circuits` and `jobs` arrays reference files that actually exist at those paths.

### A.2 Validate `package.json` workspaces
- Confirm root `package.json` declares `"workspaces": ["apps/web", "functions"]` (or equivalent) so workspace-scoped build commands (`npm run build --workspace apps/web`) resolve correctly.

### A.3 Confirm CLI authentication state
- Assume `catalyst login` and `catalyst project:use` may already be done (check `.catalystrc` for a linked project name) — if not, that's a manual step you cannot perform yourself; flag it clearly and pause rather than guessing at project IDs.

**Phase A exit criteria:** `catalyst.json` parses cleanly, every listed function target has a matching real folder, and workspace declarations are correct.

---

## PHASE B — Verify Every Claimed Catalyst Service Is Really Wired (not mocked)

For each row in `code.md`'s Section 6 integration table, trace the actual code and confirm it calls the real Catalyst SDK, not a stub, mock, or hardcoded fallback. This project has a documented history (see prior audit artifacts if present) of UI/endpoints that *look* wired but return hardcoded data — do not take the architecture doc's claims at face value.

| Service | What to verify | Where to look |
|---|---|---|
| Slate / Web Client Hosting | Slate deploy config matches `apps/web`, builds successfully | `catalyst.json` slate entry, `apps/web/next.config.js` |
| API Gateway | Base path, CORS, auth guard actually enforced, not just configured | `catalyst.json` api_gateway entry, test an unauthenticated request against a protected route |
| Serverless Functions (all 14) | Each function's `index.ts`/`index.js` calls the real `zcatalyst-sdk-node` client, not a mock/stub returning static JSON | `functions/*/index.ts`, cross-check for `TODO`, `stub`, `mock`, or hardcoded response objects |
| Data Store (ZCQL) | `datastore.ts`'s query builder actually executes ZCQL against a live table, not an in-memory array | `functions/common/datastore.ts`, `functions/common/repositories/*.ts` |
| NoSQL (graph_edges) | Network functions read/write the real NoSQL collection, not `INITIAL_NODES`/`INITIAL_EDGES`-style hardcoded arrays (a specific issue found in prior audits of this project) | `functions/network/`, `nosql/graph_edges.md` |
| Stratus | Evidence/report file uploads actually call the Stratus SDK with a real bucket name, not a local filesystem write | `functions/reports/`, `functions/ingest/` |
| Cache | Cache-aside pattern actually calls Catalyst Cache get/set, not an in-memory JS object that resets on every cold start | wherever `cacheAside` or similar is implemented |
| Circuits | `fir_import_pipeline.json` and `report_generate.json` are valid Circuit definitions targeting real functions, and — critically — check whether they're triggered via Cron or the newer Job Scheduling service, since Job-Scheduling-triggered Circuits have documented data-center restrictions (check current status for the project's data center) | `circuits/*.json` |
| Cron / Job Scheduling | `jobs/*.json` target the correct scheduler component; confirm which one is actually configured and whether Job Scheduling Early Access was granted if that's what's used | `jobs/*.json` |
| Authentication | Login page correctly wired to the embedded SDK (if this was completed in a prior session, verify it rather than redoing it) | `apps/web/src/app/login/page.tsx`, `apps/web/src/lib/catalyst-auth.ts` |
| QuickML / Zia AutoML | Confirm which one the `ai` function actually calls, and whether it's genuinely deployed (a callable endpoint) vs. still returning a `NOT_CONFIGURED`/mock status | `functions/ai/index.ts` |
| SmartBrowz | Report generation calls the real headless-browser/PDF service, not a placeholder | `functions/reports/index.ts` |
| Mail / Push Notifications | Alert dispatch actually calls Catalyst Mail/Push SDKs with a verified domain/registered keys, not a no-op | `functions/alerts/`, wherever notifications are dispatched |

For every ⚠️/❌ finding, note it — you'll fix code-level ones in Phase C and flag console-only ones for the human in Phase F.

---

## PHASE C — Fix and Deploy Functions + Slate

### C.1 Fix any stub/mock code found in Phase B
For each function found calling a mock instead of the real Catalyst SDK, implement the real integration using the correct SDK method — check `docs.catalyst.zoho.com`'s SDK reference for the exact method signatures (e.g. `zcatalyst-sdk-node`'s `datastore()`, `cache()`, `stratus()`, `zia()` accessors). Do not silently leave a mock in place and mark it done.

### C.2 Deploy
```
catalyst deploy
```
Confirm all 14 functions deploy without error, and Slate builds and deploys successfully. If a specific function fails, diagnose that function's own error (dependency issue, syntax error, missing `catalyst-config.json`) rather than assuming it's a global config problem — global config problems (like the `catalyst.json` trailing comma issue found earlier in this project) produce a different class of error (`path argument must be of type string`) than a genuine per-function bug.

### C.3 Record the live Slate URL
Note the deployed access URL from the Build URL page — this is needed for Authentication's Authorized Domains setting (console-side, flag for the human if not already done).

---

## PHASE D — Database Setup (Data Store + NoSQL)

### D.1 Derive schema from seed data and code
Inspect `datastore/schema/` (if table definitions exist there) and every seed file under `datastore/seeds/`. Cross-reference every ZCQL query in `functions/**/index.ts` (search for `SELECT`, `INSERT`, `UPDATE`, `WHERE`, `JOIN`) to confirm the schema you're about to have the human create covers every column actually queried in code.

### D.2 Produce (or update) the console schema runbook
If `docs/DATASTORE_CONSOLE_RUNBOOK.md` already exists from prior work, verify it's still accurate against the current codebase; if not, create it — exact table names, columns, types, and required indexes, written for a human to follow in the Catalyst console (Data Store → Create Table). Include the NoSQL `graph_edges`/`NetworkEdges` collection per `nosql/graph_edges.md`'s documented schema (`srcType`, `srcId`, `dstType`, `dstId`, `rel`, `weight`).

### D.3 Seed the live database
Once the human confirms schema creation is done (flag this as a required manual step — you cannot create console-side schema yourself), run:
```
npm run seed
```
Watch for per-table errors. If the seeder script has any local-only shortcuts or silent no-ops against a real project, fix them (see Phase B's Data Store verification).

### D.4 Verify
Confirm real row counts via a ZCQL query per table, and confirm the NoSQL collection has real entries (not just schema with zero items).

---

## PHASE E — Circuits, Jobs, and Async Infrastructure

### E.1 Verify Circuit definitions
Confirm `circuits/fir_import_pipeline.json` and `circuits/report_generate.json` reference real, deployed function names as their steps (matching Phase C's deployed targets exactly).

### E.2 Deploy Circuits and Jobs
Check the current CLI syntax for deploying these (`catalyst deploy` may cover them if listed in `catalyst.json`, or they may need a separate deploy scope — verify against docs). Confirm the nightly aggregates, cache warm, anomaly scan, and weekly model retrain jobs are all correctly targeting live functions.

### E.3 Data-center restriction check
Confirm the project's actual Catalyst data center (check console Project Info), and cross-reference against current documented restrictions for: Circuits triggered via Job Scheduling, Zia AutoML, and QuickML LLM Serving/RAG (no-code pipelines may have different availability — verify specifically). Flag anything that won't work in this project's data center rather than deploying something that will silently fail.

---

## PHASE F — Console-Only Items (cannot be done by you — produce instructions instead)

For anything requiring a human in the browser, do not attempt it — instead produce or update a runbook. This includes at minimum:
- Data Store/NoSQL schema creation (Phase D.2, if not already done)
- Authentication configuration and Authorized Domains (if not already completed in a prior session — verify rather than assume)
- Stratus bucket creation
- Mail domain SPF/DKIM verification
- Connections OAuth setup for third-party integrations
- Push Notification provider keys (FCM/APNs)
- QuickML pipeline deployment (if not already done — check for `docs/QUICKML_CONSOLE_RUNBOOK.md`)
- Domain Mappings for a custom domain
- API Gateway enablement (only if not already using it — flag the outage risk of enabling it without every function's API entry ready)

For each, either confirm it's already done (cite evidence) or produce a precise numbered runbook the human can follow.

---

## PHASE G — Final Verification & Report

Produce a final status report covering:
1. Every one of the 14 functions: deployed successfully, calling real Catalyst services (not mocks)
2. Slate: deployed, live URL recorded
3. Data Store + NoSQL: schema exists, seeded, verified row counts
4. Circuits + Jobs: deployed, targeting correct live functions
5. Every service in Phase B's table: ✅ real / ⚠️ needs follow-up / ❌ still mocked, with file evidence
6. Every Phase F item: done (with evidence) or a runbook produced (with file path)
7. A single ranked list of what's still blocking a genuinely live, fully-integrated deployment — not just "code exists" but "verified working against real Catalyst infrastructure"

---

## OUTPUT FORMAT RULES
- Never mark a service "integrated" based on the architecture doc's claim alone — always find and cite the actual SDK call in code.
- Never fabricate a fix for something that requires console access — produce a runbook instead, clearly labeled as a manual step.
- Every claim about Catalyst service behavior, restrictions, or setup steps must cite a specific `docs.catalyst.zoho.com/en/` page (or a clearly-labeled web search result if the docs don't cover it) that you actually checked during this session — not prior training knowledge alone.
- If you find a genuine conflict between what `code.md` claims and what the code actually does, flag it explicitly and note whether you fixed the code or whether `code.md` needs correcting instead.
- Do not proceed to Phase D's live seeding until Phase C's function deploys are confirmed clean — the app has no functions to serve the data otherwise.
