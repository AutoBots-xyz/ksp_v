# @ksp/web

Next.js (App Router) web client for KSP Crime Intelligence. Hosted on Catalyst Slate or Web Client Hosting.

## Structure

- `src/app/` — routes (login, hub, district, station, cases, network, predict, reports, admin, audit, forbidden)
- `src/components/` — shared UI (layout, ui)
- `src/lib/` — catalyst-auth, api-client, rbac (client-side guard mirror)
- `src/styles/` — globals.css (Tailwind + KSP design tokens)

## Dev

```bash
npm run dev          # from repo root, or:
npm run dev --workspace apps/web
```

Point `NEXT_PUBLIC_API_BASE` at the local Catalyst serve URL.

## Status

- **0B:** bootable shell + placeholder routes (no auth yet).
- **0C:** Catalyst Auth SDK + session handling (next).
- **2A:** full RBAC routing + role homes + nav visibility matrix.
