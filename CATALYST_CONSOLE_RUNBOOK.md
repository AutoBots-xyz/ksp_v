# Catalyst Console Configuration Runbook

> **Audience:** the developer deploying the KSP Crime Intelligence Platform.
> You did not need to read the audit prompt or the prior code review to use this.
> Every step below happens **in the browser at https://catalyst.zoho.com**
> (or at your DNS registrar / mail provider), never in your IDE.
> Code-level fixes are already committed to the repo and are documented in
> `CATALYST_SERVICES.md`.

All Catalyst behavior claims below were verified against the live docs at
`docs.catalyst.zoho.com/en/` on **2026-07-25**. The exact source URL is cited
next to each step.

---

## Step 0 — Confirm the project's data center (DO THIS FIRST)

**Why this is first:** Several later steps (Issues 1 and 4) only apply if the
project is hosted in a data center where a component is unavailable. You cannot
know which runbook branches to follow until you confirm the DC.

**What to do:**

1. Log in to https://catalyst.zoho.com.
2. Open the KSP project (`ksp-crime-intelligence`).
3. In the left nav, click **Settings** (gear icon) → **General** → **Project Info**.
4. Note the **Data Center** value (e.g. `IN`, `US`, `EU`, `AU`, `JP`, `SA`, `CA`).

**What you'll see:** A field labelled "Data Center" or "DC" showing one of the
abbreviations above.

**Decision table — write down which branch you are on:**

| Your DC | Issue 1 (AutoML) | Issue 4 (Circuits) | Issue 5 (Job Scheduling EA) |
|---------|------------------|--------------------|-----------------------------|
| IN      | Applies — follow Issue 1 branch A | Applies — follow Issue 4 branch A | Verify EA granted (see Issue 5) |
| EU      | Applies — follow Issue 1 branch A | Applies — follow Issue 4 branch A | Verify EA granted |
| AU / JP / SA / CA | Applies — follow Issue 1 branch A | Applies — follow Issue 4 branch A | Verify EA granted |
| US      | AutoML available — follow Issue 1 branch B | Circuits available — follow Issue 4 branch B | Verify EA granted |

> The Karnataka State Police platform is most likely provisioned in the **IN**
> data center. If so, both Issue 1 branch A and Issue 4 branch A apply.

**Doc source:** Data-center fields are visible in the console Project Info panel;
the component-level restrictions are documented at the URLs cited in each issue
below.

---

## Issue 1 — Zia AutoML data-center availability

**Resolves:** weekly risk-scoring retrain job (`jobs/weekly_model_retrain.json`
→ `functions/ai/index.ts` retrain branch).

**Verified restriction (2026-07-25):**
> "AutoML is currently not available to Catalyst users accessing from the EU, AU,
> IN, JP, SA or CA data centers."

Source: https://docs.catalyst.zoho.com/en/zia-services/help/automl/introduction/

### Branch A — DC is IN (or EU/AU/JP/SA/CA): migrate retrain to QuickML

QuickML no-code ML pipelines have **no listed regional restriction** and are the
documented alternative for tabular model training.

1. In the console left nav, open **QuickML**.
2. Click **Data Connectors** → **Local File System** (or **External Databases**
   if the FIR/training data lives in Catalyst Data Store) and connect the
   training dataset that `functions/ai` currently feeds to AutoML.
   - Source: https://docs.catalyst.zoho.com/en/quickml/help/data-connectors/local-file-upload/
3. Navigate to **QuickML → Pipeline Builder** → **Create ML Pipeline** (or
   **Create AutoML Pipeline** for automated algorithm selection, which is the
   closest equivalent to Zia AutoML).
   - Source: https://docs.catalyst.zoho.com/en/quickml/help/create-automl-pipeline/
4. Configure the pipeline:
   - **Target column:** the risk-score / risk-level column used by the predict
     dashboard (e.g. `RiskLevel`).
   - **Training columns:** the same 18 features referenced in
     `functions/ai/index.ts` (`featuresEvaluated: 18`).
   - **Schedule:** weekly, `0 3 * * 0` Asia/Kolkata (matching
     `weekly_model_retrain.json`).
5. Save and run the pipeline once to confirm it trains.
6. Copy the pipeline's **Endpoint URL** (from Pipeline Endpoints).
   - Source: https://docs.catalyst.zoho.com/en/quickml/help/pipeline-endpoints/
