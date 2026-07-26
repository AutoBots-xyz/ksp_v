# Database Design

Schema design based on **Police FIR System ER Diagram — Karnataka Police Department**, extended for intelligence, RBAC, and Catalyst Data Store / NoSQL.

---

## 1. Design Principles

1. **FIR ER is source of truth** for operational case entities.
2. **App tables** support authz, aggregates, AI, audit — without breaking ER semantics.
3. Prefer **Data Store** for relational FIR + app tables; **NoSQL** for graph edges.
4. Denormalize carefully (`DistrictID` on cases) for scoped analytics performance.
5. PII columns remain in core tables; access controlled in application layer.

---

## 2. Core FIR Entities (from ER Diagram)

### 2.1 CaseMaster

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| CaseMasterID | INT | PK | Unique FIR/case id |
| CrimeNo | VARCHAR | UQ | Structured crime number |
| CaseNo | VARCHAR | | Station-level case number (YYYY + serial) |
| CrimeRegisteredDate | DATE | | FIR registration date |
| PolicePersonID | INT | FK | → Employee.EmployeeID |
| PoliceStationID | INT | FK | → Unit.UnitID |
| CaseCategoryID | INT | FK | → CaseCategory |
| GravityOffenceID | INT | FK | → GravityOffence |
| CrimeMajorHeadID | INT | FK | → CrimeHead |
| CrimeMinorHeadID | INT | FK | → CrimeSubHead |
| CaseStatusID | INT | FK | → CaseStatusMaster |
| CourtID | INT | FK | → Court |
| IncidentFromDate | DATETIME | | Incident start |
| IncidentToDate | DATETIME | | Incident end |
| InfoReceivedPSDate | DATETIME | | Info received at PS |
| latitude | DECIMAL | | GPS lat |
| longitude | DECIMAL | | GPS long |
| BriefFacts | NVARCHAR(MAX) | | Case summary |

**CrimeNo format:**  
`1 digit Case Category Code + 4 digit District ID + 4 digit Police Station ID + 4 digit Year + 5 digit Serial`  

Examples: FIR `104430006202600001`, UDR `3…`, Zero FIR `8…`, PAR `4…`.

**Recommended extension columns (analytics):**

| Column | Type | Description |
|--------|------|-------------|
| DistrictID | INT | FK → District (denormalized from Unit) |
| IsDemo | BIT | Demo/synthetic flag for VIEWER |
| IngestBatchId | VARCHAR | Import lineage |
| UpdatedAt | DATETIME | Last upsert |

### 2.2 ComplainantDetails

| Column | Type | Key |
|--------|------|-----|
| ComplainantID | INT | PK |
| CaseMasterID | INT | FK → CaseMaster |
| ComplainantName | VARCHAR | |
| AgeYear | INT | |
| OccupationID | INT | FK → OccupationMaster |
| ReligionID | INT | FK → ReligionMaster |
| CasteID | INT | FK → CasteMaster |
| GenderID | INT | |

### 2.3 Victim

| Column | Type | Key |
|--------|------|-----|
| VictimMasterID | INT | PK |
| CaseMasterID | INT | FK |
| VictimName | VARCHAR | |
| AgeYear | INT | |
| GenderID | INT | |
| VictimPolice | VARCHAR | 1 if police victim else 0 |

### 2.4 Accused

| Column | Type | Key |
|--------|------|-----|
| AccusedMasterID | INT | PK |
| CaseMasterID | INT | FK |
| AccusedName | VARCHAR | |
| AgeYear | INT | |
| GenderID | INT | |
| PersonID | VARCHAR | A1, A2, A3… |

**Extension for network:** `PersonKey` VARCHAR (resolved entity id).

### 2.5 ArrestSurrender

| Column | Type | Key |
|--------|------|-----|
| ArrestSurrenderID | INT | PK |
| CaseMasterID | INT | FK |
| ArrestSurrenderTypeID | INT | |
| ArrestSurrenderDate | DATE | |
| ArrestSurrenderStateId | INT | FK → State |
| ArrestSurrenderDistrictId | INT | FK → District |
| PoliceStationID | INT | FK → Unit |
| IOID | INT | FK → Employee |
| CourtID | INT | FK → Court |
| AccusedMasterID | INT | FK → Accused |
| IsAccused | BIT | |
| IsComplainantAccused | BIT | |

Junction (from ER): `inv_arrestsurrenderaccused` for multi-accused arrest events.

### 2.6 Act & Section

**Act:** ActCode (PK), ActDescription, ShortName, Active  

**Section:** ActCode (FK), SectionCode, SectionDescription, Active  

**ActSectionAssociation:** CaseMasterID, ActID, SectionID, ActOrderID, SectionOrderID  

**CrimeHeadActSection:** CrimeHeadID, ActCode, SectionCode  

### 2.7 Crime classification

**CrimeHead:** CrimeHeadID, CrimeGroupName, Active  

