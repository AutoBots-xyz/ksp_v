'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import {
  api,
  type ReportTemplate,
  type JobStatus,
  type CreateReportBody,
  type ReportJobSummary,
  type District,
} from '@/lib/api-client';
import { canAccessRoute, type Role, type MeResponse } from '@/lib/rbac';

interface TemplateOption {
  code: ReportTemplate;
  title: string;
  description: string;
  estimatedPages: string;
  tags: string[];
}

const TEMPLATES: TemplateOption[] = [
  {
    code: 'DISTRICT_WEEKLY',
    title: 'Weekly District Crime Intelligence Report',
    description:
      'Comprehensive analysis of FIR trends, heinous offences, station rankings, and statutory disposal timelines for district leadership.',
    estimatedPages: '4-6 Pages',
    tags: ['District Scope', 'Weekly', 'Executive Summary'],
  },
  {
    code: 'HOTSPOT_BRIEF',
    title: 'Spatial Hotspot & Patrol Allocation Brief',
    description:
      'QuickML risk score breakdown, incident pin density map snapshot, and recommended Beat patrol schedules.',
    estimatedPages: '2-3 Pages',
    tags: ['Patrol Ops', 'Spatial Risk', 'Hotspots'],
  },
  {
    code: 'CASE_NETWORK_PACK',
    title: 'Case 360° & Link Analysis Dossier',
    description:
      'Complete case investigation dossier including accused relationship graph, evidence log, and PII audit verification.',
    estimatedPages: '8-12 Pages',
    tags: ['Case 360°', 'Network Graph', 'Legal Dossier'],
  },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  } catch {
    return iso;
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  const mb = bytes / 1_000_000;
  return `${mb.toFixed(1)} MB PDF`;
}

function statusColor(status: JobStatus): string {
  switch (status) {
    case 'COMPLETE':
      return 'bg-emerald-100 text-emerald-700';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700';
    case 'QUEUED':
      return 'bg-amber-100 text-amber-700';
    case 'FAILED':
      return 'bg-rose-100 text-rose-700';
  }
}

