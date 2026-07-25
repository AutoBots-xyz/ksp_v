'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SCRB_ANALYST' | 'DISTRICT_COMMAND' | 'SHO' | 'IO' | 'DATA_OPERATOR' | 'AUDITOR' | 'VIEWER';
  unit: string;
  active: boolean;
}

interface CronJobRecord {
  name: string;
  expression: string;
  description: string;
  lastRun: string;
  status: 'SCHEDULED' | 'RUNNING' | 'SUCCESS';
}

const INITIAL_USERS: UserRecord[] = [
  { id: 'USR-001', email: 'admin@ksp.local', name: 'KSP System Administrator', role: 'SUPER_ADMIN', unit: 'State HQ', active: true },
  { id: 'USR-002', email: 'scrb.analyst@ksp.local', name: 'Rajesh Sharma', role: 'SCRB_ANALYST', unit: 'SCRB Intelligence Cell', active: true },
  { id: 'USR-003', email: 'sp.bu@ksp.local', name: 'SP Bengaluru Urban', role: 'DISTRICT_COMMAND', unit: 'Bengaluru Urban District', active: true },
  { id: 'USR-004', email: 'sho.whitefield@ksp.local', name: 'Inspector Ramesh Kumar', role: 'SHO', unit: 'Whitefield PS', active: true },
  { id: 'USR-005', email: 'io.priya@ksp.local', name: 'PSI Priya Sharma', role: 'IO', unit: 'Whitefield PS', active: true },
];

