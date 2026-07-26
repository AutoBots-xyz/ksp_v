# Database Architecture

Storage architecture across Catalyst Data Store, NoSQL, Stratus, and Cache.

---

## 1. Polyglot Persistence Map

| Store | Technology | Data class | Access pattern |
|-------|------------|------------|----------------|
| Relational | **Catalyst Data Store** | FIR ER, UserProfile, Agg*, RiskScore, Alert, Jobs, Audit | CRUD, filtered lists, joins-as-queries |
| Document/edge | **Catalyst NoSQL** | Graph edges, import errors | Key/partition lookups, hop expansion |
| Object | **Catalyst Stratus** | CSV/JSON imports, PDFs, feature files | Write once / read authorized |
| Cache | **Catalyst Cache** | KPI JSON, master snapshots | Hot read, TTL |

---

## 2. Logical Schemas

```
┌─────────────────────────────────────────────┐
│                 DATA STORE                  │
│  fir.*        app.*         analytics.*     │
│  CaseMaster   UserProfile   AggDistrictDay  │
│  Accused      AuditLog      AggUnitDay      │
│  Victim       ReportJob     RiskScore       │
│  ...          ImportJob     Alert           │
└─────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
   ┌────────────┐            ┌────────────┐
   │   NoSQL    │            │   Cache    │
   │ graph_edges│            │ kpi:*      │
   └────────────┘            └────────────┘
          │
          ▼
   ┌────────────┐
   │  Stratus   │
   │ blobs      │
   └────────────┘
```

Catalyst Data Store may not use SQL schemas literally; treat `fir/app/analytics` as **logical namespaces** (table naming prefixes).

**Naming convention:**

- `CaseMaster`, `Accused`, … (FIR names preserved)
- `App_UserProfile`, `App_AuditLog`
- `Ana_AggDistrictDay`, `Ana_RiskScore`

---

## 3. Read Paths

### Case list (scoped)

```
API filters + Scope
  → Data Store query on CaseMaster (+ DistrictID/PoliceStationID)
  → page of summaries (no BriefFacts blob if not needed)
```

### Dashboard KPIs

```
Cache kpi key
  miss → Ana_Agg* tables → assemble DTO → set Cache → return
```

### Hotspots

```
Agg or CaseMaster geo points (period + scope)
  → server-side binning
  → GeoJSON-like clusters to client
```

### Network expand

```
NoSQL edges by srcId
  → filter edges by district scope when role limited
  → hydrate node labels from Data Store (batch get)
```

---

## 4. Write Paths

| Write | Path |
|-------|------|
| FIR import | Stratus → Circuit → batch upsert Data Store → edges NoSQL → dirty Agg |
| Role change | Data Store UserProfile → invalidate Cache me: → AuditLog |
| Alert ack | Data Store Alert status |
| Risk scores | ML job → RiskScore upsert |
| Report meta | ReportJob rows; PDF in Stratus |

Interactive officers are **mostly read-heavy** in v1; writes dominated by import jobs.

---

## 5. Consistency Model

| Data | Consistency |
|------|-------------|
| CaseMaster & children | Strong per upsert batch; CrimeNo unique |
| Aggregates | Eventually consistent (minutes) after import |
| Cache | Eventually consistent; TTL bounded staleness |
| Graph edges | Rebuilt after import; may lag interactive edits |
| Risk scores | Snapshot consistent per modelVersion |

UI must show “Data as of {timestamp}” on analytics panels.

---

## 6. Index & Query Strategy

| Query | Support |
|-------|---------|
| By CrimeNo | Unique index |
| Station + date range | Composite PoliceStationID + CrimeRegisteredDate |
| District + date | DistrictID + CrimeRegisteredDate |
| Status boards | CaseStatusID + PoliceStationID |
| Person network | NoSQL secondary on PersonKey / AccusedMasterID |
| Audit by user/time | CatalystUserId + CreatedAt |

Avoid unbounded scans for SCRB state queries — always require date range (default last 30/90 days).

---

## 7. Partitioning / Volume Management

- Hot operational window: rolling 24 months in primary aggregates.
- Historical deep archive: export cold years to Stratus parquet/CSV (ROADMAP).
- Graph: retain edges for persons active in window; rebuild full on demand offline.

---

## 8. Security Architecture (data)

| Control | Implementation |
|---------|----------------|
| Authn | Catalyst Auth |
| Authz | Role + scope predicates on every query |
| Encryption | Catalyst platform encryption at rest/in transit |
| PII minimization | DTOs strip fields for VIEWER / non-PII roles |
| Audit | AuditLog on case PII views & exports |
| Demo isolation | IsDemo flag / separate env |

---

## 9. Backup & Recovery

- Rely on Catalyst project backup/export practices per environment.
- Keep Stratus copies of import batches for reprocessing.
- Document restore drill in DEPLOYMENT runbook.

---

## 10. Migration Strategy

1. Create tables matching ER + app extensions.  
2. Seed masters (State, District, Unit sample, Act/Section sample).  
3. Load synthetic cases for dev.  
4. Import masked staging extract.  
5. Version schema changes in CHANGELOG; additive columns preferred.

---

## Related

- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
- [SCALING.md](./SCALING.md)
- [SECURITY.md](./SECURITY.md)