**CrimeSubHead:** CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID  

### 2.8 Demographic masters

- **CasteMaster:** caste_master_id, caste_master_name  
- **ReligionMaster:** ReligionID, ReligionName  
- **OccupationMaster:** OccupationID, OccupationName  

### 2.9 Status & category

- **CaseStatusMaster:** CaseStatusID, CaseStatusName  
- **CaseCategory:** CaseCategoryID, LookupValue (FIR, UDR, PAR…)  
- **GravityOffence:** GravityOffenceID, LookupValue (Heinous, Non-Heinous)  

### 2.10 Geography & org

**State:** StateID, StateName, NationalityID, Active  

**District:** DistrictID, DistrictName, StateID, Active  

**Unit:** UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active  

**UnitType:** UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active  

**Court:** CourtID, CourtName, DistrictID, StateID, Active  

### 2.11 HR

**Rank:** RankID, RankName, Hierarchy, Active  

**Designation:** DesignationID, DesignationName, Active, SortOrder  

**Employee:** EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate  

### 2.12 ChargesheetDetails

| Column | Type | Key |
|--------|------|-----|
| CSID | INT | PK |
| CaseMasterID | INT | FK |
| csdate | DATETIME | |
| cstype | CHAR | A Chargesheet, B False, C Undetected |
| PolicePersonID | INT | FK → Employee |

---

## 3. Relationship Matrix (core)

| Parent | Child | Cardinality |
|--------|-------|-------------|
| CaseMaster | Victim | 1:N |
| CaseMaster | Accused | 1:N |
| CaseMaster | ArrestSurrender | 1:N |
| CaseMaster | ComplainantDetails | 1:N |
| CaseMaster | ActSectionAssociation | 1:N |
| CaseMaster | ChargesheetDetails | 1:N |
| CrimeHead | CrimeSubHead | 1:N |
| Act | Section | 1:N |
| District | Unit | 1:N |
| Unit | Employee | 1:N |
| CaseMaster | Employee (registrar) | N:1 |
| CaseMaster | Unit (PS) | N:1 |

---

## 4. Application Tables (platform)

### 4.1 UserProfile (RBAC)

| Column | Type | Description |
|--------|------|-------------|
| UserProfileID | INT PK | |
| CatalystUserId | VARCHAR UQ | Auth subject |
| EmployeeID | INT FK NULL | Link to Employee |
| Role | VARCHAR | Role code |
| DistrictID | INT NULL | Scope |
| UnitID | INT NULL | Scope |
| Active | BIT | |
| CreatedAt / UpdatedAt | DATETIME | |

### 4.2 AuditLog

| Column | Type | Description |
|--------|------|-------------|
| AuditId | INT PK | |
| CatalystUserId | VARCHAR | |
| Role | VARCHAR | |
| Action | VARCHAR | VIEW_CASE, EXPORT, ROLE_CHANGE… |
| EntityType | VARCHAR | |
| EntityId | VARCHAR | |
| MetaJson | NVARCHAR | |
| CreatedAt | DATETIME | |

### 4.3 AggDistrictDay / AggUnitDay

Precomputed counts by crime head/sub-head/status for fast dashboards.

### 4.4 RiskScore

scopeType, scopeId, score, driversJson, modelVersion, computedAt  

### 4.5 Alert

type, scope, crime keys, severity, payloadJson, status (OPEN/ACK), createdAt  

### 4.6 ReportJob / ImportJob

job tracking for async Circuits  

### 4.7 AppConfig

key/value feature flags  

### 4.8 PersonEntity (optional)

PersonKey, displayName, matchMeta — for repeat offender resolution  

---

## 5. NoSQL Collections

| Collection | Document |
|------------|----------|
| graph_edges | edge documents (see BACKEND_ARCHITECTURE) |
| import_errors | per-row failures |
| user_prefs | UI preferences (optional) |

---

## 6. Entity Relationship Overview (ASCII)

```
State 1──N District 1──N Unit 1──N Employee
                      │
                      N
                 CaseMaster ──N── Victim
                      │     ──N── Accused ── PersonEntity
                      │     ──N── ComplainantDetails
                      │     ──N── ActSectionAssociation ── Act/Section
                      │     ──N── ArrestSurrender
                      │     ──N── ChargesheetDetails
                      │
                 CrimeHead 1──N CrimeSubHead
```

---

## 7. Data Sensitivity Classification

| Class | Examples | Roles with access |
|-------|----------|-------------------|
| Public aggregate | District counts | Dashboard roles |
| Operational | CrimeNo, status, heads | Operational roles in scope |
| PII | Names, caste, religion, age | canSeePii roles in scope |
| System | UserProfile, audit | SUPER_ADMIN / AUDITOR |

---

## Related

- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)
- [Police_FIR_ER_Diagram.pdf](./Police_FIR_ER_Diagram.pdf)