export default function ReportsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [history, setHistory] = useState<ReportJobSummary[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>(TEMPLATES[0]);
  const [districtId, setDistrictId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [caseMasterId, setCaseMasterId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [hops, setHops] = useState<string>('1');

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pollingJob, setPollingJob] = useState<string | null>(null);

  const [searchHistory, setSearchHistory] = useState('');

  // Initial load: /me + districts + history. Role-gate the page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInit(true);
      setInitError(null);
      try {
        const meData = await api.me();
        if (cancelled) return;
        setMe(meData);
        if (!canAccessRoute('/reports', meData.role as Role)) {
          setInitError('You are not authorized to access Reports (export roles only).');
          setLoadingInit(false);
          return;
        }
        const [districtsData, historyData] = await Promise.all([
          api.masters.districts(),
          api.reports.list(),
        ]);
        if (cancelled) return;
        setDistricts(districtsData);
        setHistory(historyData);
        // Default date range: last 7 days.
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 7);
        setDateTo(to.toISOString().slice(0, 10));
        setDateFrom(from.toISOString().slice(0, 10));
      } catch (err) {
        if (!cancelled) {
          setInitError(
            err instanceof Error ? err.message : 'Failed to load Reports. Is the API running?',
          );
        }
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track component mounted status to prevent memory leak updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Poll a QUEUED/PROCESSING job until COMPLETE/FAILED.
  const pollJob = useCallback(async (jobId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    const interval = 1500;
    const tick = async () => {
      if (!isMountedRef.current) return;
      attempts += 1;
      try {
        const job = await api.reports.get(jobId);
        if (!isMountedRef.current) return;
        // Update history entry.
        setHistory((prev) =>
          prev.map((h) =>
            h.jobId === jobId
              ? {
                  ...h,
                  status: job.status,
                  completedAt: job.completedAt,
                  fileSizeBytes: job.fileSizeBytes,
                }
              : h,
          ),
        );
        if (job.status === 'COMPLETE') {
          setPollingJob(null);
          setToast(`Report ${jobId} generated successfully.`);
          setTimeout(() => {
            if (isMountedRef.current) setToast(null);
          }, 4000);
          return;
        }
        if (job.status === 'FAILED') {
          setPollingJob(null);
          setToast(`Report ${jobId} failed: ${job.errorMessage ?? 'unknown error'}`);
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(tick, interval);
        } else {
          setPollingJob(null);
          setToast(`Report ${jobId} is still processing. Check back later.`);
        }
      } catch {
        if (!isMountedRef.current) return;
        if (attempts < maxAttempts) setTimeout(tick, interval);
        else setPollingJob(null);
      }
    };
    setTimeout(tick, interval);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setCreateError(null);
    setCreating(true);
    try {
      const filters: CreateReportBody['filters'] = {
        dateFrom,
        dateTo,
      };
      if (districtId) filters.districtId = Number(districtId);
      if (unitId) filters.unitId = Number(unitId);
      if (caseMasterId) filters.caseMasterId = Number(caseMasterId);
      if (selectedTemplate.code === 'CASE_NETWORK_PACK') filters.hops = Number(hops);

      const body: CreateReportBody = { template: selectedTemplate.code, filters };
      const { jobId } = await api.reports.create(body);

      // Add to history as QUEUED.
      const newEntry: ReportJobSummary = {
        jobId,
        template: selectedTemplate.code,
        status: 'QUEUED',
        createdBy: me.userProfileId.toString(),
        createdByRole: me.role,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [newEntry, ...prev]);
      setPollingJob(jobId);
      void pollJob(jobId);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to queue report.');
    } finally {
      setCreating(false);
    }
  };

  const filteredHistory = history.filter((rpt) => {
    if (!searchHistory) return true;
    const q = searchHistory.toLowerCase();
    return (
      rpt.jobId.toLowerCase().includes(q) ||
      rpt.template.toLowerCase().includes(q) ||
      rpt.createdByRole.toLowerCase().includes(q)
    );
  });

  // Role-derived (server-authoritative): PII inclusion is NOT a client toggle.
  const piiIncluded = me?.permissions.canSeePii ?? false;
  const isStateRole = me?.permissions.isStateScope ?? false;

  // Loading state.
  if (loadingInit) {
    return (
      <AppShell title="SmartBrowz Automated PDF Reports" scope="Export-Authorized Roles Only">
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          Loading reports...
        </div>
      </AppShell>
    );
  }

  // Auth / role error state.
  if (initError) {
    return (
      <AppShell title="SmartBrowz Automated PDF Reports" scope="Export-Authorized Roles Only">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <h2 className="text-base font-bold text-rose-700">Access Restricted</h2>
          <p className="mt-2 text-sm text-rose-600">{initError}</p>
          <p className="mt-3 text-xs text-gray-400">
            Reports require an export-capable role (SUPER_ADMIN, SCRB_ANALYST, DISTRICT_COMMAND)
            per CONFIGURATION.md EXPORT_ROLES.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="SmartBrowz Automated PDF Reports" scope={`Role: ${me?.role ?? '—'}`}>
      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-emerald-900 shadow-sm">
          <span className="flex-1">{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="font-extrabold text-emerald-700 ml-2 shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <div>
            <span className="text-sm font-bold text-ksp-navy">
              Catalyst SmartBrowz PDF Engine
            </span>
            <div className="text-xs text-gray-400">
              Headless Chromium automated PDF rendering
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-ksp-slate px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-ksp-accent">
            PII: {piiIncluded ? 'Unredacted' : 'Masked'}
          </span>
          <span className="rounded-md bg-ksp-slate px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-ksp-accent">
            Scope: {isStateRole ? 'State-wide' : 'Own district'}
          </span>
        </div>
      </div>

      {/* Template selection */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-ksp-navy">Select SmartBrowz Report Template</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate.code === tpl.code;
            return (
              <button
                type="button"
                key={tpl.code}
                onClick={() => setSelectedTemplate(tpl)}
                className={`cursor-pointer rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'scale-[1.01] border-ksp-blue bg-ksp-slate/40 shadow-sm ring-1 ring-ksp-blue'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-ksp-accent">{tpl.code}</span>
                  <span className="text-[10px] font-bold text-gray-400">{tpl.estimatedPages}</span>
                </div>
                <h3 className="mt-2 text-xs font-bold leading-snug text-ksp-navy">{tpl.title}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{tpl.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main grid */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Generator form */}
        <div className="rounded-xl border border-gray-100 bg-white p-3 sm:p-5 shadow-sm w-full lg:w-2/5">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <span className="text-[10px] font-bold uppercase text-ksp-accent">CONFIG & GENERATE</span>
            <h2 className="text-base font-bold text-ksp-navy">{selectedTemplate.title}</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            {/* District scope — locked for non-state roles */}
            <div>
              <label className="mb-1 block font-bold text-ksp-navy">
                Target District {!isStateRole && '(locked to your scope)'}
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={!isStateRole && districts.length <= 1}
                className="w-full rounded-lg border border-gray-200 p-2 text-xs font-bold text-ksp-navy focus:ring-2 focus:ring-ksp-blue disabled:bg-gray-50"
              >
                <option value="">— Select district —</option>
                {districts.map((d) => (
                  <option key={d.districtId} value={d.districtId}>
                    {d.districtName} (ID: {d.districtId})
                  </option>
                ))}
              </select>
              {!isStateRole && (
                <p className="mt-1 text-[10px] text-gray-400">
                  Server enforces scope: you can only generate reports for your assigned district.
                </p>
              )}
            </div>

            {/* Unit (optional) */}
            <div>
              <label className="mb-1 block font-bold text-ksp-navy">Police Station (optional)</label>
              <input
                type="number"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                placeholder="e.g. 60006"
                className="w-full rounded-lg border border-gray-200 p-2 text-xs text-ksp-navy focus:ring-2 focus:ring-ksp-blue"
              />
            </div>

            {/* Case ID for CASE_NETWORK_PACK */}
            {selectedTemplate.code === 'CASE_NETWORK_PACK' && (
              <>
                <div>
                  <label className="mb-1 block font-bold text-ksp-navy">Case Master ID *</label>
                  <input
                    type="number"
                    value={caseMasterId}
                    onChange={(e) => setCaseMasterId(e.target.value)}
                    placeholder="e.g. 14"
                    required
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs text-ksp-navy focus:ring-2 focus:ring-ksp-blue"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-ksp-navy">Graph Hops (max 2)</label>
                  <select
                    value={hops}
                    onChange={(e) => setHops(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs text-ksp-navy"
                  >
                    <option value="1">1 hop</option>
                    <option value="2">2 hops</option>
                  </select>
                </div>
              </>
            )}

            {/* Date range (ISO, capped at MAX_DATE_RANGE_DAYS server-side) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-bold text-ksp-navy">Date From *</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-ksp-navy focus:ring-2 focus:ring-ksp-blue"
                />
              </div>
              <div>
                <label className="mb-1 block font-bold text-ksp-navy">Date To *</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs text-ksp-navy focus:ring-2 focus:ring-ksp-blue"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400">
              Date range capped at 366 days (MAX_DATE_RANGE_DAYS) server-side.
            </p>

            {/* PII notice — role-derived, NOT a toggle */}
            <div className="rounded-lg bg-ksp-slate/40 p-3 text-[11px] text-gray-600">
              {piiIncluded ? (
                <>Your role permits unredacted PII in reports. Each PII view is audit-logged (VIEW_CASE / EXPORT).</>
              ) : (
                <>PII is masked in reports for your role. PII access is server-derived from PII_ROLES, not a client toggle.</>
              )}
            </div>

            {createError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] font-bold text-rose-700">
                {createError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating || pollingJob !== null}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-ksp-navy py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-ksp-blue disabled:opacity-60"
            >
              {creating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Queuing PDF job...
                </>
              ) : (
                'Generate Authorized PDF Report'
              )}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="rounded-xl border border-gray-100 bg-white p-3 sm:p-5 shadow-sm flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-ksp-navy">Generated Report History</h2>
              <p className="text-xs text-gray-400">Authorized PDF jobs with audit logging</p>
            </div>
            <input
              type="text"
              placeholder="Search Job ID, template, role..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-ksp-navy focus:outline-none focus:ring-2 focus:ring-ksp-blue"
            />
          </div>

          <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
            {filteredHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-xs text-gray-400">
                No reports yet. Generate one above.
              </div>
            ) : (
              filteredHistory.map((rpt) => (
                  <div
                    key={rpt.jobId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 sm:p-3.5 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ksp-navy">{rpt.jobId}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${statusColor(rpt.status)}`}
                        >
                          {rpt.status}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatSize(rpt.fileSizeBytes)}</span>
                      </div>
                      <h3 className="text-xs font-bold text-ksp-navy">{rpt.template}</h3>
                      <div className="text-[10px] text-gray-400">
                        {rpt.createdByRole} · {formatDate(rpt.createdAt)}
                      </div>
                    </div>
                    {rpt.status === 'COMPLETE' ? (
                      <a
                        href={`/api/v1/reports/${rpt.jobId}/download`}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-ksp-navy px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-ksp-blue w-full sm:w-auto"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-400 text-center sm:text-left">
                        {rpt.status === 'PROCESSING' ? 'Rendering...' : 'Queued...'}
                      </span>
                    )}
                  </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
