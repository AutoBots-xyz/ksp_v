# Environment Setup

Local and Catalyst environment setup for developers.

---

## 1. Prerequisites

| Tool | Version (recommended) |
|------|------------------------|
| Node.js | 20 LTS |
| npm | 10+ |
| Git | 2.40+ |
| Catalyst CLI | latest (`npm i -g zcatalyst-cli`) |
| Zoho account | Catalyst project access |
| Docker | optional (AppSail) |
| VS Code / Cursor | optional |

---

## 2. Clone & Install

```bash
cd D:\KSP_PROJECT
npm install
# when workspaces exist:
# npm install --workspaces
```

---

## 3. Catalyst Login & Project Link

```bash
catalyst login
catalyst whoami
catalyst init
# or associate existing project files (catalyst.json)
```

Ensure services from CATALYST_SERVICES checklist are enabled in the console.

---

## 4. Environment Files

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

Fill values per [CONFIGURATION.md](./CONFIGURATION.md).  
**Never commit** real secrets or production FIR extracts.

---

## 5. Data Store Bootstrap

1. Create tables from DATABASE_DESIGN (console or scripts).  
2. Seed:

```bash
npx ts-node scripts/seed-local.ts
# or npm run seed
```

3. Create Catalyst Auth test users.  
4. Insert `UserProfile` rows for each role persona.

### Suggested test personas

| Email (example) | Role | Scope |
|-----------------|------|-------|
| admin@ksp.local | SUPER_ADMIN | state |
| scrb@ksp.local | SCRB_ANALYST | state |
| sp.bu@ksp.local | DISTRICT_COMMAND | Bengaluru Urban |
| sho.sample@ksp.local | SHO | sample PS |
| io.sample@ksp.local | IO | sample PS |
| viewer@ksp.local | VIEWER | demo |

---

## 6. Run Locally

```bash
catalyst serve
```

Typical endpoints:

- Web: CLI-printed local URL  
- Functions: proxied under local API base  

Web-only alternative:

```bash
cd apps/web
npm run dev
```

Point `NEXT_PUBLIC_API_BASE` at served Functions/Gateway.

---

## 7. Verify Role-Based Login

1. Open web app → login as `sho.sample`.  
2. Confirm station-scoped home.  
3. Logout → login `scrb` → state hub.  
4. Call `/api/v1/me` via browser network tab — role fields present.  
5. Attempt `/admin` as SHO → forbidden.

---

## 8. IDE Recommendations

- ESLint + Prettier  
- EditorConfig  
- REST client for API fixtures  
- Disable committing `.env`

---

## 9. Common Setup Issues

| Issue | Fix |
|-------|-----|
| CLI not authenticated | `catalyst login` |
| CORS errors | Add local origin to Gateway CORS |
| `/me` 403 | Seed UserProfile + Active=true |
| Empty maps | Seed lat/long cases + GeoJSON in `public/geo` |
| Function can't find table | Create table names exact match; correct env |

---

## 10. Related

- [CONFIGURATION.md](./CONFIGURATION.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
