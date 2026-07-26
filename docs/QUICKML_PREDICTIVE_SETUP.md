# QuickML Predictive Risk Pipeline — Setup Preparation (Phase 2.3)

> **Status:** This file documents everything needed for the developer to build the
> QuickML pipeline in the Catalyst console. The pipeline itself **cannot be created
> from the repo** — it requires console-side configuration. Until the deployed
> QuickML model exists, the Predict page keeps its "Sample/Demo Data" label active
> (per the Honesty Rule).

**Doc source (verified 2026-07-25):**
- QuickML LLM Serving is NOT used here (that's for chat/RAG).
- For tabular risk scoring, use QuickML no-code ML pipelines:
  https://docs.catalyst.zoho.com/en/quickml/help/create-ml-pipeline/
- LLM Serving availability (US/IN/EU): https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/llm-serving/
- Zia AutoML is unavailable in IN (the reason we use QuickML instead):
  https://docs.catalyst.zoho.com/en/zia-services/help/automl/introduction/

---

## A. Feature List (model inputs)

The risk-scoring model predicts the likelihood of crime escalation in a
district+time-bucket. Features (all derivable from the seeded CaseMaster table):

| Feature | Source query | Type |
|---------|-------------|------|
| Historical incident count (per district, 30-day rolling) | `SELECT COUNT(*) FROM CaseMaster WHERE DistrictID=? AND CrimeRegisteredDate >= <30d ago>` | numeric |
| Historical incident count (per district+category) | same, grouped by CrimeMajorHeadID | numeric |
| Time-of-day bucket (night/morning/afternoon/evening) | derived from CrimeRegisteredDate hour | categorical |
| Day-of-week | derived from CrimeRegisteredDate | categorical |
| Is weekend | derived (Sat/Sun) | boolean |
| Urbanization % (per district) | karnataka-socioeconomic.json | numeric |
| Literacy rate (per district) | karnataka-socioeconomic.json | numeric |
| Economic index (per district) | karnataka-socioeconomic.json | numeric |
| Proximity to known offender locations | count of repeat-offender cases within 5km in last 7d | numeric |
| Recent bail releases in district | (future — requires a BailRelease table) | numeric |

**Target column:** `RiskLevel` (CRITICAL / HIGH / MODERATE) — derived from the
30-day case count per district+category, thresholded.

## B. Training-Data Export Query

Run this ZCQL in the Catalyst Data Store console (or via `functions/ai`) to
export the training dataset. The developer connects this as a QuickML data source.

```sql
SELECT
  c.DistrictID,
  c.CrimeMajorHeadID,
  EXTRACT(HOUR FROM c.CrimeRegisteredDate) AS HourOfDay,
  EXTRACT(DOW FROM c.CrimeRegisteredDate) AS DayOfWeek,
  (EXTRACT(DOW FROM c.CrimeRegisteredDate) IN (0, 6)) AS IsWeekend,
  s.UrbanizationPct,
  s.LiteracyRate,
  s.EconomicIndex,
  COUNT(*) AS IncidentCount
FROM CaseMaster c
LEFT JOIN SocioEconomic s ON c.DistrictID = s.DistrictID
GROUP BY c.DistrictID, c.CrimeMajorHeadID, HourOfDay, DayOfWeek, IsWeekend,
         s.UrbanizationPct, s.LiteracyRate, s.EconomicIndex
```

> Note: `SocioEconomic` is a reference table loaded from
> `datastore/seeds/karnataka-socioeconomic.json`. If not yet in Data Store, the
> analytics function reads the file directly (see functions/analytics socio-correlation).

## C. Code Wiring (already done in functions/ai/index.ts)

The `/ai/retrain` branch now invokes the QuickML pipeline endpoint URL (env var
`QUICKML_PIPELINE_ENDPOINT`) when configured. Until that env var is set, it
returns a clearly-labeled "QuickML not yet deployed" response instead of mock data.

## D. Console Steps & Unblock Verification Sequence

Follow the complete step-by-step console guide in [QUICKML_CONSOLE_RUNBOOK.md](file:///d:/KSP_PROJECT/docs/QUICKML_CONSOLE_RUNBOOK.md):

1. **Deploy Pipeline**: Create, train, and publish the `ksp_crime_risk_scoring` QuickML Pipeline per [QUICKML_CONSOLE_RUNBOOK.md](file:///d:/KSP_PROJECT/docs/QUICKML_CONSOLE_RUNBOOK.md).
2. **Set Environment Variables**: Set `QUICKML_PIPELINE_ENDPOINT` (and optional `QUICKML_API_KEY`) in Catalyst Console (`Functions → ai → Environment Variables`) and local `.env.local`.
3. **Run Endpoint Test Script**: Execute `npx tsx scripts/test-quickml-endpoint.ts` to verify live HTTP 200 responses.
4. **Verify Function Response**: Call `POST /ai/retrain` and confirm status returns `SUCCESS` (no longer `NOT_CONFIGURED`).
5. **Verify Predict Page**: Confirm real risk score predictions display on the Predict page.
6. **Remove Sample Data Banner**: Once verified, remove the `<SampleDataBanner>` component scoped to QuickML from `apps/web/src/app/predict/page.tsx`.