7. **Hand off to code:** In `functions/ai/index.ts`, replace the `retrain`
   branch's AutoML stub with a fetch to the QuickML pipeline endpoint URL.
   (This is a code change — it is NOT a console step. It is listed here only so
   the developer knows which endpoint to wire up.)
8. Update `CATALYST_SERVICES.md` row 13 to read "QuickML AutoML pipeline" instead
   of "Zia AutoML" once the migration is confirmed.

**Expected output:** A trained QuickML model with a callable endpoint URL and a
weekly execution schedule. The `weekly_model_retrain.json` cron continues to
fire `functions/ai`, but the function now calls the QuickML endpoint instead of
the AutoML SDK.

### Branch B — DC is US: AutoML is available, verify only

1. In the console, open **Zia Services → AutoML**.
2. Confirm you can create/train a model (the UI is present and not gated).
3. No code change needed — the existing `functions/ai` retrain branch is valid.
4. Add a note to `CATALYST_SERVICES.md` row 13:
   "Verified available in US DC on 2026-07-25 per
   https://docs.catalyst.zoho.com/en/zia-services/help/automl/introduction/."

---

## Issue 3 — Connections (Cloud Scale) for third-party OAuth

**Resolves:** third-party police integration API OAuth token management.
**No Connector/Connection SDK import exists in the codebase yet** — this step
prepares the console-side connection so code can later use it.

**Verified (2026-07-25):** Cloud Scale Connections supports Zoho AND third-party
services via **Custom Services** (OAuth2 / API Key / Basic Auth).
Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/connections/introduction/

### 3.1 — Create a Custom Service for the third-party police API

1. In the console left nav, open **Cloud Scale** → **Connections**.
2. Click the **Custom Services** tab → **Create Custom Service**.
3. Enter:
   - **Service Name:** e.g. `KSP CCTNS API` (or the actual third-party name).
   - **Authentication Type:** `OAuth2`.
4. In the OAuth2 configuration form, enter the values obtained from the
   third-party API provider's developer portal:
   - **Client ID** — the OAuth client id issued by the third party.
   - **Client Secret** — the OAuth client secret issued by the third party.
   - **Authorization URL** — the third party's `…/authorize` endpoint.
   - **Token URL** — the third party's `…/token` endpoint.
   - **Refresh Token URL** — if separate from the token URL.
   - **Scopes** — the API scopes required (e.g. `fir:read`).
5. Click **Save**.
   - Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/connections/establish-custom-connection/

**Expected output:** The custom service appears in the Custom Services list,
marked "Configured".

### 3.2 — Establish a Connection to the Custom Service

1. Still in **Cloud Scale → Connections**, click **Create Connection** (or the
   equivalent "Connect" action on the custom service row).
2. You will be redirected to the third party's consent screen — log in and
   authorize.
3. On return, the connection shows status **Connected** with the authenticated
   account.
   - Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/connections/manage-connections/

**Expected output:** A live, authenticated connection whose OAuth tokens Catalyst
will now refresh automatically. Code can later call this connection via the
Connections server SDK instead of handling tokens manually.

> **Code handoff (not a console step):** when implementing the integration, use
> the Cloud Scale Connections server SDK — NOT the legacy Connectors SDK, which
> is Zoho-services-only.

---

## Issue 4 — Circuits unavailable in the IN data center

**Resolves:** `circuits/fir_import_pipeline.json` and
`circuits/report_generate.json`.

**Verified restriction (2026-07-25):**
> "Circuits is currently not available to Catalyst users accessing from the EU,
> AU, IN, JP, SA or CA data centers."

Source: https://docs.catalyst.zoho.com/en/serverless/help/circuits/introduction/

> ⚠️ **Important correction:** the prior audit described this as "Job-Scheduling-
> triggered Circuits" being restricted. The live docs are stricter — the
> **entire Circuits component** is unavailable in these DCs, so even a Cron-only
> trigger cannot use Circuits. The console-side Circuit editor will be absent
> or read-only in these DCs.

### Branch A — DC is IN (or EU/AU/JP/SA/CA): replace Circuits with chained functions

