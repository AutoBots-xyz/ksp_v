# Frontend Architecture

Technical architecture of the web client for KSP Crime Intelligence.

---

## 1. Hosting & Runtime

| Item | Choice |
|------|--------|
| Framework | Next.js (App Router) **or** Vite + React SPA |
| Language | TypeScript |
| Hosting | **Catalyst Slate** (preferred for Next-like) or **Web Client Hosting** |
| Auth SDK | Catalyst Authentication client |
| API base | Catalyst API Gateway URL |

SSR is optional. If SSR needs Node server: host on **AppSail**; pure SPA on Web Client Hosting is simpler for v1.

---

## 2. High-Level Module Map

```
src/
  app/                  # routes + layouts
  features/             # product verticals
  components/           # shared presentational
  lib/                  # auth, api, rbac, config
  hooks/
  stores/               # UI state only
  types/
```

**Rule:** Features own their screens, hooks, and local components. Shared UI lives under `components/ui`.

---

## 3. Routing (role-aware)

| Path | Feature | Roles |
|------|---------|-------|
| `/login` | Auth | public |
| `/` | Role redirect | authenticated |
| `/hub` | SCRB hub | SUPER_ADMIN, SCRB_ANALYST |
| `/district` | District board | DISTRICT_COMMAND, SCRB, SUPER_ADMIN |
| `/station` | Station board | SHO, DATA_OPERATOR, IO, higher |
| `/cases` | Case list/search | all operational roles |
| `/cases/[id]` | Case 360° | scoped |
| `/network` | Link analysis | SCRB, DISTRICT, IO, SHO, SUPER_ADMIN |
| `/predict` | Predictive | SCRB, DISTRICT, SUPER_ADMIN |
| `/reports` | Reports | export-capable roles |
| `/admin` | Admin | SUPER_ADMIN |
| `/audit` | Audit | SUPER_ADMIN, AUDITOR |
| `/forbidden` | 403 page | all |

### Guard pipeline

```
Route load
  → ensureSession (Catalyst Auth)
  → load /api/v1/me (role, unit, district)
  → canAccess(route, role)
  → render or redirect /forbidden | /login
```

---

## 4. Auth Integration

```ts
// lib/catalyst-auth.ts (conceptual)
// - init Catalyst auth
// - getCurrentUser()
// - signIn / signOut
// - getAccessToken() for API client
```

```ts
// lib/rbac.ts
export type Role =
  | 'SUPER_ADMIN' | 'SCRB_ANALYST' | 'DISTRICT_COMMAND'
  | 'SHO' | 'IO' | 'DATA_OPERATOR' | 'AUDITOR' | 'VIEWER';

export function canAccess(route: string, role: Role): boolean;
export function canSeePii(role: Role): boolean;
export function canExport(role: Role): boolean;
```

`UserContext` React provider holds `/me` payload for the session.

---

## 5. State Management

| State type | Tool | Examples |
|------------|------|----------|
| Server/async | TanStack Query | cases, aggregates, graph |
| Global UI | Zustand/Jotai | filter bar, map bounds, selected node |
| Form local | React state / RHF | report request form |
| URL state | searchParams | dateFrom, dateTo, districtId, crimeHeadId |

**Filters are URL-synced** so SCRB can share drill-down links (still scoped server-side).

---

## 6. API Client

```ts
// lib/api-client.ts
// baseURL = process.env.NEXT_PUBLIC_API_BASE
// interceptors:
//   + Authorization from Catalyst session
//   + X-Request-Id
//   on 401 → logout / re-login
//   on 403 → toast + throw ForbiddenError
```

Query key conventions:

```
['me']
['masters', entity]
['analytics', 'district-summary', filters]
['cases', { page, ...filters }]
['cases', id]
['network', { seedType, seedId, hops }]
['predictions', scope]
```

---

## 7. Map Architecture

```
MapCanvas
  ├── BaseMap (MapLibre/Leaflet)
  ├── DistrictChoroplethLayer
  ├── StationMarkerLayer
  ├── IncidentHeatLayer
  ├── SelectionController
  └── Legend + TimeSlider
```

- GeoJSON for districts loaded from `/public/geo` or Stratus CDN URL.
- Incident points fetched as aggregated clusters until zoom threshold, then individual pins (role-scoped API).
- Time slider filters client-side on current payload or refetches for large ranges.

---

## 8. Network Graph Architecture

```
NetworkPage
  ├── SearchSeed
  ├── GraphCanvas (Cytoscape)
  ├── LayoutControls
  ├── NodeDetailDrawer
  └── ExpandHopsButton
```

- Server returns `{ nodes, edges }` for seed + hops.
- Client applies layout; does not invent edges.
- Node types styled: Person, Case, Unit, Location.

---

## 9. Error & Loading Architecture

| Layer | Behavior |
|-------|----------|
| Route error boundary | Friendly crash page + report id |
| Query error | Inline panel error + retry |
| Map tile/data fail | Banner; keep chrome usable |
| Partial permission | Section-level “Not authorized” |

---

## 10. Security on Client

- No secret keys in frontend env (`NEXT_PUBLIC_*` only for public API base / project id).
- Never trust `localStorage` role alone for authorization.
- Clear client cache on logout.
- Avoid logging PII to browser console in production builds.

---

## 11. Build & Deploy Artifact

| Mode | Output | Catalyst target |
|------|--------|-----------------|
| SPA export | `out/` static | Web Client Hosting |
| Slate-managed | per Slate config | Slate |
| SSR | Node server | AppSail |

CI builds `apps/web` and deploys via **Catalyst Pipelines**.

---

## 12. Testing Layers (frontend)

| Layer | Scope |
|-------|-------|
| Unit | `rbac.ts`, filter serializers |
| Component | KPI cards, role nav visibility |
| E2E | Login as each role → correct home; forbidden admin |

---

## Related

- [FRONTEND.md](./FRONTEND.md)
- [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)
- [SECURITY.md](./SECURITY.md)
