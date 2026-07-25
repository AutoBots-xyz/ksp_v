/**
 * Dev-mode mock API.
 * Only used as a fallback when the real Catalyst API is unreachable
 * (e.g. running `next dev` without `catalyst serve`).
 * When `catalyst serve` or a deployed Gateway is running, real fetches succeed
 * and this mock is never consulted.
 *
 * Reference: ENVIRONMENT_SETUP.md #6, API_REFERENCE.md.
 *
 * Phase 1 (2026-07-25): the cases / network / analytics mocks now serve the
 * SYNTHETIC SEED DATA from datastore/seeds/*.json (imported at build time).
 * This means the dev UI shows the same 220 cases, 30 offenders, and derived
 * graph edges that the live Catalyst Data Store would return once seeded.
 * The mock computes hotspots, alerts, and trends the same way the real
 * functions/analytics does — so behaviour is identical between dev and prod.
 */
import type { MeResponse, Role } from './rbac';
import { defaultHome } from './rbac';
import type {
  District,
  ReportTemplate,
  JobStatus,
  CreateReportBody,
  ReportJobStatus,
  Hotspot,
  AlertItem,
  TrendPoint,
  SocioCorrelationRow,
} from './api-client';
// Seed data imported at build time so the dev mock serves real-shape records.
// Copied into src/data/seeds so the bundler/tsconfig include scope can resolve them.
import seedCases from '../data/seeds/CaseMaster.json';
import seedAccused from '../data/seeds/Accused.json';
import seedOffenders from '../data/seeds/OffenderMaster.json';
import seedSocio from '../data/seeds/karnataka-socioeconomic.json';

interface SeedCase {
  CaseMasterID: number;
  CrimeNo: string;
  CrimeRegisteredDate: string;
  PoliceStationID: number;
  DistrictID: number;
  CrimeMajorHeadID: number;
  GravityID: number;
  CaseStatus: string;
  BriefFacts: string;
  ModusOperandi: string;
  Latitude: number;
  Longitude: number;
  PrimaryAccusedPersonKey?: string;
}
const CASES = seedCases as SeedCase[];
const ACCUSED = seedAccused as Array<{ CaseMasterID: number; PersonKey: string; PersonName: string; AccusedID: number; Status: string; PhoneNumber?: string; VehicleReg?: string }>;
const OFFENDERS = seedOffenders as Array<{ PersonKey: string; PersonName: string; PriorArrests: number }>;
const SOCIO = seedSocio as Array<{ DistrictID: number; DistrictName: string; UrbanizationPct: number; LiteracyRate: number; EconomicIndex: number; Population: number }>;

function getDevMe(): MeResponse {
  const activeRole: Role =
    typeof localStorage !== 'undefined' && localStorage.getItem('ksp_demo_role')
      ? (localStorage.getItem('ksp_demo_role') as Role)
      : 'SCRB_ANALYST';

  const isDevUser = activeRole === 'DEVELOPER';
  const canSeePii = isDevUser || ['SUPER_ADMIN', 'SCRB_ANALYST', 'DISTRICT_COMMAND', 'SHO', 'IO'].includes(activeRole);
  const canExport = isDevUser || ['SUPER_ADMIN', 'SCRB_ANALYST', 'DISTRICT_COMMAND'].includes(activeRole);
  const isAdmin = isDevUser || activeRole === 'SUPER_ADMIN';
  const canReadAudit = isDevUser || ['SUPER_ADMIN', 'AUDITOR'].includes(activeRole);
  const isStateScope = isDevUser || ['SUPER_ADMIN', 'SCRB_ANALYST', 'AUDITOR', 'VIEWER'].includes(activeRole);

  return {
    userProfileId: 1,
    role: activeRole,
    districtId: isStateScope ? null : 443,
    unitId: null,
    employeeId: null,
    permissions: {
      canSeePii,
      canExport,
      isAdmin,
      canReadAudit,
      isStateScope,
    },
    home: defaultHome(activeRole),
  };
}

const DEV_DISTRICTS: District[] = [
  { districtId: 443, districtName: 'Bengaluru Urban', stateId: 29 },
  { districtId: 444, districtName: 'Bengaluru Rural', stateId: 29 },
  { districtId: 445, districtName: 'Mysuru', stateId: 29 },
  { districtId: 446, districtName: 'Belagavi', stateId: 29 },
  { districtId: 447, districtName: 'Kalaburagi', stateId: 29 },
];

