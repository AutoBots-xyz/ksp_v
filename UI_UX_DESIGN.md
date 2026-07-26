# UI / UX Design

Design system and UX principles for the KSP Crime Intelligence platform.

---

## 1. Design Intent

**Tone:** Authoritative, calm, operational — a Strategic Intelligence Hub for police, not a consumer analytics toy.

**Keywords:** clarity, density-with-breathing-room, signal over decoration, trust (model timestamps, auditability).

**Avoid:** playful gradients, generic “AI SaaS” purple blobs, cluttered 12-widget walls without hierarchy.

---

## 2. Visual Foundations

### 2.1 Color (semantic)

| Token | Usage | Example |
|-------|-------|---------|
| `--bg-app` | App background | Deep slate / off-white dual theme |
| `--bg-surface` | Cards, panels | Elevated surface |
| `--border` | Dividers | Subtle |
| `--text-primary` | Titles, body | High contrast |
| `--text-muted` | Meta | Secondary |
| `--brand` | Primary actions, active nav | KSP-aligned blue |
| `--danger` | Heinous / critical alerts | Red |
| `--warning` | Elevated risk | Amber |
| `--success` | Cleared / chargesheeted | Green |
| `--info` | Neutral callouts | Teal/blue |
| `--map-low` → `--map-high` | Choropleth ramp | Sequential blues or YlOrRd for risk |

**Red-zone pulse:** use `--danger` with restrained animation (opacity/scale); always pair with text “Spike vs baseline”.

### 2.2 Typography

| Role | Spec |
|------|------|
| UI sans | Inter / Source Sans / system-ui |
| Mono (CrimeNo) | JetBrains Mono / ui-monospace |
| Scale | 12 / 14 / 16 / 20 / 24 / 32 |
| Density | 14px base for data tables; 16px for forms |

### 2.3 Spacing & radius

- 4px grid; card padding 16–20px.
- Radius 6–8px (professional, not pill-heavy).
- Elevation: 1–2 shadow levels max.

### 2.4 Iconography

- Lucide or similar consistent stroke icons.
- Map markers: distinct shapes for station vs incident vs alert.

---

## 3. Layout Patterns

### Desktop (primary)

- Left nav 240px collapsible to icons.
- Top bar 56px.
- Content max width fluid for maps (full bleed map + floating filter card).

### Tablet

- Collapsible nav drawer.
- Map and table stack vertically.

### Mobile (secondary)

- IO case list and alerts usable.
- Full network analysis and multi-layer maps desktop-preferred.

---

## 4. Component Catalog

| Component | Notes |
|-----------|-------|
| `RoleBadge` | Color-coded role chip |
| `ScopeLockBanner` | “Viewing: Bengaluru Urban only” |
| `FilterBar` | Date, crime head, gravity, status |
| `KpiCard` | Value, delta %, sparkline |
| `AlertPulseItem` | Trend spike row |
| `CaseRow` | CrimeNo mono, status pill, gravity |
| `PiiField` | Masked/unmasked by role |
| `MapLegend` | Metric scale |
| `GraphLegend` | Node types |
| `EmptyState` | Illustration-light + action |
| `PermissionDenied` | Inline section |
| `ModelTrustBar` | modelVersion · trainedAt · coverage |

---

## 5. Status & Gravity Pills

| Status example | Style |
|----------------|-------|
| Under Investigation | Info outline |
| Charge Sheeted | Success solid |
| Closed | Muted |
| Heinous | Danger solid |
| Non-Heinous | Neutral |

---

## 6. Map UX

1. Default Karnataka state view for SCRB; auto-fit district/station for scoped roles.
2. Hover district → tooltip with count + % change.
3. Click → drill; breadcrumb updates.
4. Time slider bottom; does not obscure legend.
5. Cluster at low zoom; expand at high zoom.
6. “Recenter” and “Reset filters” always visible.

---

## 7. Network UX

1. Seed search with typeahead (scoped).
2. Center seed node emphasized.
3. Edge thickness = relationship weight (e.g., co-occurrence count).
4. Click node → drawer (not modal full-screen).
5. Warn when expand would exceed node budget (e.g., 300 nodes).
6. “Hide PII labels” toggle for screen-sharing.

---

## 8. Role-Based UX Principles

| Principle | Implementation |
|-----------|----------------|
| Least surprise | Home matches rank/role |
| Least privilege visible | Hide admin entirely |
| Scope transparency | Persistent scope banner |
| Safe demo | VIEWER watermark “DEMO DATA” |
| Screen-share safe | PII hide toggle on Case 360° & Network |

---

## 9. Motion

- 150–250ms ease for panels.
- Map flyTo 500–800ms.
- Alert pulse CSS infinite but pausable (`prefers-reduced-motion` → static badge).

---

## 10. Content Voice

- Prefer: “Spike in burglary vs 8-week average in District X”.
- Avoid: “Our AI thinks criminals will…”
- Predictions labeled **Risk estimate — not a charge or evidence**.

---

## 11. Wireframe Priority (build order)

1. Login + role home shells  
2. FilterBar + KPI + simple table  
3. Map drill-down  
4. Case 360°  
5. Network  
6. Predictive + alerts  
7. Admin / audit polish  

---

## Related

- [FRONTEND.md](./FRONTEND.md)
- [FLOW_STATE.md](./FLOW_STATE.md)
