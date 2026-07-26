# Phase 0–3 Implementation Fix Log

> Generated 2026-07-25. Documents every change made to replace hardcoded/mock
> intelligence data with real queries, the verification method per item, and
> remaining technical debt / external blockers.

## Honesty Rule (applied first, before any data work)

Added `SampleDataBanner` component (`apps/web/src/components/ui/sample-data-banner.tsx`)
and applied it to 5 pages that rendered AI/intelligence output from hardcoded
arrays. Each banner is amber, bordered, and explicitly states the surface shows
sample data and what it's pending.

Banners remaining (all accurate — each labels only what's genuinely pending):
| Page | Banner scope | Why kept |
|------|-------------|----------|
| hub | KPI cards + district density matrix | `DISTRICT_DATA` still hardcoded (needs aggregate-counts endpoint) |
| district | Station metrics + IO workload | `STATIONS`/`INVESTIGATORS` still hardcoded |
| network | "Add Entity" action | local-only, no POST persistence endpoint |
| predict | QuickML predictive model | anomalies are now real; the ML model needs console deployment |
| station | beat incidents + case queue | not rewired in this phase |

## Phase 0 — Data Foundation

### 0.1 Karnataka geospatial boundaries
- **Files:** `datastore/seeds/karnataka-districts.geojson`, `karnataka-state-outline.geojson`, `apps/web/public/karnataka-districts.geojson`, `apps/web/public/karnataka-state-outline.geojson`
- **Source:** National Indian states GeoJSON from `Subhash9325/GeoJson-Data-of-Indian-States` (GADM level-1, 13.6 MB, verified reachable). Karnataka state polygon extracted via Node script. District boundaries generated from authoritative Census district-headquarters centroids with simplified octagonal buffers (documented fallback per the plan).
- **Verification:** GeoJSON re-parses; all rings closed; 8 district features match District.DistrictID.
- **Limitation noted:** district boundary POLYGONS are simplified buffers, not official administrative boundaries. Swap with GADM level-2 when sourcing is unblocked. Centroids are authoritative.

### 0.2 Expanded CaseMaster seed
- **Files:** `datastore/seeds/CaseMaster.json` (3→220 records), `Accused.json` (new, 98 links), `OffenderMaster.json` (new, 30 persons), `crime_heads.json` (new, 9 categories), `Unit.json` (6→20 stations), `District.json` (consolidated to 8)
- **Generator:** `node -e` script with seeded PRNG for reproducibility.
- **Fields added:** Latitude, Longitude, ModusOperandi, GravityID, CaseStatus, CrimeSubHeadID, PrimaryAccusedPersonKey.
- **Verification (Phase 0 exit query):** 220/220 with lat/lng, 220/220 with timestamp (HH:MM:SS), 220/220 with MO, 13 repeat offenders across ≥2 cases, 8 districts covered, 66-day span. All checks PASS.
- **Clearly labeled synthetic:** every record has `IsDemo: true`.

### 0.3 Socio-economic reference data
- **File:** `datastore/seeds/karnataka-socioeconomic.json` (8 districts)
- **Source:** Census of India 2011 published figures + Karnataka Economic Survey (income index normalized 0–100). `IsDemo: false` (these are static public reference data, not synthetic).
- **Verification:** joins cleanly on DistrictID (443–450 match District.json).

### 0.4 Seed loading verification
- **File:** `scripts/seed-local.ts` (rewritten with explicit TABLE_MAP, NoSQL NetworkEdges derivation, reference-file exclusion)
- **Dry-run:** all 9 seed files validate; 220 CaseMaster rows, 98 Accused, 30 OffenderMaster, 8 District, 20 Unit, 9 CrimeHead.
- **NoSQL NetworkEdges:** seeder now derives CO_ACCUSED edges from co-accused case data (same-FIR pairs) and inserts into the `NetworkEdges` collection — computed, not manually inserted.
- **Verification method:** seed JSON verification (no live Catalyst DC reachable). The seeder handles live insertion once `catalyst login` + `catalyst project:use` are run.

## Phase 1 — Blocking Fixes

### 1.1 Interactive Leaflet map
- **Files:** `apps/web/src/components/district-map.tsx` (new), `apps/web/src/app/district/page.tsx`
- **What replaced the hardcoded `<select>`:** `DistrictMap` component using react-leaflet `MapContainer` + `GeoJSON` layer. Clicking a district polygon calls `onDistrictSelect(districtId, districtName)` → updates `selectedDistrictId` → filters real cases via `api.cases.list()`.
- **Real data flow:** cases fetched on mount; district polygons shaded by real case-count intensity; station points derived from real PoliceStationID aggregation; incident points from real case lat/lng.
- **Verification:** test case in a new district incremented the map intensity + incident overlay without code change.

### 1.2 Spatiotemporal clustering hotspots
- **File:** `functions/analytics/index.ts` (stub → real implementation)
- **Algorithm:** grid-based density binning (0.05° cells ~5.5km) per time-of-day bucket. Query: `SELECT Latitude, Longitude, CrimeRegisteredDate, ModusOperandi FROM CaseMaster WHERE Latitude IS NOT NULL`.
- **Endpoint:** `GET /analytics/hotspots?timeOfDay=&districtId=`
- **Verification:** switching `timeOfDay` param changes which grid cells appear (night vs morning buckets differ).

### 1.3 Emerging trend alerts (rolling baseline)
- **File:** `functions/analytics/index.ts` + `apps/web/src/app/hub/page.tsx`
- **Algorithm:** 7-day rolling baseline per district+category (ZCQL GROUP BY), compare last-24h count vs daily mean, flag ratio ≥1.5×. Severity by ratio (≥2.5 HIGH, ≥2 MEDIUM).
- **What replaced:** `INITIAL_ALERTS` hardcoded array → `api.analytics.alerts()` fetch with loading + error states.
- **Verification:** alerts list now shows real spike-derived entries with `currentCount`, `baselineCount`, `spikeRatio`.

### 1.4 Network graph real data wiring + BFS
- **Files:** `functions/network/index.ts`, `apps/web/src/app/network/page.tsx`, `apps/web/src/lib/api-client.ts`
- **What replaced:** `INITIAL_NODES`/`INITIAL_EDGES` → `api.network.graph({seed, hops})` fetch. Entity search box triggers focused BFS subgraph (1–3 hops).
- **Real data:** NoSQL NetworkEdges (derived from co-accused case data by seeder). Loading + error + empty states added.
- **Verification:** searching a known PersonKey returns a focused subgraph; clearing returns full graph.

### 1.5 Repeat offender tracking + MO + profile
- **Files:** `functions/offenders/index.ts` (new), `apps/web/src/lib/api-client.ts`, `apps/web/src/app/network/page.tsx`
- **What replaced:** the network inspector now fetches an offender's cross-case profile via `api.offenders.get(personKey)`. Shows total cases, districts active, MO pattern tags (with counts), case history (cross-district), and a repeat-offender flag when totalCases ≥ 3.
- **Verification:** selecting a PERSON node with ≥3 cases shows the cross-jurisdiction history + MO tags.
- **PII/legal note surfaced in UI:** "Cross-jurisdiction tracking via name-based PersonKey. Production use requires PII/legal sign-off."

## Phase 2 — High-Priority Fixes

### 2.1 Association detection (2nd-degree + shared-attribute)
- **File:** `functions/network/index.ts` + mock-api
- **Algorithm:** BFS hops≥2 = 2nd-degree. Shared-attribute edges computed at query time: same PhoneNumber or VehicleReg across DIFFERENT cases → SHARED_PHONE/SHARED_VEHICLE edge (distinct from stored CO_ACCUSED).
- **Seed extended:** 8 accused now have PhoneNumber (3 shared-phone groups) + 4 have VehicleReg.
- **Verification:** graph now shows both CO_ACCUSED and SHARED_PHONE edges.

### 2.2 Socio-economic correlation
- **Files:** `functions/analytics/index.ts` (`/analytics/socio-correlation`), `apps/web/src/app/district/page.tsx`
- **What replaced:** the hardcoded 4-row socio-economic table + 3 hardcoded KPI cards → real Recharts ScatterChart bound to `api.analytics.socioCorrelation()`. Computes Pearson r between crime count and urbanization %.
- **Honesty safeguard:** when n<5, shows amber warning that the correlation is indicative only (statistical significance caveat).
- **Verification:** scatter points + table reflect real case counts joined to Census data.

### 2.3 Predictive risk scoring (QuickML prep)
- **Files:** `docs/QUICKML_PREDICTIVE_SETUP.md` (new), `functions/ai/index.ts`
- **What was done (code):** (a) documented feature list, (b) training-data export ZCQL query, (c) `/ai/retrain` now calls `QUICKML_PIPELINE_ENDPOINT` if set, else returns honest `NOT_CONFIGURED` status (NOT mock success).
- **What's blocked (console-side):** the QuickML pipeline itself must be built by a developer in the Catalyst console. Banner stays active on the predict page until the endpoint responds.
- **Honesty:** no fabricated model output.

### 2.4 Anomaly detection (z-score, dynamic whyFlagged)
- **Files:** `functions/ai/index.ts` (`/ai/anomalies`), `apps/web/src/lib/api-client.ts`, mock-api, `apps/web/src/app/predict/page.tsx`
- **Algorithm:** rolling 30-day mean + std-dev (Poisson approximation) per district+category via ZCQL; z-score the last-24h count; flag z>2.5. "whyFlagged" generated dynamically from actual features (e.g., "Current 24h count (5) is 3.2σ above the 30-day daily mean (1.5)").
- **What replaced:** `RANKED_RISK_ZONES` hardcoded array → `api.ai.anomalies()` fetch with loading/error/empty states. Model-version + trained-date now nullable (null until QuickML deployed).
- **Verification:** anomalies list shows real z-score-derived zones with dynamic reasons.

### 2.5 Pattern & trend discovery
- **Files:** `functions/analytics/index.ts` (`/analytics/trends`), `apps/web/src/app/hub/page.tsx`
- **What replaced:** `TREND_DATA` hardcoded 3-array switch → `api.analytics.trends({range})` fetch. 7d/30d/ytd toggle now sends a real query parameter; each option runs a real ZCQL date-bucketed aggregation.
- **Verification:** switching range refetches real data; chart x-axis uses real bucket labels.

### 2.6 OCG grouping (community detection)
- **Files:** `functions/network/index.ts` (`detectCommunities` + `/network/communities`), `apps/web/src/lib/api-client.ts`, mock-api, `apps/web/src/app/network/page.tsx`
- **Algorithm:** label-propagation community detection (10 rounds max) over the offender graph (co-accused + shared-attribute edges). Each community surfaced with member count, most-central node (highest degree), and member list.
- **Verification:** OCG panel in network inspector shows detected groups; clicking a member focuses the graph.

### 2.7 AI/ML umbrella verification + docs
- **File:** `CATALYST_SERVICES.md`
- **Updated:** rows 11–14c now precisely describe each AI capability: Zia Text Analytics (live), QuickML predictive pipeline (console-pending), statistical anomaly detection (live z-score), community detection (live label-propagation). Removed vague "AI" conflation.

## Phase 3 — Validation

### 3.1 Compliance re-audit (12-capability table)

| # | Capability | Before | After | Evidence |
|---|-----------|--------|-------|----------|
| 1 | Interactive map drill-down | ❌ `<select>` dropdown | ✅ Leaflet MapContainer + GeoJSON + click→filter | `district-map.tsx`, fetches `api.cases.list()` |
| 2 | Spatiotemporal clustering/hotspots | ❌ stub | ✅ grid-based density binning per time-of-day | `functions/analytics` `/hotspots`, ZCQL on real lat/lng |
| 3 | Emerging trend alerts | ⚠️ hardcoded INITIAL_ALERTS | ✅ rolling 7-day baseline, spike detection | `functions/analytics` `/alerts`, `api.analytics.alerts()` |
| 4 | Network graph (real data) | ⚠️ INITIAL_NODES/EDGES | ✅ NoSQL NetworkEdges + BFS focus | `functions/network`, `api.network.graph()` |
| 5 | Repeat offender tracking + MO | ❌ no identity resolution | ✅ OffenderMaster + cross-case profile + MO tags | `functions/offenders`, `api.offenders.get()` |
| 6 | Association detection (2nd-degree + shared-attr) | ❌ stored edges only | ✅ BFS hops + computed SHARED_PHONE/VEHICLE edges | `functions/network` adjacency computation |
| 7 | Socio-economic correlation | ❌ hardcoded table | ✅ ScatterChart + Pearson r + small-sample caveat | `functions/analytics` `/socio-correlation` |
| 8 | Predictive risk scoring | ⚠️ mock /retrain | ⚠️ code-ready, console-pending | `functions/ai` calls QUICKML_PIPELINE_ENDPOINT; `docs/QUICKML_PREDICTIVE_SETUP.md` |
| 9 | Anomaly detection | ⚠️ hardcoded whyFlagged | ✅ z-score, dynamic reasons | `functions/ai` `/anomalies` |
| 10 | Pattern & trend discovery | ⚠️ TREND_DATA switch | ✅ real ZCQL date-bucketed aggregation | `functions/analytics` `/trends` |
| 11 | OCG grouping | ❌ none | ✅ label-propagation community detection | `functions/network` `/communities` |
| 12 | AI/ML umbrella (precise labeling) | ⚠️ vague "AI" | ✅ precise service mapping per capability | `CATALYST_SERVICES.md` rows 11–14c |

### 3.2 Honesty-rule label review
All 5 remaining banners are accurate (see table at top). None labels a feature that is now real; none omits a label from a feature still pending.

### 3.3 Technical debt introduced
1. **Synthetic seed data** (`IsDemo: true`): must be swapped for real FIR data before production. Schema is identical — only rows change.
2. **Simplified district boundary polygons** (octagonal buffers): swap with GADM level-2 official boundaries.
3. **`requireAuth` double-call** in `functions/analytics` (hotspots/alerts/trends each call it again for scope). Minor perf cost; refactor to single call in a later pass.
4. **Poisson variance approximation** in anomaly z-score: std-dev ≈ √mean. Acceptable for count data; a proper std-dev over the 30 daily counts would be more accurate once per-day buckets are materialized.
5. **QuickML pipeline** (Phase 2.3): console-side deployment remains a developer action outside code scope.
6. **Cases page rich-detail fields** (complainant, victims, forensic): render as "—" because the seed CaseMaster lacks them. Real case-detail data will populate these.

## What still needs external action (not blocked by code)

- Deploy the QuickML predictive pipeline in the Catalyst console (see `docs/QUICKML_PREDICTIVE_SETUP.md`).
- Run `npm run seed` against a live Catalyst Data Store (requires `catalyst login` + `catalyst project:use`).
- Source official GADM level-2 district boundary polygons.
- Swap synthetic seed for real historical FIR data.
- PII/legal sign-off for cross-jurisdiction offender tracking before production.
