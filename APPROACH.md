# Approach

Product, analytical, and engineering approach for the KSP Crime Intelligence & Analytical Platform.

---

## 1. Problem Reframe

The challenge is not “another FIR form.” It is:

> Turn fragmented, Excel-bound crime records into a **role-aware, Catalyst-hosted intelligence system** that helps SCRB and field officers move from **reactive reporting** to **proactive, evidence-oriented deployment**.

---

## 2. Product Approach

### 2.1 Intelligence-first, not CCTNS-replacement

- v1 **consumes** FIR-shaped data (per ER diagram) via import.
- Deep write-back to state CCTNS is out of scope.
- Value is visualization, network, trends, prediction, RBAC sharing.

### 2.2 Role-based experience

Different ranks need different density and scope:

| Rank lens | Need |
|-----------|------|
| SCRB | State patterns, spikes, networks |
| District | Station comparison, resource hints |
| Station / IO | Local cases, case links, MO |

One codebase, many homes — driven by **Catalyst Authentication + UserProfile roles**.

### 2.3 Progressive sophistication

1. Trustworthy scoped lists & maps  
2. Trends & hotspots  
3. Networks  
4. Predictive scores (with explicit uncertainty labeling)

Never ship AI before basic drill-down works.

---

## 3. Analytical Approach

### 3.1 Visualization & storytelling

- Spatial: district choropleth → station → pin.
- Temporal: time series + time-of-day matrix.
- Relational: node-link graphs for people/cases/places.
- Alerting: baseline comparison (e.g., 8-week mean + threshold).

### 3.2 Network & MO

- Build edges from ER facts (accused, co-accused, shared locations, shared sections).
- Repeat offender = entity resolution + multi CaseMaster links.
- MO proxy v1 = CrimeSubHead + Act/Section patterns + temporal signature.

### 3.3 Socio-economic overlay

- Static indicators joined at district level (urbanization, population density proxies).
- Correlation panels for SCRB “why behind where” — descriptive first, causal claims avoided.

### 3.4 AI/ML

- Tabular AutoML on aggregated features (not raw PII names).
- Anomaly detection on counts.
- Optional QuickML RAG on **policy/SOP documents**, not on confidential case narrative dumps without clearance.
- Human-in-the-loop: scores assist prioritization; they are not judicial findings.

---

## 4. Engineering Approach

### 4.1 Catalyst-native

Every capability maps to a Catalyst service from `CATALYST_KSP .txt`.  
Deployment and CI prefer Catalyst Pipelines, Domain Mappings, Functions, Data Store, Auth, etc.

### 4.2 Serverless modular monolith

- One project, domain function modules, shared authz library.
- Scale-out via platform; extract AppSail only when limits hit.

### 4.3 Security by scope

Authorization is a **data filter**, not only a route guard.  
404 for out-of-scope ids (no cross-tenant existence leak).

### 4.4 Read-optimized analytics path

- Nightly aggregates + Cache.
- Interactive queries always date-bounded.

### 4.5 Docs-as-contract

This documentation set is the contract for implementation order, RBAC matrix, and service choices.

---

## 5. Delivery Approach

- Phased plan in IMPLEMENTATION_PLAN.md.
- Demo milestones map 1:1 to challenge capabilities.
- Synthetic data first; masked real extracts in staging only.

---

## 6. Success Metrics

| Metric | Target intent |
|--------|----------------|
| Time to district insight | Minutes, not spreadsheet days |
| Cross-station link discovery | Measurable graph queries in demo |
| Role misuse attempts | Blocked + audited |
| Catalyst compliance | 100% mandatory services for used capabilities |
| Spike alert precision | Tuned thresholds; track false positive rate |

---

## 7. Explicit Non-Approaches

- Building a public citizen app in v1.
- Replacing court systems.
- Black-box ML without modelVersion display.
- Storing passwords in Data Store (Auth service only).

---

## Related

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- [DECISIONS.md](./DECISIONS.md)
- [Challenge_ksp.txt](./Challenge_ksp.txt)
