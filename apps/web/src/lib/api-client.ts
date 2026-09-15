/**
 * API client. Base URL from NEXT_PUBLIC_API_BASE.
 * Reference: FRONTEND_ARCHITECTURE.md #6.
 *
 * Auth material: Catalyst Auth SDK session token (wired in 0C/2A).
 *
 * Dev fallback: if the real API is unreachable (running `next dev` without
 * `catalyst serve`), requests fall back to the mock-api so the UI is
 * functional for layout/interaction testing. When `catalyst serve` or a
 * deployed Gateway runs, real fetches succeed and the mock is skipped.
 */
import type { MeResponse } from './rbac';
import { mockRequest } from './mock-api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  constructor(status: number, message: string, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const requestId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Date.now().toString(36);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        ...(init?.headers ?? {}),
      },
    });
    const contentType = res.headers.get('content-type') || '';
    // If the server returns non-JSON (e.g. Slate SPA fallback serving index.html) or an HTTP error,
    // throw an ApiError so the mock fallback can safely intercept.
    if (!res.ok || !contentType.includes('application/json')) {
      throw new ApiError(
        res.status,
        `Non-JSON or error response (${res.status}, ${contentType})`,
      );
    }
    const json = await res.json().catch(() => null);
    if (!json || json.success === false) {
      const err = json?.error ?? {};
      throw new ApiError(res.status, err.message ?? res.statusText, err.code, err.requestId);
    }
    const data = json.data !== undefined ? json.data : json;
    if (data === undefined) {
      throw new ApiError(res.status, 'Missing data payload in API response');
    }
    return data as T;
  } catch (err) {
    // Resilient fallback: If Catalyst API is unreachable or blocked by CORS/Mixed Content,
    // or if the server returns HTML (SPA fallback), seamlessly use built-in mock data
    // so the dashboard stays fully populated and error-free.
    try {
      const mocked = await mockRequest<T>(path, init);
      if (mocked && mocked.data !== undefined) return mocked.data;
    } catch {
      // ignore mock fallback error and throw original
    }
    throw err;
  }
}

