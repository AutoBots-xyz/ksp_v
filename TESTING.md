# Testing

Test strategy for KSP Crime Intelligence — with **RBAC as a first-class test target**.

---

## 1. Test Pyramid

```
        ╱  E2E (Playwright)  ╲
      ╱  Integration (API+DB)  ╲
    ╱     Unit (pure logic)      ╲
```

| Layer | % effort (guide) | Tools |
|-------|------------------|-------|
| Unit | 50% | Vitest / Jest |
| Integration | 30% | Supertest-style Function tests + Data Store test project |
| E2E | 20% | Playwright |

---

## 2. Unit Tests

### Must-cover modules

| Module | Assertions |
|--------|------------|
| `scopeFilter` | Each role produces correct predicates |
| `canAccess(route, role)` | Frontend rbac matrix |
| CrimeNo parser | Valid/invalid formats |
| Spike detector | Baseline zero, ratio thresholds |
| Graph dedupe | Duplicate edges removed |
| DTO PII mask | Fields stripped for VIEWER |
| Zod schemas | Reject bad query params |

---

## 3. RBAC Matrix Tests (blocking CI)

Table-driven tests:

```
for each role in ROLES:
  for each endpoint fixture:
    expect status in {200, 403, 404} per matrix
```

Fixtures:

- Case in Unit A, District 1  
- Case in Unit B, District 1  
- Case in District 2  

Personas:

| Persona | Expectation |
|---------|-------------|
| SHO Unit A | Sees A only |
| DISTRICT D1 | Sees A+B not D2 |
| SCRB | Sees all |
| IO assigned only case X | Sees X; not unassigned other unit if policy strict |
| VIEWER | Demo only / no PII |
| Unauthenticated | 401 |

---

## 4. Integration Tests

| Scenario | Setup | Expect |
|----------|-------|--------|
| GET /me | profile seeded | role payload |
| Case search | 3 cases different units | filtered list |
| Import Circuit dry-run | sample CSV | row counts |
| Aggregate job | seed cases | Agg rows match |
| Cache miss/hit | two KPI calls | second faster / same payload |
| Alert create | synthetic spike | Alert row OPEN |

Use Catalyst **Development** project or local emulator; never production.

---

## 5. E2E Tests

| Spec | Steps |
|------|-------|
| `login-roles` | Login each role → land on correct home → nav items match |
| `map-drilldown` | SCRB filters → district → station → case drawer |
| `forbidden-admin` | SHO opens `/admin` → forbidden |
| `network-seed` | Open graph from case → nodes render |
| `logout` | Session cleared; back button no data |

Tag `@pii` tests to run only on synthetic env.

---

## 6. AI / Analytics Tests

| Type | Approach |
|------|----------|
| Deterministic anomaly | Fixed series → expect flag |
| Model smoke | Inference returns score 0–1 + modelVersion |
| Non-use of sensitive features | Feature schema unit test denylist caste/religion/name |

---

## 7. Performance Tests

- k6/Artillery against staging Gateway: case search & KPIs.
- Budget from SCALING.md; fail CI only on catastrophic regression (optional gate).

---

## 8. Security Tests

- OWASP smoke: auth bypass attempts, IDOR case ids, bulk export as low role.
- Dependency audit `npm audit` in Pipeline (high+ fails).

---

## 9. Test Data

| Set | Content |
|-----|---------|
| `fixtures/minimal.json` | 2 districts, 3 units, 20 cases |
| `fixtures/network.json` | Co-accused cluster |
| `fixtures/spike.json` | Time series for alerts |
| Generator script | Larger synthetic volumes |

All names fictional.

---

## 10. CI Integration

See CICD_PIPELINE.md quality gates:

1. unit  
2. rbac matrix  
3. build  
4. staging e2e smoke  

---

## Related

- [SECURITY.md](./SECURITY.md)
- [CICD_PIPELINE.md](./CICD_PIPELINE.md)
- [EDGE_CASES.md](./EDGE_CASES.md)
