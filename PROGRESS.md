# PROGRESS.md — Build Checkpoint Status

Execution tracking for the **KSP Crime Intelligence & Analytical Platform** per [IMPLEMENTATION2.md](./IMPLEMENTATION2.md) checkpointing protocol.

- **Plan:** P0–P5, 6 phases, 24 sub-phases, hard gates between sub-phases.
- **Brain:** `codebase-memory-mcp` project `D-KSP_PROJECT` (ADR synced; re-index after code lands).
- **Repo:** `git init` on `main` branch.
- **Started:** 2026-07-24

---

## Current Milestone

**Phase 0 — Foundation** (sub-phases 0A, 0B, 0C)

**Active sub-phase:** 1A — FIR + app schema (Data Store) (next)

---

## Completion Overview

| Phase | Sub-phase | Status | %  | Gate |
|-------|-----------|--------|----|------|
| P0    | 0A Catalyst project & services | ✅ Done (CLI & services initialized) | 100% | 0A |
| P0    | 0B Monorepo scaffold          | ✅ Done (Gate 0B passed) | 100% | 0B |
| P0    | 0C Auth shell + Pipeline skeleton | ✅ Done (Gate 0C passed) | 100% | 0C |
| P1    | 1A FIR + app schema            | 🔄 Active (Next) | 0% | — |
| P1    | 1B UserProfile + authz middleware | ⬜ Not started | 0% | — |
| P1    | 1C Masters APIs               | ⬜ Not started | 0% | — |
| P1    | 1D Cases APIs (search + 360°)  | ⬜ Not started | 0% | — |
| P1    | 1E Synthetic seed + CSV import v1 | ⬜ Not started | 0% | — |
| P1    | 1F RBAC test matrix (blocking) | ⬜ Not started | 0% | — |
| P2    | 2A–2F Intelligence UI + analytics | ⬜ Not started | 0% | — |
| P3    | 3A–3D Network & link analysis  | ⬜ Not started | 0% | — |
| P4    | 4A–4E AI, trends, alerts       | ⬜ Not started | 0% | — |
| P5    | 5A–5E Reports, ops, production  | ⬜ Not started | 0% | — |

Legend: ⬜ not started · 🔄 in progress · ⏳ partial · ✅ done · 🚫 blocked

---

## Resume Instructions (current)

1. **Start Phase 1 - 1A.** Data Store FIR + App Schema creation.
2. Create Catalyst Data Store tables per `DATABASE_DESIGN.md` schema (`UserProfile`, `Cases`, `FIR`, `PoliceStation`, `District`, `Accused`, `Victims`).
3. Seed initial static lookup data (`roles.json`, `states.json`).
4. Validate schema with `functions/common/datastore.ts` scope query builder.

---

## Gate Log

| Gate | Date | Result | Notes |
|------|------|--------|-------|
| 0B   | 2026-07-24 | ✅ Passed | typecheck (both workspaces), vitest (10 tests), next build (12 routes static). Brain re-indexed (1109 nodes). |
| 0C   | 2026-07-24 | ✅ Passed | Catalyst Auth Web SDK integrated (`catalyst-auth.ts`, `login/page.tsx`), Dynamic Node SDK init wired in `datastore.ts`, build & typecheck verified. |

---

## Sub-phase 0A — Catalyst project & services (status notes)

Console/manual tasks deferred (require Zoho account + browser):
- Create Catalyst project `ksp-crime-intelligence` + 3 environments (Dev/Staging/Prod).
- Enable service checklist (Auth, API Gateway, Functions, Data Store, NoSQL, Stratus, Cache, Slate/Web Hosting, Signals, Circuits, Cron, Mail, Push, QuickML, Zia AutoML, SmartBrowz, Pipelines, AppSail, Connections).
- Configure Domain Mappings (dev/staging) + SSL.
- Document project IDs / env URLs in team notes.

**Codeable prep done:** `catalyst.json` will be authored in 0B to declare intended function + client config so `catalyst init`/`link` is fast when the console project exists.