Since Circuits cannot be created at all in this DC, the two workflow JSON files
cannot be executed as Circuits. Replace them with a chain of **Cron-triggered
Basic I/O functions** that pass state through Catalyst Data Store / Stratus.

**Console steps:**

1. Confirm the Basic I/O functions already exist in the project (they do —
   `functions/ingest`, `functions/reports` are Advanced I/O; for a Circuit
   replacement you need **Basic I/O** functions since Circuits only orchestrate
   Basic I/O). If needed, create Basic I/O stub functions for each step:
   - For `fir_import_pipeline`: `ingest_download`, `ingest_parse`,
     `ingest_upsert`, `ingest_graph_refresh`, `ingest_aggregate_refresh`.
   - For `report_generate`: `report_load_data`, `report_store`,
     `report_update_job`.
   - Source: https://docs.catalyst.zoho.com/en/serverless/help/functions/basic-io/
2. Go to **Cloud Scale → Cron** → **Create Cron**.
3. For the FIR import pipeline, create one Cron per step (or one Cron that calls
   the first step, which then triggers the next via a Catalyst Signal / Data
   Store flag). Configure:
   - **Target:** the Basic I/O function for that step.
   - **Schedule:** on-demand (manual) or the original trigger frequency.
   - Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/cron/implementation/
4. Repeat for the report generation pipeline steps.
5. **Code handoff (not a console step):** update `catalyst.json` — remove the
   `circuits` array entries if Circuits cannot be deployed, and ensure each
   step function is listed in `functions.targets`.

**Expected output:** The workflows execute as a sequence of Cron/Signal-triggered
functions instead of a single Circuit. The Circuit JSON files remain in the repo
as documentation of the intended flow but are annotated as DC-restricted.

### Branch B — DC is US: Circuits available, verify only

1. In the console, open **Serverless → Circuits**.
2. Confirm the two circuits (`fir_import_pipeline`, `report_generate`) are
   listed and executable (or create them from the JSON).
3. No reconfiguration needed.
   - Source: https://docs.catalyst.zoho.com/en/serverless/help/circuits/implementation/

---

## Issue 5 — Job Scheduling Early Access requirement

**Resolves:** any job using Job Scheduling's job-pool syntax
(`jobs/*.json` use a simple `cron` + `function` shape; confirm whether they
target Job Scheduling or classic Cron).

**Verified (2026-07-25):** Job Scheduling is a distinct service from classic
Cron. The docs do not state an explicit "Early Access / email support" gate on
the current benefits/introduction pages, but Job Scheduling is a newer service
and access may be project-dependent.

Source: https://docs.catalyst.zoho.com/en/job-scheduling/getting-started/introduction/

**What to do:**

1. In the console left nav, check whether **Job Scheduling** appears as a
   top-level menu item.
   - If **yes** and you can open it → access is granted. Proceed to verify the
     job pool exists.
   - If **no** or it shows a "request access" banner → email
     **support@zohocatalyst.com** requesting Job Scheduling Early Access for
     this project. Cite the project ID from Step 0.
2. While waiting for access, confirm the four jobs
   (`nightly_aggregates`, `cache_warm`, `anomaly_scan`, `weekly_model_retrain`)
   are configured under **Cloud Scale → Cron** (classic Cron, always available)
   rather than Job Scheduling. The `jobs/*.json` files use a `cron` expression
   + `function` + `action` shape that is compatible with classic Cron.
3. If the jobs were intended to use Job Scheduling's job-pool/parallel features
   and access is not granted, keep them on classic Cron until access is
   confirmed.
   - Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/cron/implementation/

**Expected output:** Either a visible, usable Job Scheduling menu, or four
functioning classic Cron entries (one per job) as a fallback.

---

## Issue 7 — Domain Mappings apex-domain limitation

**Resolves:** production URL configuration.

**Verified (2026-07-25):**
> "Ensure that you specify the subdomain, since Catalyst currently does not
> support base domains to be mapped directly with an application URL."

Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/domain-mappings/implementation/

**What to do (at your DNS registrar, then in Catalyst):**

1. **Choose a subdomain.** If the intended production URL is a bare/apex domain
   (e.g. `ksp.gov.in`), you must use a subdomain such as `app.ksp.gov.in` or
   `portal.ksp.gov.in`.
