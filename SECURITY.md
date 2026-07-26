# Security

Security architecture emphasizing **role-based login** and Catalyst-native controls.

---

## 1. Security Goals

- Confidentiality of FIR PII and investigation data  
- Integrity of case records and role assignments  
- Availability of dashboards for authorized officers  
- Accountability via audit logs  
- Submission compliance: **Catalyst Authentication** and Gateway, not third-party IdP as primary  

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Roles

| Role | Trust level | Scope |
|------|-------------|-------|
| SUPER_ADMIN | Highest | State + admin |
| SCRB_ANALYST | High | State analytics |
| DISTRICT_COMMAND | High | One district |
| SHO | Medium | One unit |
| IO | Medium | Assigned + unit |
| DATA_OPERATOR | Medium | Unit write/read limited |
| AUDITOR | Medium | Read audit + scoped read |
| VIEWER | Low | Demo only |

### 2.2 Enforcement layers

1. **Catalyst Authentication** — who is the user?  
2. **API Gateway** — is the request authenticated / throttled?  
3. **Function RBAC** — is the role allowed for this operation?  
4. **Row scope** — is this row in district/unit/assignment scope?  
5. **Field projection** — is this field PII-visible?  
6. **UI** — hide affordances (non-authoritative)  

### 2.3 Default deny

If role missing, unknown, or inactive → **403**.  
If entity out of scope → **404** (prefer over 403 for existence hiding).

---

## 3. Authentication Controls

| Control | Guidance |
|---------|----------|
| Password policy | Catalyst Auth strong policy |
| MFA | Required SUPER_ADMIN, SCRB; recommended DISTRICT |
| Session timeout | Short idle for shared PS computers |
| Logout | Clears client cache + Auth session |
| Invite-only | Prefer admin-provisioned users over open signup in prod |
| KGID linkage | Map Employee.KGID in UserProfile process |

---

## 4. Authorization Matrix (summary)

See IMPLEMENTATION_PLAN for full grid. Critical rules:

- Only SUPER_ADMIN mutates roles.  
- Exports inherit same scope as reads.  
- VIEWER never receives real PII.  
- Sensitive demographics (caste/religion) not used in ML features.  

---

## 5. Data Protection

| Area | Control |
|------|---------|
| In transit | HTTPS via Domain Mappings / Catalyst TLS |
| At rest | Catalyst platform encryption |
| Secrets | Env config; never commit |
| Stratus objects | Authz check before signed URL |
| Logs | No BriefFacts/PII in log lines; ids only |
| Backups | Restricted env access |

---

## 6. API Security

- Gateway auth on all data routes  
- Rate limiting  
- Input validation (Zod) on every write/query param  
- Parameterized Data Store access  
- CORS allowlist  
- Request size limits  
- Consistent error envelopes without stack traces  

---

## 7. Audit & Monitoring

Log to `App_AuditLog` when:

- Case 360° with PII viewed  
- Export / report created  
- Role or scope changed  
- Import started  
- Alert configuration changed (if any)  

AUDITOR / SUPER_ADMIN can query audit API.

---

## 8. Threat Model (abridged)

| Threat | Mitigation |
|--------|------------|
| Privilege escalation | Server-side role source of truth; admin-only PATCH |
| Horizontal access (other station) | Scope filters mandatory unit tests |
| Credential stuffing | MFA + Auth lockout policies |
| Data exfiltration via export | Scope + audit + rate limit |
| Malicious import file | Validate schema; size limits; admin only |
| SSRF via report URL | Allowlist SmartBrowz targets |
| Insider misuse | Audit + least privilege + training |

---

## 9. Secure SDLC

- RBAC tests in CI (blocking)  
- Dependency updates  
- No production data on laptops without approval  
- Secrets scanning in repo  
- Staging penetration checklist before prod  

---

## 10. Incident Response (lightweight)

1. Contain (disable user / route)  
2. Assess AuditLog + Function logs  
3. Eradicate vulnerability  
4. Recover deploy  
5. Postmortem → DECISIONS/CHANGELOG  

---

## 11. Compliance Notes

- Treat FIR data as confidential police records.  
- Align retention with departmental policy (configure job).  
- Demo environments use synthetic data only.  

---

## Related

- [API.md](./API.md)
- [CATALYST_SERVICES.md](./CATALYST_SERVICES.md)
- [EDGE_CASES.md](./EDGE_CASES.md)
