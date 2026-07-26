# Architecture Decision Records (ADRs)

Significant decisions for the KSP Crime Intelligence platform.

---

## ADR-001: Catalyst-only deployment platform

- **Status:** Accepted  
- **Date:** 2026-07-24  
- **Context:** Challenge requires Catalyst; third-party substitutes may invalidate submission.  
- **Decision:** Host UI, API, data, auth, ML, CI/CD on Zoho Catalyst services exclusively for primary paths.  
- **Consequences:** Team learns Catalyst SDK/CLI; limited portability; strong compliance with brief.

---

## ADR-002: Role-based access with Catalyst Authentication + UserProfile

- **Status:** Accepted  
- **Context:** Police hierarchy needs station/district/state scopes; Auth alone may not model unit posting.  
- **Decision:** Catalyst Authentication for identity; Data Store `UserProfile` for `role`, `districtId`, `unitId`, `employeeId`. Enforce in Functions.  
- **Consequences:** Admin must map users; dual source (Auth + profile) requires inactive-flag handling.

---

## ADR-003: Intelligence platform, not full CCTNS replacement

- **Status:** Accepted  
- **Context:** Challenge emphasizes analytics, networks, prediction vs transaction processing.  
- **Decision:** Read-heavy intelligence app with batch FIR import matching ER diagram.  
- **Consequences:** Faster delivery; depends on import quality; dual systems until integration roadmap.

---

## ADR-004: FIR ER diagram as canonical case schema

- **Status:** Accepted  
- **Context:** Official Karnataka Police FIR ER provided.  
- **Decision:** Preserve entity/column semantics (CaseMaster, Accused, CrimeNo rules, etc.); add non-breaking extensions (DistrictID, PersonKey, IsDemo).  
- **Consequences:** Aligns with department language; some denormalization needed for analytics performance.

---

## ADR-005: Polyglot storage on Catalyst

- **Status:** Accepted  
- **Context:** Relational FIR + graph analytics + blobs + hot KPIs.  
- **Decision:** Data Store + NoSQL + Stratus + Cache per CATALYST_KSP mapping.  
- **Consequences:** Multiple access patterns to master; clear ownership rules required.

---

## ADR-006: Pre-aggregated analytics tables

- **Status:** Accepted  
- **Context:** SCRB dashboards cannot scan raw FIR on every load at scale.  
- **Decision:** Nightly/ incremental `Ana_Agg*` tables + Cache; interactive APIs date-bounded.  
- **Consequences:** Eventual consistency; UI shows “as of” timestamps.

---

## ADR-007: No sensitive demographics in ML features

- **Status:** Accepted  
- **Context:** Caste/religion/occupation exist on complainants; high bias & ethics risk.  
- **Decision:** Predictive models use spatial-temporal-crime structure features only; never names/caste/religion.  
- **Consequences:** Slightly less “social correlation” automation; socio-economic overlays use non-sensitive district indicators.

---

## ADR-008: Serverless modular monolith first

- **Status:** Accepted  
- **Context:** Small team, Catalyst Functions model.  
- **Decision:** Domain folders as Function modules sharing auth library; AppSail only when limits hit.  
- **Consequences:** Simple deploy; careful bundle size/timeout management.

---

## ADR-009: REST via API Gateway, not direct public Function URLs

- **Status:** Accepted  
- **Context:** Need throttling, auth front-door, consistent base path.  
- **Decision:** All client traffic through Catalyst API Gateway `/api/v1`.  
- **Consequences:** Gateway config is part of deploy; local dev must emulate base URL.

---

## ADR-010: Conservative entity resolution

- **Status:** Accepted  
- **Context:** False merges harm investigations.  
- **Decision:** Auto PersonKey only on high-confidence rules; prefer under-merge; manual link later.  
- **Consequences:** Fewer spectacular graphs; higher trust.

---

## ADR-011: Frontend Next.js/React on Slate or Web Client Hosting

- **Status:** Accepted  
- **Context:** Need rich maps/graphs SPA.  
- **Decision:** TypeScript React family hosted on Catalyst web hosting options.  
- **Consequences:** Familiar DX; ensure build fits Catalyst client deploy.

---

## ADR-012: Deny-by-default + 404 for out-of-scope entities

- **Status:** Accepted  
- **Context:** IDOR risk across police stations.  
- **Decision:** Missing scope → not found; unknown roles denied.  
- **Consequences:** Harder debugging for admins; audit becomes important.

---

## ADR Template (future)

```
## ADR-XXX: Title
- Status:
- Date:
- Context:
- Decision:
- Consequences:
```

---

## Related

- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)
- [SECURITY.md](./SECURITY.md)