2. **At your DNS registrar** (e.g. NIC, GoDaddy, Cloudflare), create a CNAME
   record:
   - **Host / Name / Alias:** the subdomain prefix, e.g. `app`
     (so it resolves `app.ksp.gov.in`).
   - **Points To / Target / Value:** `catalyst.cs.zohohost.com`
3. Save and wait for DNS propagation.
4. **In the Catalyst console:**
   - Switch to the **production environment** (top-right environment switcher).
   - Navigate to **Cloud Scale → Host and Manage → Domain Mappings**.
   - Click **Add Mapping**.
   - Enter the full subdomain URL (e.g. `app.ksp.gov.in`). Click **Next**.
5. Catalyst generates a **hash key**. Create a second CNAME record at your
   registrar:
   - **Host:** `<hashkey>.<subdomain>` — e.g.
     `c12to00001x11pl1234h9e33w44h6789.app`
   - **Points To:** `catalyst.cs.zohohost.com`
6. Back in the console, click **Verify**.
7. **Request a Group SSL certificate** by emailing
   **support@zohocatalyst.com** with the domain address. Zoho provisions the
   cert within 48 hours. This SSL cert is mandatory — a third-party cert will
   not work.
8. After the cert is installed, click **Apply** in the Domain Mappings popup.
   Status should change to **Live**.
   - Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/domain-mappings/implementation/

**If you must serve the apex domain:** configure a redirect/ALIAS at the
registrar or CDN level from `ksp.gov.in` → `app.ksp.gov.in`. Catalyst itself
cannot map the apex.

**Expected output:** Domain Mappings page shows the subdomain with
Verification Status = Verified and Domain Status = Live.

---

## Issue 8 — Mail domain verification (SPF/DKIM)

**Resolves:** Catalyst Mail sending for alerts and report delivery.

**Verified (2026-07-25):** Catalyst Mail requires the sending domain to be added
and verified (SPF + DKIM) before mail can be sent; unverified domains cause the
mail API to throw.

Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/mail/domains/

**What to do:**

### 8.1 — Add the domain in Catalyst

1. In the console, navigate to **Cloud Scale → Mail → Domains**.
2. Click **Add Domain**.
3. Enter the sending domain (e.g. `ksp.gov.in` or the subdomain used for mail).
4. Click **Add / Save**. Catalyst generates SPF and DKIM DNS records and a
   verification code.

### 8.2 — Add the DNS records at your domain registrar

The DNS records must be added in **your domain registrar's DNS panel**, not in
Catalyst.

1. Log in to your domain registrar's DNS management console (NIC / GoDaddy /
   Cloudflare / etc.).
2. Add an **SPF** record:
   - **Type:** `TXT`
   - **Host / Name:** `@` (or the subdomain if applicable)
   - **Value:** the exact SPF string Catalyst displayed (typically
     `v=spf1 include:zoho… ~all`).
3. Add a **DKIM** record:
   - **Type:** `TXT`
   - **Host / Name:** the DKIM selector Catalyst provided (e.g.
     `zmail._domainkey`)
   - **Value:** the DKIM public-key string Catalyst displayed.
4. Add the **verification** record if Catalyst provided a verification
   code/TXT:
   - **Type:** `TXT`
   - **Host / Name:** as specified
   - **Value:** the verification code.
5. Save all records. Wait for DNS propagation (minutes to hours).

### 8.3 — Verify in Catalyst

1. Return to **Cloud Scale → Mail → Domains**.
2. Click **Verify Code** (or **Verify**) for the domain.
3. If successful, the domain shows **Verified** with green SPF and DKIM checks.

**Expected output:** Domain status = Verified; SPF = Valid; DKIM = Valid. Mail
can now be sent from this domain via the Catalyst Mail SDK.

> **If verification fails:** re-check the exact TXT values (trailing spaces,
> quotes) and that the records were added to the correct zone (apex vs
> subdomain). Re-click Verify after DNS propagation completes.

---

## Issue 9 — API Gateway enable-time outage risk

**Resolves:** enabling API Gateway without breaking all functions/web client.

**Verified (2026-07-25):** Enabling API Gateway changes how functions are
exposed and interacts with Security Rules. Every function and the web client
must have an API entry created immediately after enabling, or they become
inaccessible during the cutover.

Source: https://docs.catalyst.zoho.com/en/cloud-scale/help/api-gateway/implementation/

