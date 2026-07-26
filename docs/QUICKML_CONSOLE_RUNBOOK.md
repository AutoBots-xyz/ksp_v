# QuickML Predictive Model Console Deployment Runbook

> **Target Audience**: Catalyst Developer / Operations Team  
> **Purpose**: Step-by-step guide to create, train, publish, and integrate the QuickML Crime Risk Prediction Pipeline in the Zoho Catalyst Console.

---

## Executive Summary & Data-Center Gate

- **Data-Center Availability**: This project is hosted in the **IN (India)** data center (`ksp-60078769806.development`).
- **Zia AutoML vs QuickML**: Zia AutoML is **blocked** in IN/EU/JP/SA/CA data centers. QuickML ML Pipelines have **no regional block** in India (IN) data centers and are the primary no-code ML solution.
- **Goal**: Expose a callable predictive endpoint for crime risk scoring and bind it to the `ai` function environment (`QUICKML_PIPELINE_ENDPOINT`).

---

## Step 1: Export Training Dataset

1. Open **Zoho Catalyst Console** ([catalyst.zoho.com](https://catalyst.zoho.com)).
2. Select Project: **`ksp`** (`51894000000025001`).
3. In the left navigation, click **Data Store** → **ZCQL Console**.
4. Run the training data query:

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

5. Click **Export CSV** and save as `ksp_crime_training_data.csv` (or use Direct Data Store connection inside QuickML).

---

## Step 2: Create QuickML Pipeline

1. In the left navigation bar, navigate to:  
   `Catalyst Console → ksp → QuickML → Pipelines`
2. Click **Create Pipeline**.
3. Fill in the initial setup form:
   - **Pipeline Name**: `ksp_crime_risk_scoring`
   - **Description**: `Predictive crime escalation risk scoring for Karnataka districts`
   - **Data Connector / Source**: Upload `ksp_crime_training_data.csv` (or select `CaseMaster` table)
4. Select **Model Type**:
   - Select **Multiclass Classification** (or **Regression**).
   - **Target Column**: Select `RiskLevel` (or `IncidentCount` thresholded into `CRITICAL`, `HIGH`, `MODERATE`).
   - *Rationale*: Classification groups risk into actionable operational tiers matching police patrol dispatch workflows.

---

## Step 3: Configure Feature Columns

Ensure the following 9 feature columns are enabled in the pipeline builder:

| Feature Column Name | Data Type | Description |
|--------------------|-----------|-------------|
| `DistrictID` | Numeric / Categorical | District identifier (1 to 31) |
| `CrimeMajorHeadID` | Numeric / Categorical | Crime category classification ID |
| `HourOfDay` | Numeric (0 - 23) | Hour of incident registration |
| `DayOfWeek` | Numeric (0 - 6) | Day of week index |
| `IsWeekend` | Boolean / Binary (0/1) | Weekend indicator |
| `UrbanizationPct` | Numeric (Float) | District urbanization percentage |
| `LiteracyRate` | Numeric (Float) | District literacy rate percentage |
| `EconomicIndex` | Numeric (Float) | District economic index score |
| `IncidentCount` | Numeric (Integer) | 30-day baseline incident volume |

---

## Step 4: Train and Evaluate Model

1. In the top-right corner of the Pipeline Builder, click **Train Model**.
2. Select **AutoML / Best Model Search** (or Random Forest / XGBoost classifier).
3. Click **Start Training**.
   - *Duration*: Typically takes **2 to 8 minutes** depending on data size.
4. Review Evaluation Metrics once complete:
   - Ensure Accuracy / F1-Score exceeds **0.80**.

---

## Step 5: Publish Pipeline and Extract Endpoint URL

1. Once model training status is **COMPLETED**, click **Publish Pipeline**.
2. Under the **Endpoints** tab of your published pipeline:
   - Copy **Endpoint URL** (e.g. `https://catalyst.zoho.com/baas/v1/project/51894000000025001/ml/pipeline/ksp_crime_risk_scoring/predict`).
   - Copy **API Key / Authorization Token** (if generated under Security Settings).

---

## Step 6: Configure Environment Variables

1. Navigate to:  
   `Catalyst Console → Functions → ai → Environment Variables`
2. Add the following environment variable:
   - `QUICKML_PIPELINE_ENDPOINT` = `<YOUR_COPIED_ENDPOINT_URL>`
   - `QUICKML_API_KEY` = `<YOUR_OPTIONAL_API_KEY>`
3. Also update local `.env.local` file:
   ```env
   QUICKML_PIPELINE_ENDPOINT="https://catalyst.zoho.com/baas/v1/project/51894000000025001/ml/pipeline/ksp_crime_risk_scoring/predict"
   QUICKML_API_KEY="your_api_key_here"
   ```

---

## Step 7: Rollback and Redeployment Policy

- **Retraining**: To retrain the model with fresh CaseMaster records, open QuickML → Pipelines → `ksp_crime_risk_scoring` → **Retrain**.
- **Does Endpoint URL Change?**: **No.** The Endpoint URL remains static for a given published pipeline ID. Redeploying or updating the model updates the underlying prediction binary while preserving the URL.

---

## Step 8: Code Handoff Verification

Once deployed, run the verification script from your terminal:

```bash
npx tsx scripts/test-quickml-endpoint.ts
```

Refer to `docs/QUICKML_PREDICTIVE_SETUP.md` for the full verification sequence before removing the UI sample data banner.