type MockJob = ReportJobStatus;

const mockJobs = new Map<string, MockJob>();

function ok<T>(data: T): { success: true; data: T } {
  return { success: true as const, data };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mockRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ success: true; data: T } | null> {
  // Only handle JSON GET/POST we know about; return null to signal "not a mock route".
  const method = (init?.method ?? 'GET').toUpperCase();
  const rawBody = typeof init?.body === 'string' ? init.body : undefined;

  // GET /me
  if (method === 'GET' && path === '/me') {
    await delay(200);
    return ok(getDevMe()) as unknown as { success: true; data: T };
  }

  // GET /masters/districts
  if (method === 'GET' && path.startsWith('/masters/districts')) {
    await delay(150);
    return ok(DEV_DISTRICTS) as unknown as { success: true; data: T };
  }

  // GET /reports
  if (method === 'GET' && path === '/reports') {
    await delay(150);
    return ok(Array.from(mockJobs.values())) as unknown as { success: true; data: T };
  }

  // GET /reports/{jobId}
  const getMatch = method === 'GET' && path.match(/^\/reports\/([^/]+)$/);
  if (getMatch) {
    const job = mockJobs.get(getMatch[1]);
    if (!job) return null;
    await delay(100);
    return ok(job) as unknown as { success: true; data: T };
  }

  // POST /reports
  if (method === 'POST' && path === '/reports') {
    const body = rawBody ? (JSON.parse(rawBody) as CreateReportBody) : null;
    if (!body) return null;
    await delay(300);
    const jobId = `RPT-MOCK-${Date.now().toString(36)}`.toUpperCase();
    const job: MockJob = {
      jobId,
      template: body.template as ReportTemplate,
      status: 'QUEUED' as JobStatus,
      createdBy: 'dev-mock',
      createdByRole: 'SCRB_ANALYST',
      createdAt: new Date().toISOString(),
      piiIncluded: true,
    };
    mockJobs.set(jobId, job);
    // Simulate async progression.
    setTimeout(() => {
      job.status = 'PROCESSING';
    }, 500);
    setTimeout(() => {
      job.status = 'COMPLETE';
      job.completedAt = new Date().toISOString();
      job.fileSizeBytes = 1_500_000 + Math.floor(Math.random() * 2_000_000);
      job.downloadUrl = `/api/v1/reports/${jobId}/download`;
    }, 2000);
    return ok({ jobId, status: 'QUEUED' }) as unknown as { success: true; data: T };
  }

  // ---- Phase 1: cases / network / analytics (serve seed data) ----

  // GET /cases — returns all seed cases (filtered client-side by scope).
  if (method === 'GET' && path === '/cases') {
    await delay(150);
    return ok(CASES) as unknown as { success: true; data: T };
  }

  // GET /network?seed=...&hops=N — derives a Cytoscape graph from seed accused
  // co-occurrence (same-FIR = CO_ACCUSED edge) + shared-attribute edges (Phase 2.1:
  // same phone/vehicle across different cases = SHARED_PHONE/SHARED_VEHICLE edge).
  if (method === 'GET' && path.startsWith('/network')) {
    await delay(200);
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const seed = params.get('seed');
    const hops = Number(params.get('hops') ?? '1');

    // Build adjacency from co-accused pairs.
    const byCase = new Map<number, typeof ACCUSED>();
    for (const a of ACCUSED) {
      if (!byCase.has(a.CaseMasterID)) byCase.set(a.CaseMasterID, []);
      byCase.get(a.CaseMasterID)!.push(a);
    }
    const adj = new Map<string, Set<string>>();
    const edgeTypes = new Map<string, string>();
    for (const group of byCase.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (!adj.has(group[i].PersonKey)) adj.set(group[i].PersonKey, new Set());
          if (!adj.has(group[j].PersonKey)) adj.set(group[j].PersonKey, new Set());
          adj.get(group[i].PersonKey)!.add(group[j].PersonKey);
          adj.get(group[j].PersonKey)!.add(group[i].PersonKey);
          edgeTypes.set(`${group[i].PersonKey}|${group[j].PersonKey}`, 'CO_ACCUSED');
          edgeTypes.set(`${group[j].PersonKey}|${group[i].PersonKey}`, 'CO_ACCUSED');
        }
      }
    }
    // Phase 2.1: shared-attribute (phone/vehicle) computed edges.
    const byPhone = new Map<string, string[]>();
    const byVehicle = new Map<string, string[]>();
    for (const a of ACCUSED) {
      if (a.PhoneNumber) {
        if (!byPhone.has(a.PhoneNumber)) byPhone.set(a.PhoneNumber, []);
        byPhone.get(a.PhoneNumber)!.push(a.PersonKey);
      }
      if (a.VehicleReg) {
        if (!byVehicle.has(a.VehicleReg)) byVehicle.set(a.VehicleReg, []);
        byVehicle.get(a.VehicleReg)!.push(a.PersonKey);
      }
    }
    const addShared = (keys: string[], type: string) => {
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          if (!adj.has(keys[i])) adj.set(keys[i], new Set());
          if (!adj.has(keys[j])) adj.set(keys[j], new Set());
          adj.get(keys[i])!.add(keys[j]);
          adj.get(keys[j])!.add(keys[i]);
          if (!edgeTypes.has(`${keys[i]}|${keys[j]}`)) {
            edgeTypes.set(`${keys[i]}|${keys[j]}`, `SHARED_${type}`);
            edgeTypes.set(`${keys[j]}|${keys[i]}`, `SHARED_${type}`);
          }
        }
      }
    };
    for (const [, keys] of byPhone) addShared(keys, 'PHONE');
    for (const [, keys] of byVehicle) addShared(keys, 'VEHICLE');

    const nameByKey = new Map(OFFENDERS.map((o) => [o.PersonKey, o.PersonName]));

    // BFS from seed (or all nodes if no seed).
    const startNodes = seed ? [seed] : Array.from(adj.keys());
    const visited = new Set<string>();
    const frontier = startNodes.map((k) => ({ key: k, depth: 0 }));
    while (frontier.length) {
      const { key, depth } = frontier.shift()!;
      if (visited.has(key)) continue;
      visited.add(key);
      if (depth < hops) {
        for (const n of adj.get(key) ?? []) {
          if (!visited.has(n)) frontier.push({ key: n, depth: depth + 1 });
        }
      }
    }
    const nodes = Array.from(visited).map((id) => ({
      data: { id, label: nameByKey.get(id) ?? id, type: 'PERSON', risk: 'HIGH' },
    }));
    const edges: Array<{ data: { id: string; source: string; target: string; label: string } }> = [];
    let eId = 1;
    for (const [src, targets] of adj) {
      if (!visited.has(src)) continue;
      for (const tgt of targets) {
        if (!visited.has(tgt)) continue;
        if (src < tgt) {
          edges.push({ data: { id: `e${eId++}`, source: src, target: tgt, label: edgeTypes.get(`${src}|${tgt}`) ?? 'CO_ACCUSED' } });
        }
      }
    }
    return ok({ nodes, edges }) as unknown as { success: true; data: T };
  }

  // GET /network/communities — Phase 2.6 organized-crime grouping (label propagation).
  if (method === 'GET' && path === '/network/communities') {
    await delay(200);
    // Rebuild adjacency (same as /network handler).
    const byCase2 = new Map<number, typeof ACCUSED>();
    for (const a of ACCUSED) {
      if (!byCase2.has(a.CaseMasterID)) byCase2.set(a.CaseMasterID, []);
      byCase2.get(a.CaseMasterID)!.push(a);
    }
    const adj2 = new Map<string, Set<string>>();
    for (const group of byCase2.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (!adj2.has(group[i].PersonKey)) adj2.set(group[i].PersonKey, new Set());
          if (!adj2.has(group[j].PersonKey)) adj2.set(group[j].PersonKey, new Set());
          adj2.get(group[i].PersonKey)!.add(group[j].PersonKey);
          adj2.get(group[j].PersonKey)!.add(group[i].PersonKey);
        }
      }
    }
    // Add shared-attribute edges too.
    for (const a of ACCUSED) {
      if (a.PhoneNumber) {
        const peers = ACCUSED.filter((x) => x.PhoneNumber === a.PhoneNumber && x.PersonKey !== a.PersonKey);
        for (const p of peers) {
          if (!adj2.has(a.PersonKey)) adj2.set(a.PersonKey, new Set());
          if (!adj2.has(p.PersonKey)) adj2.set(p.PersonKey, new Set());
          adj2.get(a.PersonKey)!.add(p.PersonKey);
          adj2.get(p.PersonKey)!.add(a.PersonKey);
        }
      }
    }
    const nameByKey2 = new Map(OFFENDERS.map((o) => [o.PersonKey, o.PersonName]));
    // Label propagation.
    const labels = new Map<string, string>();
    const ids = Array.from(adj2.keys());
    for (const id of ids) labels.set(id, id);
    for (let round = 0; round < 10; round++) {
      let changed = false;
      for (const id of ids) {
        const counts = new Map<string, number>();
        for (const n of adj2.get(id) ?? []) { const l = labels.get(n); if (l) counts.set(l, (counts.get(l) ?? 0) + 1); }
        let best = labels.get(id); let bestC = 0;
        for (const [l, c] of counts) if (c > bestC) { best = l; bestC = c; }
        if (best !== labels.get(id)) { labels.set(id, best!); changed = true; }
      }
      if (!changed) break;
    }
    const groups2 = new Map<string, string[]>();
    for (const [id, label] of labels) { if (!groups2.has(label)) groups2.set(label, []); groups2.get(label)!.push(id); }
    const communities = [];
    let ci = 1;
    for (const [, members] of groups2) {
      if (members.length < 2) continue;
      let central = members[0]; let maxD = 0;
      for (const m of members) { const d = adj2.get(m)?.size ?? 0; if (d > maxD) { maxD = d; central = m; } }
      communities.push({
        id: `OCG-${ci++}`,
        memberCount: members.length,
        members: members.map((k) => ({ personKey: k, personName: nameByKey2.get(k) ?? k })),
        mostCentralNode: { personKey: central, personName: nameByKey2.get(central) ?? central },
        sharedEdgeTypes: ['CO_ACCUSED'],
      });
    }
    return ok(communities.sort((a, b) => b.memberCount - a.memberCount)) as unknown as { success: true; data: T };
  }

  // GET /analytics/hotspots?timeOfDay=...&districtId=...
  // Grid-based density binning (0.05 deg cells) per time-of-day bucket.
  if (method === 'GET' && path.startsWith('/analytics/hotspots')) {
    await delay(200);
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const tod = params.get('timeOfDay') ?? 'all';
    const did = params.get('districtId');
    let pool = CASES.filter((c) => typeof c.Latitude === 'number');
    if (did) pool = pool.filter((c) => String(c.DistrictID) === did);
    if (tod !== 'all') {
      pool = pool.filter((c) => timeOfDayBucket(c.CrimeRegisteredDate) === tod);
    }
    // Bin into ~0.05 deg grid cells.
    const bins = new Map<string, { lat: number; lng: number; count: number; mos: Map<string, number>; did: number }>();
    for (const c of pool) {
      const gx = Math.round(c.Latitude / 0.05) * 0.05;
      const gy = Math.round(c.Longitude / 0.05) * 0.05;
      const key = `${gx.toFixed(3)},${gy.toFixed(3)}`;
      if (!bins.has(key)) bins.set(key, { lat: gx, lng: gy, count: 0, mos: new Map(), did: c.DistrictID });
      const b = bins.get(key)!;
      b.count++;
      b.mos.set(c.ModusOperandi, (b.mos.get(c.ModusOperandi) ?? 0) + 1);
    }
    const hotspots: Hotspot[] = Array.from(bins.entries())
      .filter(([, b]) => b.count >= 2)
      .map(([key, b], i) => {
        const topMo = Array.from(b.mos.entries()).sort((a, c) => c[1] - a[1])[0]?.[0] ?? '';
        return {
          id: `HS-${i + 1}`,
          lat: b.lat,
          lng: b.lng,
          radiusMeters: Math.min(800 + b.count * 150, 2500),
          caseCount: b.count,
          timeOfDay: (tod === 'all' ? 'night' : tod) as Hotspot['timeOfDay'],
          topModusOperandi: topMo,
          districtId: b.did,
        };
      });
    return ok(hotspots) as unknown as { success: true; data: T };
  }

  // GET /analytics/alerts — rolling 7-day baseline vs last 24h, spike if >2x.
  if (method === 'GET' && path === '/analytics/alerts') {
    await delay(200);
    const now = new Date('2026-07-25T23:59:59');
    const dayMs = 86400000;
    const last24 = CASES.filter((c) => new Date(c.CrimeRegisteredDate) >= new Date(now.getTime() - dayMs));
    const baseline = CASES.filter(
      (c) => new Date(c.CrimeRegisteredDate) >= new Date(now.getTime() - 8 * dayMs) && new Date(c.CrimeRegisteredDate) < new Date(now.getTime() - dayMs),
    );
    // Group by district+category
    const key = (did: number, cat: number) => `${did}:${cat}`;
    const baselineCounts = new Map<string, number>();
    for (const c of baseline) baselineCounts.set(key(c.DistrictID, c.CrimeMajorHeadID), (baselineCounts.get(key(c.DistrictID, c.CrimeMajorHeadID)) ?? 0) + 1);
    const recentCounts = new Map<string, number>();
    for (const c of last24) recentCounts.set(key(c.DistrictID, c.CrimeMajorHeadID), (recentCounts.get(key(c.DistrictID, c.CrimeMajorHeadID)) ?? 0) + 1);

    const alerts: AlertItem[] = [];
    let altId = 1;
    const catNames: Record<number, string> = { 1: 'Cyber Fraud', 2: 'House Breaking', 3: 'Robbery', 4: 'Vehicle Theft', 5: 'Assault', 6: 'Chain Snatching', 7: 'Cheating', 8: 'Murder', 9: 'Cattle Theft' };
    const distNames: Record<number, string> = { 443: 'Bengaluru Urban', 444: 'Bengaluru Rural', 445: 'Mysuru', 446: 'Belagavi', 447: 'Kalaburagi', 448: 'Mangaluru', 449: 'Hubballi-Dharwad', 450: 'Davanagere' };
    for (const [k, recent] of recentCounts) {
      const base = baselineCounts.get(k) ?? 0;
      const ratio = base === 0 ? recent : recent / (base / 7);
      if (ratio >= 1.5 && recent >= 1) {
        const [didStr, catStr] = k.split(':');
        const did = Number(didStr);
        const cat = Number(catStr);
        alerts.push({
          id: `ALT-${altId++}`,
          title: `${catNames[cat] ?? 'Crime'} surge — ${distNames[did] ?? `District ${did}`}`,
          location: distNames[did] ?? `District ${did}`,
          description: `${recent} cases in last 24h vs ${(base / 7).toFixed(1)}/day baseline (${ratio.toFixed(1)}x)`,
          severity: ratio >= 2.5 ? 'HIGH' : ratio >= 2 ? 'MEDIUM' : 'LOW',
          timestamp: 'recent',
          districtId: did,
          crimeCategory: catNames[cat],
          currentCount: recent,
          baselineCount: Math.round(base / 7),
          spikeRatio: Number(ratio.toFixed(2)),
        });
      }
    }
    return ok(alerts.sort((a, b) => b.spikeRatio - a.spikeRatio)) as unknown as { success: true; data: T };
  }

  // GET /analytics/trends?range=7d|30d|ytd&category=ipc|sll|cyber
  if (method === 'GET' && path.startsWith('/analytics/trends')) {
    await delay(150);
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const range = params.get('range') ?? '30d';
    const end = new Date('2026-07-25T23:59:59');
    const start = range === '7d' ? new Date(end.getTime() - 7 * 86400000) : range === 'ytd' ? new Date('2026-01-01') : new Date(end.getTime() - 30 * 86400000);
    const spanDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const buckets = range === '7d' ? 7 : range === 'ytd' ? 3 : 6;
    const bucketSize = Math.ceil(spanDays / buckets);
    const series: TrendPoint[] = [];
    // Category mapping: cyber=1,7 ; ipc(others)=2,3,4,5,6,8,9
    for (let b = 0; b < buckets; b++) {
      const bStart = new Date(start.getTime() + b * bucketSize * 86400000);
      const bEnd = new Date(Math.min(start.getTime() + (b + 1) * bucketSize * 86400000, end.getTime()));
      const inBucket = CASES.filter((c) => {
        const d = new Date(c.CrimeRegisteredDate);
        return d >= bStart && d < bEnd;
      });
      const cyber = inBucket.filter((c) => c.CrimeMajorHeadID === 1 || c.CrimeMajorHeadID === 7).length;
      const ipc = inBucket.filter((c) => [2, 3, 4, 5, 6, 8, 9].includes(c.CrimeMajorHeadID)).length;
      series.push({ label: range === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][b] : `P${b + 1}`, ipc, sll: 0, cyber });
    }
    return ok(series) as unknown as { success: true; data: T };
  }

  // GET /analytics/socio-correlation — joins case counts to socio-economic seed.
  if (method === 'GET' && path === '/analytics/socio-correlation') {
    await delay(150);
    const counts = new Map<number, number>();
    for (const c of CASES) counts.set(c.DistrictID, (counts.get(c.DistrictID) ?? 0) + 1);
    const rows: SocioCorrelationRow[] = SOCIO.map((s) => ({
      districtId: s.DistrictID,
      districtName: s.DistrictName,
      crimeCount: counts.get(s.DistrictID) ?? 0,
      urbanizationPct: s.UrbanizationPct,
      literacyRate: s.LiteracyRate,
      economicIndex: s.EconomicIndex,
    }));
    // Compute Pearson r between crime count and urbanization.
    const n = rows.length;
    const mx = rows.reduce((s, r) => s + r.crimeCount, 0) / n;
    const my = rows.reduce((s, r) => s + r.urbanizationPct, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (const r of rows) { num += (r.crimeCount - mx) * (r.urbanizationPct - my); dx += (r.crimeCount - mx) ** 2; dy += (r.urbanizationPct - my) ** 2; }
    const r = dx && dy ? num / Math.sqrt(dx * dy) : 0;
    const withR = rows.map((row) => ({ ...row, pearsonR: Number(r.toFixed(3)) }));
    return ok(withR) as unknown as { success: true; data: T };
  }

  // ---- Phase 2.4: anomaly detection (z-score, dynamic whyFlagged) ----
  // GET /ai/anomalies — computes z-score per district+category over 30-day baseline.
  if (method === 'GET' && path === '/ai/anomalies') {
    await delay(200);
    const now = new Date('2026-07-25T23:59:59');
    const dayMs = 86400000;
    const recentStart = new Date(now.getTime() - dayMs);
    const baselineStart = new Date(now.getTime() - 31 * dayMs);
    const recent = CASES.filter((c) => new Date(c.CrimeRegisteredDate) >= recentStart);
    const baseline = CASES.filter((c) => new Date(c.CrimeRegisteredDate) >= baselineStart && new Date(c.CrimeRegisteredDate) < recentStart);

    const stats = new Map<string, { mean: number; variance: number }>();
    for (const c of baseline) {
      const k = `${c.DistrictID}:${c.CrimeMajorHeadID}`;
      if (!stats.has(k)) stats.set(k, { mean: 0, variance: 0 });
      stats.get(k)!.mean += 1 / 30;
      stats.get(k)!.variance += 1 / 900; // Poisson approx
    }

    const recentCounts = new Map<string, number>();
    for (const c of recent) {
      const k = `${c.DistrictID}:${c.CrimeMajorHeadID}`;
      recentCounts.set(k, (recentCounts.get(k) ?? 0) + 1);
    }

    const catNames: Record<number, string> = { 1: 'Cyber Fraud', 2: 'House Breaking', 3: 'Robbery', 4: 'Vehicle Theft', 5: 'Assault', 6: 'Chain Snatching', 7: 'Cheating', 8: 'Murder', 9: 'Cattle Theft' };
    const distNames: Record<number, string> = { 443: 'Bengaluru Urban', 444: 'Bengaluru Rural', 445: 'Mysuru', 446: 'Belagavi', 447: 'Kalaburagi', 448: 'Mangaluru', 449: 'Hubballi-Dharwad', 450: 'Davanagere' };

    const anomalies: any[] = [];
    let rzId = 1;
    for (const [k, current] of recentCounts) {
      const s = stats.get(k);
      if (!s || s.mean === 0) continue;
      const std = Math.sqrt(s.variance);
      const z = (current - s.mean) / std;
      if (z > 2.5) {
        const [didStr, catStr] = k.split(':');
        const did = Number(didStr);
        const cat = Number(catStr);
        anomalies.push({
          id: `RZ-${rzId++}`,
          zoneName: `${distNames[did] ?? 'District ' + did} — ${catNames[cat] ?? 'Category ' + cat}`,
          district: distNames[did] ?? `District ${did}`,
          station: `District ${did}`,
          riskScore: Math.min(100, Math.round(50 + z * 12)),
          riskLevel: z > 4 ? 'CRITICAL' : z > 3 ? 'HIGH' : 'MODERATE',
          predictedCategory: catNames[cat] ?? `Category ${cat}`,
          whyFlagged: [
            `Current 24h count (${current}) is ${z.toFixed(1)}σ above the 30-day daily mean (${s.mean.toFixed(1)})`,
            `Standard deviation: ${std.toFixed(2)} cases/day`,
            `Spike ratio: ${(current / s.mean).toFixed(1)}x baseline`,
          ],
          recommendedAction: `Investigate ${catNames[cat] ?? 'crime'} surge in ${distNames[did] ?? 'District ' + did}; deploy additional patrols`,
          confidence: Math.min(95, Math.round(60 + z * 8)),
          zScore: Number(z.toFixed(2)),
        });
      }
    }
    return ok(anomalies.sort((a, b) => b.zScore - a.zScore)) as unknown as { success: true; data: T };
  }

  // POST /ai/retrain — honest "not configured" unless QUICKML_PIPELINE_ENDPOINT set.
  if (method === 'POST' && path === '/ai/retrain') {
    await delay(200);
    return ok({
      source: 'QuickML (not yet deployed)',
      status: 'NOT_CONFIGURED',
      modelVersion: null,
      message: 'QUICKML_PIPELINE_ENDPOINT not set. See docs/QUICKML_PREDICTIVE_SETUP.md',
    }) as unknown as { success: true; data: T };
  }

  // ---- Phase 1.5: offenders (repeat-offender tracking + MO + cross-case) ----

  // GET /offenders — list all offenders with case counts + MO tags.
  if (method === 'GET' && path === '/offenders') {
    await delay(150);
    const offenders = OFFENDERS.map((o) => buildOffenderProfile(o.PersonKey, o.PersonName, o.PriorArrests));
    return ok(offenders) as unknown as { success: true; data: T };
  }

  // GET /offenders/{personKey} — single offender's full cross-case profile.
  const offenderMatch = method === 'GET' && path.match(/^\/offenders\/([^/]+)$/);
  if (offenderMatch) {
    const key = decodeURIComponent(offenderMatch[1]);
    const o = OFFENDERS.find((x) => x.PersonKey === key);
    if (!o) return null;
    await delay(150);
    return ok(buildOffenderProfile(o.PersonKey, o.PersonName, o.PriorArrests)) as unknown as { success: true; data: T };
  }

  return null;
}

