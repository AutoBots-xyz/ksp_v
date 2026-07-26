# Deployment

Deploying the KSP Crime Intelligence platform **entirely on Zoho Catalyst**.

---

## 1. Deployment Principle

> Deployment via Catalyst is mandatory for all submissions, without exception.

No primary production hosting on Vercel, AWS, Azure, etc.

---

## 2. Prerequisites

- Zoho account with Catalyst project
- Catalyst CLI authenticated
- Services enabled (see CATALYST_SERVICES.md checklist)
- Domain (optional) ready for Domain Mappings
- Environment variables prepared (CONFIGURATION.md)

---

## 3. One-Time Project Setup

1. Create Catalyst project: `ksp-crime-intelligence`.
2. Create environments: Development, Staging, Production.
3. Enable: Auth, Gateway, Functions, Data Store, NoSQL, Stratus, Cache, Signals, Circuits, Cron, Mail, Push, QuickML/Zia, SmartBrowz, Pipelines, Slate/Web Client, AppSail (if needed).
4. Configure **Catalyst Authentication** (sign-in methods, MFA policy).
5. Create Data Store tables (DATABASE_DESIGN.md).
6. Seed masters + demo SUPER_ADMIN UserProfile.
7. Register API Gateway routes → Functions.
8. Configure CORS for client domains.
9. Connect **Domain Mappings** + SSL for staging/prod hostnames.

---

## 4. Application Deploy Steps

### 4.1 Functions

```bash
catalyst deploy
# or deploy functions subset per CLI docs
```

Verify each route responds through Gateway (401 without auth is OK).

### 4.2 Web client

```bash
cd apps/web
npm run build
# deploy client via catalyst deploy / Slate pipeline
```

Set `NEXT_PUBLIC_API_BASE` (or equivalent) to Gateway URL for that environment.

### 4.3 AppSail (optional)

```bash
# build Docker image per AppSail requirements
# deploy AppSail service
# wire Cron/Circuit to service URL
```

### 4.4 Async assets

- Import Circuit JSON definitions.
- Register Cron jobs (IST schedules).
- Create Stratus buckets/folders: `imports/`, `reports/`.
- Warm Cache optional post-deploy script.

---

## 5. Role-Based Login Go-Live Checklist

- [ ] Auth login works on custom domain
- [ ] Test users for each role exist
- [ ] UserProfile rows mapped (role, district, unit)
- [ ] `/api/v1/me` returns correct scope
- [ ] SCRB sees state; SHO sees only unit (spot check)
- [ ] Admin can assign roles
- [ ] MFA enabled for privileged roles
- [ ] Failed login / inactive profile UX verified

---

## 6. Post-Deploy Smoke Test

| # | Test | Expected |
|---|------|----------|
| 1 | Open app URL | Login page |
| 2 | Login SCRB | Hub map loads |
| 3 | Login SHO | Station board; no admin nav |
| 4 | Case search | Scoped results |
| 5 | Forbidden case id | 404/403 handling |
| 6 | KPI cards | Values or empty state |
| 7 | Logout | Session cleared |

---

## 7. Data Deploy

| Env | Data |
|-----|------|
| Dev | Synthetic generator script |
| Staging | Masked sample FIR extract |
| Prod | Controlled import only; no ad-hoc dumps |

Never deploy production PII to dev.

---

## 8. Runbook

### Deploy new version

1. Merge + Pipeline green  
2. Deploy staging → UAT sign-off  
3. Approve prod pipeline  
4. Smoke test  
5. Tag release in CHANGELOG  

### Rollback

1. Redeploy last known good tag via Pipelines  
2. If bad migration: restore from backup strategy; avoid destructive roll-forward without DBA  

### Incident: auth outage

1. Check Catalyst Auth status  
2. Check Gateway auth config  
3. Communicate read-only degradation if any  

### Incident: wrong scope leak suspicion

1. Disable affected user  
2. Pull AuditLog  
3. Patch scope filter  
4. Rotate sessions if supported  

---

## 9. Related

- [CICD_PIPELINE.md](./CICD_PIPELINE.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [SECURITY.md](./SECURITY.md)
