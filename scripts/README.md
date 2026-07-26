# Scripts

Operational scripts (run via `tsx`).

- `seed-local.ts` — seed master data into local Data Store (sub-phase 1A)
- `generate-synthetic-data.ts` — generate multi-district synthetic FIRs with geo + co-accused pairs (sub-phase 1E)
- `import-fir-csv.ts` — bulk import FIR CSV/JSON upsert by CrimeNo (sub-phase 1E)

Run: `npm run seed`, `npm run generate-data`, `npm run import-fir`.
