# Data Store Schema

Table definitions for the FIR ER + application tables. Source of truth: [DATABASE_DESIGN.md](../../DATABASE_DESIGN.md), [Police_FIR_ER_Diagram.pdf](../../Police_FIR_ER_Diagram.pdf).

Created via Catalyst Data Store console or `scripts/seed-local.ts` (sub-phase 1A).

## Master / org tables
- `State`, `District`, `Unit`, `UnitType`
- `Rank`, `Designation`, `Employee`
- `Court`
- `CaseCategory`, `GravityOffence`, `CaseStatusMaster`
- `CrimeHead`, `CrimeSubHead`, `CrimeHeadActSection`
- `Act`, `Section`
- `CasteMaster`, `ReligionMaster`, `OccupationMaster`

## Transactional tables
- `CaseMaster` (+ extensions: `DistrictID`, `IsDemo`, `IngestBatchId`, `UpdatedAt`)
- `ComplainantDetails`, `Victim`, `Accused` (+ `PersonKey`)
- `ActSectionAssociation`, `ArrestSurrender`, `ChargesheetDetails`

## Application tables
- `App_UserProfile`, `App_AuditLog`, `App_ImportJob`, `App_AppConfig`
- `Ana_AggDistrictDay`, `Ana_AggUnitDay`, `Ana_RiskScore`, `Alert`, `ReportJob`

## Indexes
- Unique `CrimeNo`
- `CaseMaster(PoliceStationID, CrimeRegisteredDate)`
- `CaseMaster(DistrictID, CrimeRegisteredDate)`
- Unique `App_UserProfile.CatalystUserId`
