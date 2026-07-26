'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';

interface AuditEvent {
  id: string;
  timestamp: string;
  userEmail: string;
  role: string;
  action: 'VIEW_CASE' | 'EXPORT' | 'ROLE_CHANGE' | 'IMPORT' | 'PII_ACCESS';
  resource: string;
  clientIp: string;
  requestId: string;
  isPii: boolean;
  userAgent?: string;
  shaHash?: string;
}

const AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'AUD-9901',
    timestamp: '2026-07-24 20:45:12 IST',
    userEmail: 'sho.whitefield@ksp.local',
    role: 'SHO',
    action: 'PII_ACCESS',
    resource: 'Case: 2026-WF-0014 (Complainant Phone Read)',
    clientIp: '10.42.1.88',
    requestId: 'req_88a912',
    isPii: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KSP-Client/2.4',
    shaHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'AUD-9902',
    timestamp: '2026-07-24 20:30:05 IST',
    userEmail: 'sp.bu@ksp.local',
    role: 'DISTRICT_COMMAND',
    action: 'EXPORT',
    resource: 'Report: DISTRICT_WEEKLY (Bengaluru Urban)',
    clientIp: '10.42.3.14',
    requestId: 'req_77b310',
    isPii: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) SmartBrowz/1.2',
    shaHash: '8f4e51241a221fbb6059d3e8e788c67926e828d54a2a16d860e0a58e657c9e13',
  },
  {
    id: 'AUD-9903',
    timestamp: '2026-07-24 19:42:30 IST',
    userEmail: 'admin@ksp.local',
    role: 'SUPER_ADMIN',
    action: 'ROLE_CHANGE',
    resource: 'User USR-004: Role changed to SHO',
    clientIp: '10.42.0.1',
    requestId: 'req_11c490',
    isPii: false,
    userAgent: 'KSP-AdminConsole/1.0',
    shaHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
  },
  {
    id: 'AUD-9904',
    timestamp: '2026-07-24 18:15:00 IST',
    userEmail: 'admin@ksp.local',
    role: 'SUPER_ADMIN',
    action: 'IMPORT',
    resource: 'Circuit: fir_import_pipeline (500 Records)',
    clientIp: '10.42.0.1',
    requestId: 'req_00d982',
    isPii: false,
    userAgent: 'Catalyst-IngestPipeline/3.1',
    shaHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
  },
  {
    id: 'AUD-9905',
    timestamp: '2026-07-24 17:50:22 IST',
    userEmail: 'scrb.analyst@ksp.local',
    role: 'SCRB_ANALYST',
    action: 'VIEW_CASE',
    resource: 'Case: 2026-EC-0089 (Case 360° Inspection)',
    clientIp: '10.42.2.45',
    requestId: 'req_55e123',
    isPii: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) KSP-Client/2.4',
    shaHash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
  },
];

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('Today');
  const [searchUser, setSearchUser] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('CSV');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowExportModal(false);

    // Generate CSV payload and trigger client-side download
    const headers = 'ID,Timestamp,UserEmail,Role,Action,Resource,ClientIP,RequestId,IsPII,SHA256Hash\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.userEmail}","${l.role}","${l.action}","${l.resource}","${l.clientIp}","${l.requestId}",${l.isPii},"${l.shaHash}"`,
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `AUDIT_EXPORT_${new Date().toISOString().slice(0, 10)}.${exportFormat.toLowerCase()}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg(
      `✅ Audit Log Export (AUDIT_EXPORT_${new Date().toISOString().slice(0, 10)}.${exportFormat.toLowerCase()}) downloaded successfully!`,
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filteredLogs = AUDIT_LOGS.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    const q = searchUser.toLowerCase().trim();
    if (
      q &&
      !log.userEmail.toLowerCase().includes(q) &&
      !log.resource.toLowerCase().includes(q) &&
      !log.requestId.toLowerCase().includes(q) &&
      !log.clientIp.includes(q)
    ) {
      return false;
    }
    return true;
  });

  return (
    <AppShell title="Security & Access Audit Log" scope="SUPER_ADMIN / AUDITOR Scope">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-emerald-900 shadow-sm flex items-center justify-between">
          <span className="flex-1">{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="text-emerald-700 font-extrabold ml-2 shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl bg-white p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <span className="text-sm font-bold text-ksp-navy">Immutable Security Audit Trail</span>
            <div className="text-xs text-gray-400">ADR-012 Security & PII Access Log Enforcement</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="rounded-lg bg-ksp-navy hover:bg-ksp-blue transition-colors px-3 py-1.5 text-[10px] sm:text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
          >
            📥 Export
          </button>

          <span className="rounded-md bg-ksp-slate px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-ksp-accent whitespace-nowrap">
            Auditor Active
          </span>
        </div>
      </div>

      {/* Audit Stats Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-400">Total Audit Events</div>
          <div className="mt-2 text-3xl font-extrabold text-ksp-navy">1,420</div>
          <div className="mt-1 text-xs text-gray-500">Logged today</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-400">PII Access Reads</div>
          <div className="mt-2 text-3xl font-extrabold text-amber-600">142</div>
          <div className="mt-1 text-xs text-gray-500">Identity view audit logged</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-400">Authorized PDF Exports</div>
          <div className="mt-2 text-3xl font-extrabold text-blue-600">18</div>
          <div className="mt-1 text-xs text-gray-500">SmartBrowz report downloads</div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-400">Tampering Alerts</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-600">0</div>
          <div className="mt-1 text-xs text-gray-500">Log integrity verified</div>
        </div>
      </div>

      {/* Controls & Action Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-xl bg-white p-3 sm:p-4 shadow-sm border border-gray-100">
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ksp-navy">Action:</span>
            <div className="flex flex-wrap rounded-lg bg-gray-100 p-1 text-xs font-bold">
              {['ALL', 'VIEW_CASE', 'PII_ACCESS', 'EXPORT', 'ROLE_CHANGE', 'IMPORT'].map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActionFilter(act)}
                  className={`rounded-md px-1.5 sm:px-2.5 py-1 transition-all text-[10px] sm:text-xs ${
                    actionFilter === act ? 'bg-ksp-navy text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {act === 'VIEW_CASE' ? 'VIEW' : act === 'PII_ACCESS' ? 'PII' : act === 'ROLE_CHANGE' ? 'ROLE' : act}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ksp-navy focus:outline-none focus:ring-2 focus:ring-ksp-blue"
          >
            <option value="Today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <input
            type="text"
            placeholder="Search..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-ksp-navy focus:outline-none focus:ring-2 focus:ring-ksp-blue flex-1 sm:min-w-[200px]"
          />
        </div>
      </div>

      {/* Audit Log Events Table */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-ksp-navy">Access & Action Audit Trail</h2>
            <p className="text-xs text-gray-400">Recorded with immutable request IDs and client IP addresses</p>
          </div>
          <span className="text-xs font-bold text-ksp-accent">{filteredLogs.length} Events Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100 bg-ksp-slate/50 text-ksp-navy font-bold">
                <th className="p-2 sm:p-3">Event ID & Timestamp</th>
                <th className="p-2 sm:p-3">User & Role</th>
                <th className="p-2 sm:p-3">Action Event</th>
                <th className="p-2 sm:p-3">Target Resource</th>
                <th className="p-2 sm:p-3">Client IP & Request ID</th>
                <th className="p-2 sm:p-3 text-center">PII Flag</th>
                <th className="p-2 sm:p-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-2 sm:p-3">
                    <div className="font-bold text-ksp-navy text-[11px] sm:text-xs">{log.id}</div>
                    <div className="text-[9px] sm:text-[10px] text-gray-400 whitespace-nowrap">{log.timestamp}</div>
                  </td>
                  <td className="p-2 sm:p-3">
                    <div className="font-bold text-ksp-navy text-[11px] sm:text-xs whitespace-nowrap">{log.userEmail}</div>
                    <div className="text-[9px] sm:text-[10px] font-semibold text-ksp-accent">[{log.role}]</div>
                  </td>
                  <td className="p-2 sm:p-3">
                    <span
                      className={`inline-block rounded px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${
                        log.action === 'PII_ACCESS'
                          ? 'bg-amber-100 text-amber-700'
                          : log.action === 'EXPORT'
                          ? 'bg-blue-100 text-blue-700'
                          : log.action === 'ROLE_CHANGE'
                          ? 'bg-rose-100 text-rose-700'
                          : log.action === 'IMPORT'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 font-medium text-gray-800 text-[11px] sm:text-xs max-w-[200px] truncate">{log.resource}</td>
                  <td className="p-2 sm:p-3">
                    <div className="font-mono text-gray-600 text-[11px] sm:text-xs">{log.clientIp}</div>
                    <div className="font-mono text-[9px] sm:text-[10px] text-gray-400">{log.requestId}</div>
                  </td>
                  <td className="p-2 sm:p-3 text-center">
                    {log.isPii ? (
                      <span className="rounded bg-rose-100 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-700 whitespace-nowrap">
                        PII READ
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] text-gray-400">Standard</span>
                    )}
                  </td>
                  <td className="p-2 sm:p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="rounded bg-ksp-slate px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] font-bold text-ksp-navy hover:bg-ksp-navy hover:text-white transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Export Audit Log */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6 shadow-xl mx-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ksp-navy">Export Immutable Audit Trail</h3>
                <p className="text-xs text-gray-400">Generate signed log extract for compliance audit</p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExportSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ksp-navy mb-1">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs font-bold text-ksp-navy"
                >
                  <option value="CSV">Comma Separated Values (.CSV)</option>
                  <option value="JSON">JavaScript Object Notation (.JSON)</option>
                </select>
              </div>

              <div className="rounded-lg bg-ksp-slate/40 p-3 text-gray-600 text-[11px]">
                🔒 Exported logs include SHA-256 cryptographic hashes for anti-tampering verification under ADR-012.
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-ksp-navy px-4 py-2 font-bold text-white hover:bg-ksp-blue shadow-md w-full sm:w-auto"
                >
                  Generate Signed Log Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Audit Event Metadata Detail Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6 shadow-2xl mx-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-ksp-accent">AUDIT METADATA INSPECTOR</span>
                <h3 className="text-base font-bold text-ksp-navy">{selectedLog.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <span className="text-gray-400 font-bold">User Email:</span>
                  <div className="font-bold text-ksp-navy">{selectedLog.userEmail}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <span className="text-gray-400 font-bold">Role Scope:</span>
                  <div className="font-bold text-ksp-accent">{selectedLog.role}</div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2.5">
                <span className="text-gray-400 font-bold">Target Resource:</span>
                <div className="font-bold text-gray-800">{selectedLog.resource}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <span className="text-gray-400 font-bold">Client IP:</span>
                  <div className="font-mono font-bold text-gray-700">{selectedLog.clientIp}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2.5">
                  <span className="text-gray-400 font-bold">Request ID:</span>
                  <div className="font-mono font-bold text-gray-700">{selectedLog.requestId}</div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-2.5">
                <span className="text-gray-400 font-bold">Client User Agent:</span>
                <div className="font-mono text-[11px] text-gray-600">{selectedLog.userAgent || 'KSP-Client/2.4'}</div>
              </div>

              <div className="rounded-lg bg-slate-900 p-3 text-white">
                <span className="text-slate-400 font-bold text-[10px]">Cryptographic SHA-256 Signature:</span>
                <div className="font-mono text-[10px] text-emerald-400 break-all mt-1">
                  {selectedLog.shaHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 w-full sm:w-auto"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
