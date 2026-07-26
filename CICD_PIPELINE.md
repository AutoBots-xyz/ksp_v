# CI/CD Pipeline

Continuous integration and deployment using **Catalyst Pipelines** (mandatory CI/CD service preference).

---

## 1. Goals

- Build web client + Functions on every mainline change.
- Run unit tests and RBAC tests before deploy.
- Deploy to Development → Staging → Production with approvals.
- Keep secrets in Catalyst environment config, not in git.

---

## 2. Pipeline Overview

```
Developer push / PR merge
        │
        ▼
 Catalyst Pipeline triggered
        │
        ├─ Install deps
        ├─ Lint
        ├─ Unit tests (functions + web)
        ├─ Build web artifact
        ├─ Package functions
        ├─ (optional) Docker build AppSail
        │
        ▼
 Deploy target environment
        │
        ├─ Web Client / the Slate
        ├─ Functions
        ├─ API Gateway sync (if scripted)
        └─ Smoke tests (health + login page)
```

---

## 3. Environments

| Env | Trigger | Approval |
|-----|---------|----------|
| Development | push to `develop` | auto |
| Staging | push to `main` / release branch | auto or 1 reviewer |
| Production | tag `v*` or manual promote | mandatory human approval |

---

## 4. Pipeline Stages (recommended)

### Stage A — Validate

```bash
npm ci
npm run lint
npm run test --workspaces
```

### Stage B — Build

```bash
npm run build --workspace=apps/web
# function bundling per Catalyst project structure
```

### Stage C — Deploy

```bash
catalyst deploy --env <development|staging|production>
# or pipeline-native deploy steps in Catalyst console
```

### Stage D — Smoke

- `GET /api/v1/health` (if exposed)
- Fetch login page 200
- Optional: tokenized synthetic login + `/me` in staging only

---

## 5. Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable; deploys staging |
| `develop` | Integration; deploys dev |
| `feature/*` | Work branches; CI test only |
| `release/*` | Prod candidates |
| tags `vX.Y.Z` | Production release |

---

## 6. What Gets Deployed

| Artifact | Target |
|----------|--------|
| `apps/web` build | Slate / Web Client Hosting |
| `functions/**` | Serverless Functions |
| `appsail/**` image | AppSail |
| Circuit/Job defs | Applied via console or export/import process |
| Data Store schema | Migration scripts / manual checklist (no silent destructive drops) |

---

## 7. Secrets & Config

- API keys, Mail config, model endpoints: **Catalyst env variables** per environment.
- Pipeline injects only non-secret build flags (`NODE_ENV`, public API base).
- Never print secrets in logs.

---

## 8. Quality Gates

| Gate | Block deploy if fails |
|------|------------------------|
| Unit tests | Yes |
| RBAC matrix tests | Yes |
| Lint (errors) | Yes |
| Build | Yes |
| Smoke | Yes for staging/prod |
| E2E full suite | Staging required; prod optional smoke subset |

---

## 9. Rollback

1. Redeploy previous Pipeline successful build / tag.  
2. Keep prior Function versions where Catalyst supports.  
3. Data migrations must be backward compatible (expand/contract).  
4. Document incident in CHANGELOG.

---

## 10. Related

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [TESTING.md](./TESTING.md)
- [CONFIGURATION.md](./CONFIGURATION.md)
