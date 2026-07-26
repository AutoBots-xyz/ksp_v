# Frontend

Product-facing frontend specification for the **KSP Crime Intelligence & Analytical Platform**.

---

## 1. Purpose

Deliver role-aware, interactive intelligence surfaces that replace static Excel reporting:

- District / station geospatial dashboards
- Spatiotemporal hotspot exploration
- Case 360° investigation views
- Criminal network & link analysis
- Predictive risk and anomaly call-outs
- Secure **role-based login** via Catalyst Authentication

Hosted on **Catalyst Slate** or **Web Client Hosting**.

---

## 2. Personas & Home Screens

| Role | Home after login | Priority widgets |
|------|------------------|------------------|
| `SUPER_ADMIN` | Admin overview | User health, failed logins, job status, system KPIs |
| `SCRB_ANALYST` | State Intelligence Hub | Karnataka map, crime trends, alerts, network hubs |
| `DISTRICT_COMMAND` | District Command Board | District map, station ranking, IO workload, risk |
| `SHO` | Station Board | Open cases, local hotspot, arrests this week |
| `IO` | My Investigations | Assigned cases, upcoming court, case network |
| `DATA_OPERATOR` | Records Desk | Case search, recent registrations, data quality flags |
| `AUDITOR` | Compliance | Access logs, export log, role change history |
| `VIEWER` | Demo Dashboard | Anonymized KPIs & sample map |

---

## 3. Global Shell

```
┌──────────────────────────────────────────────────────────┐
│ KSP Crime Intelligence    [Search cases]   🔔  👤 Role  │
├────────────┬─────────────────────────────────────────────┤
│ Nav        │  Breadcrumb: State > District > Station     │
│ · Home     │                                             │
│ · Map      │              Main content                   │
│ · Cases    │                                             │
│ · Network  │                                             │
│ · Predict  │                                             │
│ · Reports  │                                             │
│ · Admin*   │                                             │
└────────────┴─────────────────────────────────────────────┘
* Admin only for SUPER_ADMIN
```

### Shell behaviors

- Nav items filtered by role (`lib/rbac.ts`).
- Global case search (CrimeNo / CaseNo) respects scope.
- Alert bell: unread trend / anomaly notifications (Push + in-app).
- Profile menu: role badge, unit name, logout (Catalyst Auth).

---

## 4. Screens

### 4.1 Login

- Catalyst Authentication login (email/KGID-linked user as configured).
- Optional MFA for elevated roles.
- Error states: invalid credentials, inactive user, missing UserProfile.
- Post-login redirect by role.

### 4.2 State Intelligence Hub (SCRB)

- Choropleth of districts by selected crime metric.
- KPI cards: total FIR (period), heinous %, chargesheet rate, open investigations.
- Emerging trend list with red-zone indicators.
- Time-of-day heatmap (hour × day).
- Filters: date range, CaseCategory, CrimeHead, Gravity, CaseStatus.

### 4.3 District Command Board

- District boundary map with police station markers.
- Station comparison table (volume, clearance, arrests).
- Risk score strip from AI service.
- Drill-down to station board.

### 4.4 Station Board (SHO)

- Map pins for incidents (lat/long from CaseMaster).
- Open case queue by status.
- Local 7/30-day trend sparkline.
- Quick link to Case 360°.

### 4.5 Case 360°

Tabs:

| Tab | Content |
|-----|---------|
| Summary | CrimeNo, dates, status, gravity, brief facts |
| People | Complainant, victims, accused (PII per role) |
| Legal | Act / Section associations |
| Process | Arrests/surrenders, chargesheet |
| Location | Map pin + nearby cases |
| Network | Ego graph for this case |
| Audit | Who viewed (elevated roles) |

### 4.6 Network & Link Analysis

- Search person / CrimeNo / location.
- Force-directed graph: nodes = persons, cases, stations; edges = accused_of, co_accused, same_location, same_MO.
- Side panel: degree, multi-jurisdiction flag, MO tags (crime sub-heads).
- Expand 1–2 hops with loading states.
- Export PNG / request PDF brief.

### 4.7 Predictive Dashboard

- High-risk stations/districts ranked.
- Forecast chart (next N weeks) where model available.
- Anomaly call-outs with “why flagged” explanation (feature drivers if exposed).
- Model version + last trained timestamp (trust UI).

### 4.8 Reports

- Template picker: District Weekly, Hotspot Brief, Case Network Pack.
- Generate via backend → SmartBrowz → Stratus link download.
- History of generated reports (role-scoped).

### 4.9 Admin (SUPER_ADMIN)

- User list + role assignment (link Catalyst user → Employee/Unit).
- Activate/deactivate.
- Seed/import job status.
- Feature flags / AppConfig.

### 4.10 Auditor view

- Filterable audit table.
- Export access report (CSV via Function → Stratus).

---

## 5. Role-Based UI Rules

| UI element | Rule |
|------------|------|
| Nav: Admin | `SUPER_ADMIN` only |
| Nav: Predict | SCRB, DISTRICT, SUPER_ADMIN (+ IO read optional) |
| Full PII columns | Hidden for `VIEWER`; masked middle-name optional for AUDITOR |
| Export buttons | Disabled if role lacks export permission |
| District selector | Locked to own district for DISTRICT_COMMAND |
| Station selector | Locked for SHO / DATA_OPERATOR / IO (default unit) |

Frontend checks are **UX only**; backend always re-enforces.

---

## 6. Interaction Patterns

| Pattern | Usage |
|---------|-------|
| Filter bar → apply | Map + KPIs + tables share filter context |
| Drill-down | Click district → station → case drawer |
| Progressive disclosure | Graph starts at 1 hop; user expands |
| Empty states | Clear CTA: adjust filters / no permission message |
| Skeleton loaders | Map chrome + KPI cards |
| Optimistic UI | Avoid for legal data; wait for server confirm |

---

## 7. Accessibility & Localization

- WCAG 2.1 AA targets for contrast and keyboard nav.
- Critical actions reachable without map-only gestures.
- i18n-ready strings (English first; Kannada later — ROADMAP).
- Do not convey status by color alone (icons + text for red-zone).

---

## 8. Performance Budgets (frontend)

| Metric | Budget |
|--------|--------|
| Initial JS (gzip) | &lt; 350 KB critical path |
| Map first paint with empty layer | &lt; 2s on broadband |
| Graph 100 nodes interactive | 60fps pan/zoom target |
| Prefer code-split routes | `network`, `map`, `admin` lazy |

---

## 9. API Consumption

- `api-client.ts` attaches Catalyst session token.
- TanStack Query for cache keys: `['cases', scope, filters]`.
- 401 → re-auth; 403 → permission toast + hide panel.

Endpoints: [API.md](./API.md), [API_REFERENCE.md](./API_REFERENCE.md).

---

## 10. Related

- [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
- [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)
- [FLOW_STATE.md](./FLOW_STATE.md)