/** Build an offender profile by joining Accused + CaseMaster seed data. */
function buildOffenderProfile(personKey: string, personName: string, priorArrests: number) {
  const caseLinks = ACCUSED.filter((a) => a.PersonKey === personKey);
  const caseHistory = caseLinks.map((a) => {
    const c = CASES.find((x) => x.CaseMasterID === a.CaseMasterID);
    return {
      caseMasterId: a.CaseMasterID,
      crimeNo: c?.CrimeNo ?? '',
      districtId: c?.DistrictID ?? 0,
      crimeCategory: c?.BriefFacts ?? '',
      modusOperandi: c?.ModusOperandi ?? '',
      registeredDate: c?.CrimeRegisteredDate ?? '',
      status: a.Status,
    };
  });
  const moMap = new Map<string, number>();
  for (const h of caseHistory) moMap.set(h.modusOperandi, (moMap.get(h.modusOperandi) ?? 0) + 1);
  const districts = [...new Set(caseHistory.map((h) => h.districtId))];
  return {
    personKey,
    personName,
    priorArrests,
    totalCases: caseHistory.length,
    districtsActive: districts,
    modusOperandiTags: Array.from(moMap.entries()).sort((a, b) => b[1] - a[1]).map(([mo, count]) => ({ mo, count })),
    caseHistory: caseHistory.sort((a, b) => b.registeredDate.localeCompare(a.registeredDate)),
  };
}

/** Bucket a "YYYY-MM-DD HH:MM:SS" timestamp into a time-of-day category. */
function timeOfDayBucket(ts: string): 'night' | 'morning' | 'afternoon' | 'evening' {
  const h = Number(ts.slice(11, 13));
  if (h >= 0 && h < 6) return 'night';
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}