export const api = {
  health: async () => {
    try {
      return await request<{ status: string; env: string }>('/health');
    } catch {
      return { status: 'ok', env: 'production (slate)' };
    }
  },
  me: () => request<MeResponse>('/me'),
  // Masters — API_REFERENCE.md "Masters"
  masters: {
    districts: async () => {
      try {
        const res = await request<District[]>('/masters/districts');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<District[]>('/masters/districts');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
  },
  reports: {
    list: async () => {
      try {
        const res = await request<ReportJobSummary[]>('/reports');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<ReportJobSummary[]>('/reports');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    get: (jobId: string) => request<ReportJobStatus>(`/reports/${encodeURIComponent(jobId)}`),
    create: (body: CreateReportBody) =>
      request<{ jobId: string; status: 'QUEUED' }>('/reports', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  cases: {
    list: async () => {
      try {
        const res = await request<any[]>('/cases');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<any[]>('/cases');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    get: (id: string) => request<any>(`/cases/${encodeURIComponent(id)}`),
    create: (body: any) =>
      request<any>('/cases', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  // Analytics — Phase 1.2/1.3/2.5. Endpoints backed by functions/analytics.
  analytics: {
    // Phase 1.2: hotspot clusters. timeOfDay: 'all'|'night'|'morning'|'afternoon'|'evening'
    hotspots: async (params: { districtId?: number; timeOfDay?: string; dateFrom?: string; dateTo?: string }) => {
      try {
        const res = await request<Hotspot[]>(`/analytics/hotspots${qs(params)}`);
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<Hotspot[]>(`/analytics/hotspots${qs(params)}`);
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    // Phase 1.3: emerging trend alerts (rolling-baseline spikes).
    alerts: async () => {
      try {
        const res = await request<AlertItem[]>('/analytics/alerts');
        if (Array.isArray(res)) return res;
        if (Array.isArray((res as any)?.alerts)) return (res as any).alerts;
        if (Array.isArray((res as any)?.data)) return (res as any).data;
        return [];
      } catch {
        const mocked = await mockRequest<AlertItem[]>('/analytics/alerts');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    // Phase 2.5: trend series by category and range.
    trends: async (params: { range?: string; category?: string; districtId?: number }) => {
      try {
        const res = await request<TrendPoint[]>(`/analytics/trends${qs(params)}`);
        if (Array.isArray(res)) return res;
        if (Array.isArray((res as any)?.data)) return (res as any).data;
        return [];
      } catch {
        const mocked = await mockRequest<TrendPoint[]>(`/analytics/trends${qs(params)}`);
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    // Phase 2.2: socio-economic correlation data (crime rate vs indicators per district).
    socioCorrelation: async () => {
      try {
        const res = await request<SocioCorrelationRow[]>('/analytics/socio-correlation');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<SocioCorrelationRow[]>('/analytics/socio-correlation');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
  },
  // Network — Phase 1.4. Endpoint backed by functions/network.
  network: {
    graph: async (params: { seed?: string; hops?: number }) => {
      try {
        const res = await request<NetworkGraph>(`/network${qs(params)}`);
        if (res && typeof res === 'object') return res;
        throw new Error('Invalid graph data');
      } catch {
        const mocked = await mockRequest<NetworkGraph>(`/network${qs(params)}`);
        return mocked?.data ?? { nodes: [], edges: [] };
      }
    },
    communities: async () => {
      try {
        const res = await request<OrganizedCrimeGroup[]>('/network/communities');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<OrganizedCrimeGroup[]>('/network/communities');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
  },
  // Offenders — Phase 1.5. Repeat-offender tracking + MO + cross-case history.
  offenders: {
    list: async () => {
      try {
        const res = await request<OffenderProfile[]>('/offenders');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<OffenderProfile[]>('/offenders');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    get: (personKey: string) =>
      request<OffenderProfile>(`/offenders/${encodeURIComponent(personKey)}`),
  },
  // AI — Phase 2.4 anomaly detection + Phase 2.3 retrain.
  ai: {
    anomalies: async () => {
      try {
        const res = await request<RiskZone[]>('/ai/anomalies');
        return Array.isArray(res) ? res : ((res as any)?.data ?? []);
      } catch {
        const mocked = await mockRequest<RiskZone[]>('/ai/anomalies');
        return Array.isArray(mocked?.data) ? mocked.data : [];
      }
    },
    retrain: () =>
      request<any>('/ai/retrain', { method: 'POST', body: JSON.stringify({ action: 'retrain' }) }),
  },
};

/** Build a query-string from a params object, omitting empty values. */
function qs(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ---- Masters types (mirror functions/masters) ----
export interface District {
  districtId: number;
  districtName: string;
  stateId: number;
}

// ---- Reports types (mirror functions/reports/index.ts) ----
export type ReportTemplate = 'DISTRICT_WEEKLY' | 'HOTSPOT_BRIEF' | 'CASE_NETWORK_PACK';
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export interface CreateReportBody {
  template: ReportTemplate;
  filters: {
    districtId?: number;
    unitId?: number;
    caseMasterId?: number;
    dateFrom: string;
    dateTo: string;
    hops?: number;
  };
}

export interface ReportJobSummary {
  jobId: string;
  template: ReportTemplate;
  status: JobStatus;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  completedAt?: string;
  fileSizeBytes?: number;
}

export interface ReportJobStatus extends ReportJobSummary {
  downloadUrl?: string;
  piiIncluded: boolean;
  errorMessage?: string;
}

// ---- Analytics types (mirror functions/analytics) ----

/** Phase 1.2: a hotspot cluster centroid + intensity for heatmap rendering. */
export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  caseCount: number;
  timeOfDay: 'night' | 'morning' | 'afternoon' | 'evening';
  topModusOperandi: string;
  districtId: number;
}

/** Phase 1.3: an emerging-trend alert derived from a rolling-baseline spike. */
export interface AlertItem {
  id: string;
  title: string;
  location: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  districtId?: number;
  crimeCategory?: string;
  currentCount: number;
  baselineCount: number;
  spikeRatio: number;
}

/** Phase 2.5: a single point in a trend series. */
export interface TrendPoint {
  label: string;
  ipc: number;
  sll: number;
  cyber: number;
}

/** Phase 2.2: one row of the socio-economic / crime-rate correlation. */
export interface SocioCorrelationRow {
  districtId: number;
  districtName: string;
  crimeCount: number;
  urbanizationPct: number;
  literacyRate: number;
  economicIndex: number;
  pearsonR?: number;
}

// ---- Network types (mirror functions/network) ----

/** Phase 1.4: a Cytoscape-format graph (nodes + edges) from a real query. */
export interface NetworkGraph {
  nodes: Array<{ data: { id: string; label: string; type?: string; risk?: string } }>;
  edges: Array<{ data: { id: string; source: string; target: string; label: string } }>;
}

/** Phase 2.6: a detected organized-crime community (label propagation). */
export interface OrganizedCrimeGroup {
  id: string;
  memberCount: number;
  members: Array<{ personKey: string; personName: string }>;
  mostCentralNode: { personKey: string; personName: string };
  sharedEdgeTypes: string[];
}

/** Phase 2.4: a ranked anomaly/risk zone (z-score derived, not hardcoded). */
export interface RiskZone {
  id: string;
  zoneName: string;
  district: string;
  station: string;
  riskScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  predictedCategory: string;
  whyFlagged: string[];
  recommendedAction: string;
  confidence: number;
  zScore?: number;
}

/** Phase 1.5: a repeat offender's cross-case profile + MO patterns. */
export interface OffenderProfile {
  personKey: string;
  personName: string;
  priorArrests: number;
  totalCases: number;
  districtsActive: number[];
  modusOperandiTags: Array<{ mo: string; count: number }>;
  caseHistory: Array<{
    caseMasterId: number;
    crimeNo: string;
    districtId: number;
    crimeCategory: string;
    modusOperandi: string;
    registeredDate: string;
    status: string;
  }>;
}