const JOBS: CronJobRecord[] = [
  { name: 'nightly_aggregates', expression: '30 1 * * *', description: 'Rebuilds daily district & station KPI aggregates', lastRun: '2026-07-24 01:30 IST', status: 'SUCCESS' },
  { name: 'cache_warm', expression: '0 2 * * *', description: 'Pre-warms Catalyst Cache for high-frequency queries', lastRun: '2026-07-24 02:00 IST', status: 'SUCCESS' },
  { name: 'anomaly_scan', expression: '0 * * * *', description: 'Hourly QuickML spike ratio analysis across sectors', lastRun: '2026-07-24 20:00 IST', status: 'SUCCESS' },
  { name: 'weekly_model_retrain', expression: '0 3 * * 0', description: 'Re-trains risk score model weights with new FIR data', lastRun: '2026-07-20 03:00 IST', status: 'SUCCESS' },
];

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [jobList, setJobList] = useState<CronJobRecord[]>(JOBS);
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'ingest'>('users');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // New User Modal State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRecord['role']>('SHO');
  const [newUserUnit, setNewUserUnit] = useState('Whitefield PS');

  // Enforce >= 1 active SUPER_ADMIN
  const toggleUserStatus = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'SUPER_ADMIN' && targetUser.active) {
      const activeAdmins = users.filter((u) => u.role === 'SUPER_ADMIN' && u.active);
      if (activeAdmins.length <= 1) {
        setAlertMsg('🚫 Action Blocked: System invariant requires at least 1 active SUPER_ADMIN user.');
        return;
      }
    }

    setAlertMsg(null);
    setUsers(users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)));
  };

  const updateUserRole = (userId: string, newRole: UserRecord['role']) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'SUPER_ADMIN' && targetUser.active && newRole !== 'SUPER_ADMIN') {
      const activeAdmins = users.filter((u) => u.role === 'SUPER_ADMIN' && u.active);
      if (activeAdmins.length <= 1) {
        setAlertMsg('🚫 Action Blocked: Cannot change role of the sole active SUPER_ADMIN.');
        return;
      }
    }
    setAlertMsg(null);
    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;

    const isDuplicate = users.some((u) => u.email.toLowerCase() === newUserEmail.toLowerCase());
    if (isDuplicate) {
      setAlertMsg(`🚫 Email "${newUserEmail}" is already assigned to an existing user.`);
      return;
    }

    const createdUser: UserRecord = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      email: newUserEmail,
      name: newUserName,
      role: newUserRole,
      unit: newUserUnit,
      active: true,
    };

    setUsers([...users, createdUser]);
    setShowAddUserModal(false);
    setNewUserEmail('');
    setNewUserName('');
    setAlertMsg(null);

    setToastMsg(`✅ User "${createdUser.name}" (${createdUser.email}) provisioned successfully!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleTriggerJob = (jobName: string) => {
    setJobList((prev) =>
      prev.map((j) => (j.name === jobName ? { ...j, status: 'RUNNING' } : j))
    );
    setTimeout(() => {
      setJobList((prev) =>
        prev.map((j) =>
          j.name === jobName
            ? { ...j, status: 'SUCCESS', lastRun: `Just now (${new Date().toLocaleTimeString()})` }
            : j
        )
      );
      setToastMsg(`✅ Catalyst Cron Job "${jobName}" executed successfully!`);
      setTimeout(() => setToastMsg(null), 4000);
    }, 1200);
  };

  const handleTriggerImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setToastMsg('✅ FIR Batch Import Pipeline Circuit triggered successfully! 500 FIR records queued.');
      setTimeout(() => setToastMsg(null), 4000);
    }, 1500);
  };

  const filteredUsers = users.filter((u) => {
    if (
      searchUser &&
      !u.email.toLowerCase().includes(searchUser.toLowerCase()) &&
      !u.name.toLowerCase().includes(searchUser.toLowerCase()) &&
      !u.unit.toLowerCase().includes(searchUser.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <AppShell title="SUPER_ADMIN Console & Operations" scope="SUPER_ADMIN Only">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-sm flex items-center justify-between animate-bounce">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="text-emerald-700 font-extrabold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-rose-600 animate-pulse" />
          <div>
            <span className="text-sm font-bold text-ksp-navy">SUPER_ADMIN Console</span>
            <div className="text-xs text-gray-400">System configuration, user mappings, and cron jobs</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
            SUPER_ADMIN Privilege Active
          </span>
        </div>
      </div>

      {/* Alert Notification Banner */}
      {alertMsg && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 flex items-center justify-between shadow-sm">
          <span>{alertMsg}</span>
          <button type="button" onClick={() => setAlertMsg(null)} className="text-amber-700 hover:text-amber-900 font-extrabold">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6 flex rounded-xl bg-white p-1.5 border border-gray-100 shadow-sm text-xs font-bold w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`rounded-lg px-4 py-2 transition-all ${
            activeTab === 'users' ? 'bg-ksp-navy text-white shadow-sm' : 'text-gray-500 hover:text-ksp-navy'
          }`}
        >
          User-Role-Unit Mapping ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('jobs')}
          className={`rounded-lg px-4 py-2 transition-all ${
            activeTab === 'jobs' ? 'bg-ksp-navy text-white shadow-sm' : 'text-gray-500 hover:text-ksp-navy'
          }`}
        >
          Catalyst Cron Jobs ({jobList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ingest')}
          className={`rounded-lg px-4 py-2 transition-all ${
            activeTab === 'ingest' ? 'bg-ksp-navy text-white shadow-sm' : 'text-gray-500 hover:text-ksp-navy'
          }`}
        >
          FIR Batch Import Pipeline
        </button>
      </div>

      {/* Tab 1: User-Role-Unit Mapping Table */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-ksp-navy">User Access & Role Mapping</h2>
              <p className="text-xs text-gray-400">Enforces role personas & access restrictions across districts</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search User Email, Name, Unit..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-ksp-navy focus:outline-none focus:ring-2 focus:ring-ksp-blue min-w-[220px]"
              />

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="rounded-lg bg-ksp-navy hover:bg-ksp-blue transition-colors px-3 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
              >
                <span>👤</span> + Provision New User
              </button>

              <div className="rounded bg-rose-50 border border-rose-200 px-3 py-1 text-[11px] font-bold text-rose-700">
                Guard: ≥1 Active SUPER_ADMIN
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-ksp-slate/50 text-ksp-navy font-bold">
                  <th className="p-3">User ID & Email</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Unit / Scope</th>
                  <th className="p-3 text-center">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-ksp-navy">{u.email}</div>
                      <div className="text-[10px] text-gray-400">{u.id}</div>
                    </td>
                    <td className="p-3 font-medium text-gray-800">{u.name}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                        className="rounded-lg border border-gray-200 bg-white p-1.5 text-xs font-bold text-ksp-navy focus:ring-2 focus:ring-ksp-blue"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="SCRB_ANALYST">SCRB_ANALYST</option>
                        <option value="DISTRICT_COMMAND">DISTRICT_COMMAND</option>
                        <option value="SHO">SHO</option>
                        <option value="IO">IO</option>
                        <option value="DATA_OPERATOR">DATA_OPERATOR</option>
                        <option value="AUDITOR">AUDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="p-3 text-gray-600 font-medium">{u.unit}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(u.id)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all shadow-sm ${
                          u.active
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Catalyst Cron Jobs */}
      {activeTab === 'jobs' && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-ksp-navy">Catalyst Cron Jobs Scheduler</h2>
            <p className="text-xs text-gray-400">Configured automated background jobs in Catalyst Console</p>
          </div>

          <div className="space-y-4">
            {jobList.map((job) => (
              <div
                key={job.name}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-white hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-ksp-navy">{job.name}</span>
                    <span className="font-mono rounded bg-ksp-slate px-2 py-0.5 text-[10px] font-bold text-ksp-accent">
                      {job.expression}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        job.status === 'RUNNING'
                          ? 'bg-amber-100 text-amber-700 animate-pulse'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{job.description}</p>
                  <div className="mt-1 text-[10px] text-gray-400">Last executed: {job.lastRun}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerJob(job.name)}
                  disabled={job.status === 'RUNNING'}
                  className="rounded-lg bg-ksp-navy hover:bg-ksp-blue transition-colors px-4 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-2"
                >
                  {job.status === 'RUNNING' ? 'Running Job...' : '▶ Run Job Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: FIR Batch Import Pipeline */}
      {activeTab === 'ingest' && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-ksp-navy">FIR Batch Import Circuit Trigger</h2>
            <p className="text-xs text-gray-400">Bulk ingest pipeline for state police FIR dataset (CSV / JSON)</p>
          </div>

          <div className="max-w-xl space-y-4">
            <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="text-3xl">📁</span>
              <div className="mt-2 font-bold text-xs text-ksp-navy">Drag and drop FIR CSV extract file here</div>
              <div className="mt-1 text-[10px] text-gray-400">Supports .csv, .json format (Max 50MB per batch)</div>
            </div>

            <div className="rounded-lg bg-ksp-slate/40 p-3 text-xs text-gray-600">
              ⚡ Executing import triggers the <code>fir_import_pipeline.json</code> Catalyst Circuit to ingest, validate, and broadcast Signals events.
            </div>

            <button
              type="button"
              onClick={handleTriggerImport}
              disabled={importing}
              className="w-full rounded-lg bg-ksp-navy hover:bg-ksp-blue transition-colors py-3 text-xs font-bold text-white shadow-md flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Executing Catalyst Circuit Pipeline...
                </>
              ) : (
                '🚀 Trigger Batch Import Pipeline'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Provision / Invite New User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ksp-navy">Provision New System User</h3>
                <p className="text-xs text-gray-400">Map user identity to role & station unit scope</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ksp-navy mb-1">User Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. officer.name@ksp.local"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs font-bold text-ksp-navy focus:ring-2 focus:ring-ksp-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-ksp-navy mb-1">Full Officer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sub-Inspector Anand Patil"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs focus:ring-2 focus:ring-ksp-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ksp-navy mb-1">Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs font-bold text-ksp-navy"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="SCRB_ANALYST">SCRB_ANALYST</option>
                    <option value="DISTRICT_COMMAND">DISTRICT_COMMAND</option>
                    <option value="SHO">SHO</option>
                    <option value="IO">IO</option>
                    <option value="DATA_OPERATOR">DATA_OPERATOR</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ksp-navy mb-1">Unit / Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. Whitefield PS"
                    value={newUserUnit}
                    onChange={(e) => setNewUserUnit(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs font-bold text-ksp-navy"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-ksp-navy px-4 py-2 font-bold text-white hover:bg-ksp-blue shadow-md"
                >
                  Provision User Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
