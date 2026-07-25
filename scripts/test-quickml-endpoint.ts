/**
 * QuickML Endpoint Verification Script
 *
 * Usage:
 *   npx tsx scripts/test-quickml-endpoint.ts
 *
 * Requirements:
 *   QUICKML_PIPELINE_ENDPOINT environment variable must be set in .env.local or shell environment.
 *   QUICKML_API_KEY environment variable (optional, if your published pipeline requires auth).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const endpoint = process.env.QUICKML_PIPELINE_ENDPOINT;
  const apiKey = process.env.QUICKML_API_KEY;

  console.log('---------------------------------------------------------');
  console.log('Catalyst QuickML Endpoint Verification Script');
  console.log('---------------------------------------------------------');

  if (!endpoint) {
    console.error('❌ Error: QUICKML_PIPELINE_ENDPOINT is not set in environment or .env.local!');
    console.log('👉 Complete the deployment in docs/QUICKML_CONSOLE_RUNBOOK.md and set QUICKML_PIPELINE_ENDPOINT.');
    process.exit(1);
  }

  console.log(`Endpoint URL : ${endpoint}`);
  console.log(`API Key set  : ${apiKey ? 'Yes (Zoho-enczapi / x-api-key)' : 'No'}`);

  const sampleFeatures = {
    DistrictID: 1,
    CrimeMajorHeadID: 2,
    HourOfDay: 22,
    DayOfWeek: 5,
    IsWeekend: 1,
    UrbanizationPct: 75.4,
    LiteracyRate: 82.1,
    EconomicIndex: 68.5,
    IncidentCount: 14,
  };

  console.log('\nSending test payload:');
  console.dir(sampleFeatures, { depth: null });

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Zoho-enczapi ${apiKey}`;
      headers['x-api-key'] = apiKey;
    }

    const startTime = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(sampleFeatures),
    });
    const latency = Date.now() - startTime;

    console.log(`\nHTTP Response Code: ${res.status} (${res.statusText})`);
    console.log(`Latency: ${latency}ms`);

    const rawText = await res.text();
    console.log('\nRaw Response Body:');
    console.log(rawText);

    if (res.ok) {
      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
        console.log('\n✅ Verification SUCCESSFUL!');
        console.log('Parsed prediction payload:', parsed);
      } catch {
        console.warn('⚠️ Warning: Response was HTTP 200 but could not parse JSON.');
      }
    } else {
      console.error('\n❌ Endpoint returned non-200 HTTP status.');
    }
  } catch (err) {
    console.error('\n❌ Request failed with network/fetch error:', err);
    process.exit(1);
  }
}

main();
