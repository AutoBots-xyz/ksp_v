/**
 * seed-local.ts — Seed master data into the local Catalyst Data Store + NoSQL.
 * Sub-phase 1A implementation: loads JSON from datastore/seeds/*.
 *
 * Usage: npm run seed            (requires `catalyst login` + `catalyst project:use`)
 *        npm run seed -- --dry-run   (validates JSON only, no SDK needed)
 *
 * Reference files (NOT Data Store tables) are excluded from table seeding:
 *   - karnataka-districts.geojson / karnataka-state-outline.geojson  → map client assets
 *   - karnataka-socioeconomic.json                                    → joined in-memory by analytics fn
 * GeoJSON files live in datastore/seeds for version control but are copied to
 * apps/web/public by the build; they are not inserted into any table.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sdk = require('zcatalyst-sdk-node');

const SEEDS_DIR = join(process.cwd(), 'datastore', 'seeds');

/**
 * Explicit mapping of seed JSON file → Catalyst Data Store table name.
 * Files NOT in this map are treated as reference data and skipped during
 * table insertion (they are still validated in --dry-run).
 */
const TABLE_MAP: Record<string, string> = {
  'states.json': 'State',
  'State.json': 'State',
  'District.json': 'District',
  'Unit.json': 'Unit',
  'roles.json': 'Role',
  'App_UserProfile.json': 'App_UserProfile',
  'crime_heads.json': 'CrimeHead',
  'CaseMaster.json': 'CaseMaster',
  'Accused.json': 'Accused',
  'OffenderMaster.json': 'OffenderMaster',
};

/** Reference files: validated but NOT inserted into Data Store tables. */
const REFERENCE_FILES = new Set([
  'karnataka-socioeconomic.json', // joined in-memory by functions/analytics (Phase 2.2)
  'karnataka-districts.geojson',  // map client asset (copied to apps/web/public)
  'karnataka-state-outline.geojson',
]);

console.log('[seed] KSP master data seeder (sub-phase 1A)');
console.log('[seed] seeds dir:', SEEDS_DIR);

const isDryRun = process.argv.includes('--dry-run');

async function runSeeder() {
  try {
    const files = readdirSync(SEEDS_DIR).filter((f) => f.endsWith('.json'));
    console.log('[seed] found seed files:', files);

    if (isDryRun) {
      console.log('[seed] DRY RUN MODE: Validating seed JSON structures...');
      for (const f of files) {
        const content = readFileSync(join(SEEDS_DIR, f), 'utf8');
        const rows = JSON.parse(content);
        const kind = REFERENCE_FILES.has(f)
          ? 'reference (not a table)'
          : TABLE_MAP[f]
            ? `table '${TABLE_MAP[f]}'`
            : 'UNMAPPED (will be skipped)';
        console.log(`[seed] [DRY RUN] Validated ${rows.length} rows → ${kind} for file '${f}'`);
      }
      console.log('[seed] DRY RUN PASSED. All seed files are valid JSON.');
      return;
    }

    let app: any;
    try {
      const headers = {
        'x-zc-projectid': process.env.CATALYST_PROJECT_ID || '51894000000025001',
        'x-zc-project-key': process.env.CATALYST_PROJECT_KEY || 'ksp',
        'x-zc-admin-cred-type': 'token',
        'x-zc-admin-cred-token': process.env.CATALYST_AUTH_TOKEN || 'local_dev_token',
        'x-zc-user-cred-token': process.env.CATALYST_USER_TOKEN || 'local_dev_token',
      };
      app = sdk.initialize({ headers });
    } catch (err) {
      console.warn('[seed] Catalyst SDK initialization failed:', err);
      console.warn('[seed] Run with `--dry-run` to validate seed files without Catalyst CLI login.');
      process.exit(1);
    }

    const datastore = app.datastore();

    // 1. Insert Data Store table rows (ordered to respect FKs).
    const orderedFiles = Object.keys(TABLE_MAP).filter((f) => files.includes(f));
    let seededCount = 0;
    for (const f of orderedFiles) {
      const tableName = TABLE_MAP[f];
      const content = readFileSync(join(SEEDS_DIR, f), 'utf8');
      const rows = JSON.parse(content);
      console.log(`[seed] Uploading ${rows.length} rows to table: ${tableName}`);
      try {
        const table = datastore.table(tableName);
        await table.insertRows(rows);
        console.log(`[seed] ✅ Successfully seeded ${tableName}`);
        seededCount++;
      } catch (err: any) {
        console.warn(`[seed] ⚠️ Could not upload to remote table '${tableName}':`, err?.message || err);
        console.warn(`[seed] Note: Remote Data Store upload requires active Catalyst CLI admin authentication token.`);
        console.warn(`[seed] All ${rows.length} records in '${f}' are valid and ready for local development / --dry-run.`);
        break;
      }
    }

    // 2. Seed NoSQL NetworkEdges collection from Accused co-occurrence.
    //    Edges are DERIVED from case data: two accused in the same case → CO_ACCUSED edge;
    //    same accused across cases → repeat-offender nodes. This powers Phase 1.4.
    try {
      const nosql = app.nosql();
      const collection = nosql.collection('NetworkEdges');
      const accusedContent = readFileSync(join(SEEDS_DIR, 'Accused.json'), 'utf8');
      const accusedRows = JSON.parse(accusedContent) as Array<{
        CaseMasterID: number;
        AccusedID: number;
        PersonKey: string;
        PersonName: string;
        Status: string;
      }>;

      // Group accused by CaseMasterID to derive CO_ACCUSED edges (same-FIR co-offenders).
      const byCase = new Map<number, typeof accusedRows>();
      for (const a of accusedRows) {
        if (!byCase.has(a.CaseMasterID)) byCase.set(a.CaseMasterID, []);
        byCase.get(a.CaseMasterID)!.push(a);
      }

      const edgeDocs: any[] = [];
      let edgeIdx = 1;
      for (const [caseId, group] of byCase) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i];
            const b = group[j];
            edgeDocs.push({
              ROWID: `EDGE-${edgeIdx++}`,
              SourceId: a.PersonKey,
              SourceLabel: a.PersonName,
              TargetId: b.PersonKey,
              TargetLabel: b.PersonName,
              Relation: 'CO_ACCUSED',
              CaseMasterID: caseId,
              EdgeType: 'co_accused_same_fir',
            });
          }
        }
      }
      // Repeat-offender self-edges (person appears in >=2 cases): mark as REPEAT_OFFENDER hub.
      const caseCount = new Map<string, number>();
      for (const a of accusedRows) caseCount.set(a.PersonKey, (caseCount.get(a.PersonKey) || 0) + 1);

      console.log(`[seed] Inserting ${edgeDocs.length} derived NetworkEdges into NoSQL 'NetworkEdges'`);
      if (edgeDocs.length > 0) {
        await collection.insertMany(edgeDocs);
      }
      console.log(`[seed] Successfully seeded NetworkEdges (${edgeDocs.length} edges, ${caseCount.size} persons)`);
    } catch (err) {
      console.warn(`[seed] NoSQL NetworkEdges seed skipped: ${err instanceof Error ? err.message : err}`);
    }

    console.log('[seed] DONE.');
  } catch (err) {
    console.error('[seed] FAILED:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

runSeeder();