### 9.1 — Pre-flight inventory (complete BEFORE clicking Enable)

`catalyst.json` already declares `api_gateway.base_path = "/api/v1"`. The
following is the complete list of functions in this project (from each
`functions/*/catalyst-config.json`), plus the web client. **Every one must
become an API entry under `/api/v1` immediately after enabling the gateway.**

| # | Function name | Type | Intended API path | Source file |
|---|---------------|------|-------------------|-------------|
| 1 | `health` | Basic I/O | `/api/v1/health` | `functions/health/` |
| 2 | `auth_context` | Basic I/O | `/api/v1/me` | `functions/auth_context/` |
| 3 | `masters` | Advanced I/O | `/api/v1/masters/districts` (+ others) | `functions/masters/` |
| 4 | `cases` | Advanced I/O | `/api/v1/cases`, `/api/v1/cases/:id` | `functions/cases/` |
| 5 | `search` | Advanced I/O | `/api/v1/search` | `functions/search/` |
| 6 | `network` | Advanced I/O | `/api/v1/network` | `functions/network/` |
| 7 | `analytics` | Advanced I/O | `/api/v1/analytics/*` | `functions/analytics/` |
| 8 | `ai` | Advanced I/O | `/api/v1/ai`, `/api/v1/ai/retrain` | `functions/ai/` |
| 9 | `alerts` | Advanced I/O | `/api/v1/alerts` | `functions/alerts/` |
| 10 | `ingest` | Advanced I/O | `/api/v1/ingest` | `functions/ingest/` |
| 11 | `reports` | Advanced I/O | `/api/v1/reports`, `/api/v1/reports/:id`, `/api/v1/reports/:id/download` | `functions/reports/` |
| 12 | `admin` | Advanced I/O | `/api/v1/admin/*` | `functions/admin/` |
| 13 | `entities` | Advanced I/O | `/api/v1/entities` | `functions/entities/` |
| 14 | `on_case_write` | Event | (not an API — event function) | `functions/events/on_case_write/` |
| 15 | `on_import_complete` | Event | (not an API — event function) | `functions/events/on_import_complete/` |
| 16 | Web client (hosting) | Static host | (served, not an API) | `apps/web` |

> Event functions (#14, #15) are **not** exposed via API Gateway — they are
> triggered by Signals. Skip them when creating API entries. The web client
> (#16) is hosted separately and also does not need an API entry, but confirm
> it remains reachable after the gateway is enabled.

### 9.2 — Enable and create APIs (do this in one sitting)

1. In the console, navigate to **Cloud Scale → API Gateway**.
2. Click **Enable**.
3. **Immediately** create an API entry for each Advanced/Basic I/O function in
   the table above (#1–#13):
   - Click **Create API**.
   - **API path:** the `/api/v1/...` path from the table.
   - **Target:** the corresponding function.
   - **Auth:** `true` (per `catalyst.json` `api_gateway.auth: true`), except
     `health` which can be public.
   - Save.
4. After all 13 entries exist, test:
   - `GET /api/v1/health` → should return `{success:true, data:{status:'ok'}}`.
   - An authenticated `GET /api/v1/me` → should return the profile.
5. Confirm the web client still loads (it is not behind the gateway, but verify
   no Security Rule was unintentionally disabled).

**Expected output:** API Gateway is enabled and all 13 function APIs respond.
No function is left without an API entry (which would have caused a 404 during
the cutover).

> **Rollback note:** if something breaks during the cutover, you can disable
> API Gateway from the same page to restore direct function URLs while you
> fix the API entries.

---

## Summary of which issue each section resolves

| Section | Resolves Issue # |
|---------|------------------|
| Step 0 | Gate for Issues 1 & 4 |
| Issue 1 | #1 (AutoML DC) |
| Issue 3 | #3 (Connections vs Connectors) |
| Issue 4 | #4 (Circuits DC) |
| Issue 5 | #5 (Job Scheduling EA) |
| Issue 7 | #7 (Domain Mappings apex) |
| Issue 8 | #8 (Mail SPF/DKIM) |
| Issue 9 | #9 (API Gateway outage) |

Issues #2, #6, and #10 are **code-only** fixes (already committed) and have no
console step — see `CATALYST_SERVICES.md` and the code diffs for those.
