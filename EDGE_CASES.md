# Edge Cases

Edge cases, failure modes, and mitigations for KSP Crime Intelligence.

---

## 1. Authentication & Roles

| Edge case | Risk | Mitigation |
|-----------|------|------------|
| User authenticates but no UserProfile | Access chaos | `/me` returns `PROFILE_REQUIRED`; UI blocks modules |
| UserProfile.role invalid/unknown | Privilege ambiguity | Deny-by-default; SUPER_ADMIN notified |
| Role changed while session active | Stale permissions | Short `me` cache TTL; critical actions re-fetch profile |
| SUPER_ADMIN demoted | Lockout | Require at least one active SUPER_ADMIN (admin check) |
| VIEWER token used on real APIs | Data leak | `IsDemo` scope forced server-side |
| MFA not enabled for SCRB | Account takeover | Policy: MFA mandatory for SUPER_ADMIN & SCRB |
| Shared station computer | Session residual | Short idle timeout; explicit logout UX |

---

## 2. Scope & Authorization

| Edge case | Risk | Mitigation |
|-----------|------|------------|
| DISTRICT user passes other `districtId` | Cross-district read | Ignore or 403; never trust client scope |
| IO crafts CaseMasterID from another unit | PII leak | Scope filter; 404 if not allowed |
| Unit transferred mid-year | Wrong historical scope | Scope by case.PoliceStationID at event time; document policy |
| Employee posted to new district | Profile lag | Admin updates UserProfile; audit change |
| Aggregates without scope | State leak to SHO | Analytics functions reuse same scope helper |

---

## 3. FIR Data Quality

| Edge case | Risk | Mitigation |
|-----------|------|------------|
| Duplicate CrimeNo in import | Corrupt unique key | Upsert/skip + error file |
| Missing lat/long | Map gaps | Show in tables; exclude from geo layers; quality KPI |
| IncidentToDate &lt; IncidentFromDate | Bad temporal analytics | Validation reject/quarantine row |
| BriefFacts empty | Weak case 360° | Allow; UI empty state |
| Zero FIR / UDR / PAR categories | Wrong filters | CaseCategory master; default FIR filter documented |
| Invalid Act/Section pair | Legal nonsense | Validate against Act-Section masters when present |
| Accused without name | Graph orphans | Use AccusedMasterID label fallback |
| Same name different people | False network merge | Conservative PersonKey; manual link tool later |
| Same person different spellings | Missed repeat offender | Optional fuzzy match offline; not auto-merge |
| Chargesheet cstype unexpected | Bad metrics | Enum allow-list A/B/C |
| CourtID null | OK for early FIR | Nullable FKs permitted |
| Cross-state arrest fields | Analytics noise | Keep fields; filter UI default Karnataka |

---

## 4. CrimeNo / CaseNo Semantics

| Edge case | Mitigation |
|-----------|------------|
| Serial reset per year/station/category | Do not assume global serial uniqueness without full CrimeNo |
| Parsing CrimeNo for district/unit | Validate lengths; on parse fail store raw only |
| Leading zeros | Treat as string, never number |

---

## 5. Analytics & Hotspots

| Edge case | Mitigation |
|-----------|------------|
| Sparse rural points | Minimum count threshold for red-zone |
| Single huge spike day (data dump) | Robust baseline (median) option; flag ingest anomaly |
| User selects 10-year range | Cap max range (e.g. 366 days) for interactive APIs |
| All filters yield zero | Empty state, not error |
| Cache serves old spike after import | Signal invalidation + TTL |
| Choropleth divide-by-zero | Guard baseline zero → severity UNKNOWN |

---

## 6. Network Graph

| Edge case | Mitigation |
|-----------|------------|
| Hub person with 1000 edges | Cap nodes/edges; pagination expand |
| Self-loops / duplicate edges | Dedupe by endpoints+rel |
| Scoped officer expands to out-of-district case | Hide or mask node beyond scope; show “restricted” stub |
| Screen share exposes names | “Hide PII labels” toggle |
| Graph of only one node | Empty edges message |

---

## 7. AI / Predictions

| Edge case | Mitigation |
|-----------|------------|
| Model not trained yet | UI: “Model unavailable”; hide rankings |
| Stale model | Show trainedAt; warning if &gt; policy age |
| Feature missing for new station | Default neutral score / exclude |
| Over-trust by officers | Copy: “Risk estimate — not evidence” |
| Bias risk on caste/religion features | **Do not use sensitive demographic fields as model features** |

---

## 8. Alerts & Notifications

| Edge case | Mitigation |
|-----------|------------|
| Alert storm | Rate-limit notifications; digest mode |
| Duplicate alerts same hour | Dedupe key scope+crime+bucket |
| Notify wrong role | Subscription table by role+scope |
| Push permission denied | Fall back Mail + in-app only |

---

## 9. Import / Jobs

| Edge case | Mitigation |
|-----------|------------|
| Partial file success | Per-row errors; continue batch |
| Oversized file | Reject with max size; split guidance |
| Wrong schema columns | Fail VALIDATING with clear message |
| Concurrent imports same CrimeNo | Idempotent upsert; last-write wins + audit |
| Circuit timeout | AppSail/Job chunking |

---

## 10. Reports

| Edge case | Mitigation |
|-----------|------------|
| Report filters out of scope | Re-apply scope server-side |
| SmartBrowz failure | ReportJob FAILED + retry |
| Expired download URL | Regenerate signed URL if still authorized |

---

## 11. Frontend / UX

| Edge case | Mitigation |
|-----------|------------|
| Slow map on low end PC | Cluster layer; reduce points |
| Deep link without auth | Redirect login then return URL |
| Deep link forbidden | /forbidden with reason |
| Browser back from drill-down | URL state restores filters |
| Kannada names display | UTF-8 everywhere |

---

## 12. Security Edge Cases

| Edge case | Mitigation |
|-----------|------------|
| Export entire state as SHO | Export permission + scope |
| SQL/NoSQL injection via q | Parameterized queries; Zod validation |
| JWT replay | Catalyst session validation; HTTPS only |
| Verbose 500 with stack to client | Generic message + requestId |

---

## Related

- [SECURITY.md](./SECURITY.md)
- [TESTING.md](./TESTING.md)
- [FLOW_STATE.md](./FLOW_STATE.md)
