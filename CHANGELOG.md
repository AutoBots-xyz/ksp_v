# Changelog

All notable changes to the KSP Crime Intelligence & Analytical Platform are documented here.

Format inspired by [Keep a Changelog](https://keepachangelog.com/).  
Versioning: Semantic Versioning for app releases.

---

## [Unreleased]

### Documentation

- Initial complete documentation set from challenge inputs:
  - `Challenge_ksp.txt` — problem & capabilities
  - `CATALYST_KSP .txt` — mandatory Catalyst services
  - `Police_FIR_ER_Diagram.pdf` — FIR ER schema
- Role-based login model defined across README, SECURITY, API, FRONTEND.
- Catalyst service binding documented in CATALYST_SERVICES & CATALYST_INTEGRATION.

### Planned (implementation)

- Catalyst project scaffold
- Auth + UserProfile RBAC
- Case APIs and dashboards
- Network graph
- QuickML / Zia risk scores
- Pipelines deploy

---

## [0.1.0] — 2026-07-24

### Added

- Project documentation baseline (v0.1.0 docs release).
- RBAC role codes: `SUPER_ADMIN`, `SCRB_ANALYST`, `DISTRICT_COMMAND`, `SHO`, `IO`, `DATA_OPERATOR`, `AUDITOR`, `VIEWER`.
- FIR-centric data model documentation aligned to Karnataka Police ER diagram.
- Implementation phases 0–5 plan.

### Notes

- No application runtime code in this tag — documentation foundation for build-out.

---

## Versioning Policy

| Change type | Version bump |
|-------------|--------------|
| Docs-only | Patch or Unreleased notes |
| Backward-compatible API fields | Minor |
| Breaking API / role semantics | Major |
| Security fix | Patch (call out under Security) |

---

## Related

- [ROADMAP.md](./ROADMAP.md)
- [DECISIONS.md](./DECISIONS.md)
