# Tests

Test layers (reference: TESTING.md).

- `unit/` — rbac scope filters, error envelopes, validation (Vitest)
- `integration/` — case/master/analytics function tests with fixtures
- `e2e/` — Playwright role flows (login-roles.spec.ts, map-drilldown.spec.ts)
- `fixtures/` — synthetic case data, role personas
- `rbac/` — RBAC test matrix (sub-phase 1F, blocking CI gate)
