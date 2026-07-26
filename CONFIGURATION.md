# Configuration

Configuration keys, environments, and defaults for KSP Crime Intelligence.

---

## 1. Environments

| Name | Purpose | Data |
|------|---------|------|
| `development` | Local + Catalyst dev | Synthetic |
| `staging` | UAT | Masked sample |
| `production` | Live | Controlled FIR |

Each has separate Catalyst env config, Gateway URLs, Auth app settings, and Domain Mappings.

---

## 2. Public Web Config (`NEXT_PUBLIC_*`)

Safe to expose to browsers:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_NAME` | UI title | `KSP Crime Intelligence` |
| `NEXT_PUBLIC_API_BASE` | API Gateway base URL | `https://project-id.catalystserverless.com/server/...` or custom domain `/api/v1` |
| `NEXT_PUBLIC_CATALYST_PROJECT_ID` | Project identifier if required by SDK | |
| `NEXT_PUBLIC_DEFAULT_MAP_CENTER` | lat,lng | `15.3173,75.7139` |
| `NEXT_PUBLIC_DEFAULT_MAP_ZOOM` | number | `7` |
| `NEXT_PUBLIC_MAX_GRAPH_NODES` | client warn threshold | `300` |
| `NEXT_PUBLIC_DEMO_WATERMARK` | show demo badge | `true` on viewer builds |

---

## 3. Server / Function Config

Set in Catalyst environment variables (not public):

| Variable | Description |
|----------|-------------|
| `APP_ENV` | `development` \| `staging` \| `production` |
| `LOG_LEVEL` | `info` \| `debug` |
| `DEFAULT_PAGE_SIZE` | `20` |
| `MAX_PAGE_SIZE` | `100` |
| `MAX_DATE_RANGE_DAYS` | `366` |
| `CACHE_TTL_SECONDS_KPI` | `600` |
| `CACHE_TTL_SECONDS_ME` | `300` |
| `SPIKE_BASELINE_WEEKS` | `8` |
| `SPIKE_RATIO_THRESHOLD` | `1.75` |
| `ALERT_NOTIFY_ROLES` | `SCRB_ANALYST,DISTRICT_COMMAND` |
| `GRAPH_MAX_HOPS` | `2` |
| `GRAPH_MAX_NODES` | `300` |
| `PII_ROLES` | roles allowed full PII |
| `EXPORT_ROLES` | roles allowed export |
| `MFA_ENFORCED_ROLES` | `SUPER_ADMIN,SCRB_ANALYST` |
| `SMARTBROWZ_ENABLED` | `true` |
| `MAIL_FROM` | configured sender identity |
| `IMPORT_MAX_BYTES` | e.g. `52428800` |
| `MODEL_RISK_VERSION` | active model version string |
| `FEATURE_RAG_ENABLED` | `false` default v1 |

Exact naming may follow Catalyst console conventions; keep a single `config.ts` reader in `functions/common`.

---

## 4. AppConfig Table (runtime flags)

| Key | Example value | Purpose |
|-----|---------------|---------|
| `maintenance_mode` | `false` | Block writes |
| `enable_predictions_ui` | `true` | Feature flag |
| `enable_push` | `true` | Notifications |
| `default_home_by_role` | JSON map | Override homes |

Readable by Functions; writable SUPER_ADMIN only.

---

## 5. Role Configuration

Default role codes (immutable strings):

```
SUPER_ADMIN
SCRB_ANALYST
DISTRICT_COMMAND
SHO
IO
DATA_OPERATOR
AUDITOR
VIEWER
```

Permission flags derived in code from role (see SECURITY.md), not free-form client claims.

---

## 6. API Gateway Config

| Setting | Guidance |
|---------|----------|
| Base path | `/api/v1` |
| Auth | Enabled |
| Throttle | Per env; stricter in prod |
| CORS origins | Web client URLs only |
| Timeout | Align with Function limits; long jobs use Circuits |

---

## 7. Cron Config (IST)

| Job | Expression | Config keys used |
|-----|------------|------------------|
| nightly_aggregates | `30 1 * * *` | — |
| cache_warm | `0 2 * * *` | `CACHE_TTL_*` |
| anomaly_scan | `0 * * * *` | `SPIKE_*` |
| weekly_retrain | `0 3 * * 0` | `MODEL_RISK_VERSION` |

---

## 8. `.env.example` (root template)

```bash
# Copy to .env — do not commit secrets
APP_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_APP_NAME=KSP Crime Intelligence
NEXT_PUBLIC_API_BASE=http://localhost:3000/api/v1
NEXT_PUBLIC_DEFAULT_MAP_CENTER=15.3173,75.7139
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=7
MAX_DATE_RANGE_DAYS=366
SPIKE_BASELINE_WEEKS=8
SPIKE_RATIO_THRESHOLD=1.75
GRAPH_MAX_HOPS=2
GRAPH_MAX_NODES=300
```

---

## 9. Configuration Change Process

1. Change in non-prod first.  
2. Document in CHANGELOG if behavior-facing.  
3. Promote via Pipelines / console parity checklist.  
4. Never hot-change prod secrets in chat logs.

---

## Related

- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [SECURITY.md](./SECURITY.md)
- [CATALYST_INTEGRATION.md](./CATALYST_INTEGRATION.md)
