# Scaling

Scaling strategy for KSP Crime Intelligence on Catalyst.

---

## 1. Scale Dimensions

| Dimension | Drivers |
|-----------|---------|
| Users | Concurrent SCRB / district / station officers |
| Data volume | Years of FIR rows, accused/victim counts |
| Read QPS | Dashboard polling, map pans, searches |
| Write bursts | Bulk imports |
| Compute | Aggregate rebuilds, graph rebuild, ML train/infer |
| Notifications | Alert storms |

---

## 2. Application Scaling

### Functions

- Stateless handlers; horizontal scale by Catalyst.
- Keep cold paths warm via Cron cache_warm for critical KPIs.
- Split heavy domains (analytics vs cases) into separate Functions to isolate load.

### AppSail

- Move long ETL/ML to AppSail workers with job queues (Cron/Job Scheduling).
- Autoscale workers for weekly retrain windows only.

### Web

- Static assets CDN via Catalyst hosting.
- Code-split map/graph bundles.
- Client-side cluster rendering to cut API payload sizes.

---

## 3. Data Scaling

| Technique | Use |
|-----------|-----|
| Pre-aggregates | Ana_AggDistrictDay / AggUnitDay |
| Date-required queries | Prevent full table scans |
| Denormalized DistrictID | Faster district scope |
| Pagination | All list endpoints |
| NoSQL edges | Hop queries without heavy relational joins |
| Stratus cold storage | Old raw imports & archives |
| Cache TTL 5–15m | Absorb dashboard storms |

---

## 4. Graph Scaling

- Hard cap nodes/edges per response (e.g. 300/600).
- Precompute top hubs nightly for SCRB “repeat offender” list.
- Incremental edge updates on import batches vs full rebuild when possible.

---

## 5. ML Scaling

- Train on aggregates (thousands of rows), not raw millions of PII rows.
- Inference batch nightly; online read from RiskScore table (cheap).
- Feature building on AppSail if Function timeout exceeded.

---

## 6. Import Scaling

| Volume | Strategy |
|--------|----------|
| &lt; 10k rows | Single Circuit Function batch |
| 10k–500k | Chunked jobs, parallel Circuit branches |
| 500k+ | AppSail multi-worker + progress table |

Idempotent upserts by CrimeNo allow safe retries.

---

## 7. Multi-Tenant Scope Efficiency

- Indexes aligned to `PoliceStationID`, `DistrictID`, dates.
- SCRB queries always filtered by time window.
- Separate demo dataset path so VIEWER load never contends on prod tables (prefer separate env).

---

## 8. Performance Targets

| Scenario | Target |
|----------|--------|
| Cached KPI | &lt; 300ms p95 |
| Case search page | &lt; 1.5s p95 |
| Hotspot query 90 days district | &lt; 2s p95 |
| Graph 2 hops modest seed | &lt; 2s p95 |
| Import 50k rows | &lt; 30 min staging benchmark |

---

## 9. Bottleneck Playbook

| Symptom | Action |
|---------|--------|
| Cache stampede | Soft TTL + single-flight recompute lock pattern |
| Gateway 429 | Raise limits carefully; fix client refetch storms |
| Function timeout | Move to Job/AppSail |
| Map jank | Server cluster; fewer points |
| ML train long | Schedule off-peak; smaller feature set |

---

## 10. Future Scale (ROADMAP)

- Read replicas / warehouse export if Catalyst options expand.
- District-level data residency partitions.
- Streaming ingest from CCTNS.

---

## Related

- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)
