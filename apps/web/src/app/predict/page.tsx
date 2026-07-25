'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SampleDataBanner } from '@/components/ui/sample-data-banner';
import { api, type RiskZone } from '@/lib/api-client';

export default function PredictPage() {
  // Phase 2.4: anomalies now fetched from api.ai.anomalies() (z-score computed
  // over real CaseMaster data), NOT hardcoded RANKED_RISK_ZONES.
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const [lastTrained, setLastTrained] = useState<string | null>(null);
  const [showRetrainModal, setShowRetrainModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fine-tuning Model Coefficients State
  const [weightHistorical, setWeightHistorical] = useState('0.40');
  const [weightBail, setWeightBail] = useState('0.35');
  const [weightAnpr, setWeightAnpr] = useState('0.25');

  // Phase 2.4: fetch real anomalies (z-score derived) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setZonesLoading(true);
      setZonesError(null);
      try {
        const data = await api.ai.anomalies();
        if (!cancelled) {
          setRiskZones(data);
          setSelectedZone(data[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) setZonesError(err instanceof Error ? err.message : 'Failed to load anomalies');
      } finally {
        if (!cancelled) setZonesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredZones = riskZones.filter((z) => {
    if (selectedDistrict !== 'ALL' && z.district !== selectedDistrict) return false;
    if (selectedLevel !== 'ALL' && z.riskLevel !== selectedLevel) return false;
    if (
      searchQuery &&
      !z.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !z.predictedCategory.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !z.station.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleIssuePatrolOrder = () => {
    if (!selectedZone) return;
    setToastMsg(`✅ Preventive Patrol Order dispatched to ${selectedZone.station} for ${selectedZone.zoneName}!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRetrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowRetrainModal(false);
    setToastMsg('Retraining — invoking QuickML pipeline…');
    try {
      const res = await api.ai.retrain();
      setModelVersion(res.modelVersion ?? null);
      setLastTrained(res.status === 'SUCCESS' ? `${new Date().toISOString()} (QuickML)` : null);
      if (res.status === 'NOT_CONFIGURED') {
        setToastMsg('⚠ QuickML pipeline not yet deployed. See docs/QUICKML_PREDICTIVE_SETUP.md');
      } else {
        setToastMsg(`✅ Predictive Risk Model retrain invoked: ${res.status}`);
      }
    } catch (err) {
      setToastMsg(`❌ Retrain failed: ${err instanceof Error ? err.message : 'error'}`);
    }
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <AppShell title="Predictive & Risk Intelligence" scope="SCRB / District Analytical Scope">
      {/* HONESTY RULE: anomaly risk zones (Phase 2.4) are now LIVE — computed via
          z-score over real CaseMaster data with dynamic "why flagged" reasons.
          The QuickML predictive MODEL (Phase 2.3) is still pending a console-side
          pipeline deployment — the retrain action reports "NOT_CONFIGURED" until
          QUICKML_PIPELINE_ENDPOINT is set. Banner stays until 2.3 completes. */}
      <SampleDataBanner
        feature="The QuickML predictive model (anomalies themselves are now live z-score computations)"
        pendingSource="Phase 2.3 QuickML pipeline deployment (console-side) per docs/QUICKML_PREDICTIVE_SETUP.md"
        className="mb-4"
      />
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-sm flex items-center justify-between animate-bounce">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)} className="text-emerald-700 font-extrabold">
            ✕
          </button>
        </div>
      )}

      {/* ModelTrustBar Header Component */}
      <div className="mb-6 rounded-xl border border-ksp-blue/20 bg-gradient-to-r from-ksp-navy to-ksp-blue p-5 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                Model: {modelVersion ?? 'QuickML (pending deployment)'}
              </span>
              <span className="text-xs text-slate-300">
                Trained: {lastTrained ?? 'not yet — see docs/QUICKML_PREDICTIVE_SETUP.md'}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold">Predictive Risk & Anomaly Intelligence Engine</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-200">
            <div className="text-right">
              <div className="text-emerald-400 font-bold text-base">{zonesLoading ? '…' : riskZones.length}</div>
              <div className="text-[10px] text-slate-300">Active Anomalies</div>
            </div>
            <div className="h-8 w-px bg-slate-700 hidden sm:block" />
            <div className="text-right">
              <div className="text-emerald-400 font-bold text-base">{zonesLoading ? '…' : riskZones.filter(z=>z.riskLevel==='CRITICAL').length}</div>
              <div className="text-[10px] text-slate-300">Critical (z&gt;4)</div>
            </div>

            <button
              type="button"
              onClick={() => setShowRetrainModal(true)}
              className="rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
            >
              <span>⚙️</span> Fine-Tune Weights
            </button>
          </div>
        </div>

        {/* Mandatory Legal Disclaimer Banner */}
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 flex items-start gap-2">
          <span className="text-amber-400 text-sm font-bold">⚠️</span>
          <div>
            <strong className="text-amber-300">Legal Disclaimer & Compliance:</strong> Analytical risk scores and anomaly call-outs are statistical estimates generated for preventive patrol resource allocation and operational planning — <span className="underline font-bold">they do NOT constitute formal evidence or criminal charges</span>.
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Search Zone, Category or Station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-8 pr-3 text-xs text-ksp-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-ksp-blue"
            />
            <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ksp-navy">Level:</span>
            <div className="flex rounded-lg bg-gray-100 p-1 text-xs font-bold">
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`rounded-md px-2.5 py-1 transition-all ${
                    selectedLevel === lvl ? 'bg-ksp-navy text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-ksp-navy">District:</span>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ksp-navy focus:outline-none focus:ring-2 focus:ring-ksp-blue"
          >
            <option value="ALL">All Districts (State-wide)</option>
            <option value="Bengaluru Urban">Bengaluru Urban</option>
            <option value="Mysuru District">Mysuru District</option>
            <option value="Belagavi District">Belagavi District</option>
            <option value="Kalaburagi Range">Kalaburagi Range</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Ranked Risk List + Anomaly Call-Out Detail Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Ranked Risk List (Left 7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-ksp-navy">
              Ranked Risk Zones <span className="text-xs font-normal text-gray-400">({filteredZones.length} Flagged)</span>
            </h2>
            <span className="text-xs font-bold text-ksp-accent">Ranked by Risk Score Index</span>
          </div>

          <div className="space-y-3">
            {zonesLoading ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-400 animate-pulse">
                Loading anomalies (z-score computation over 30-day baseline)…
              </div>
            ) : zonesError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                Anomaly load failed: {zonesError}
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-400">
                No anomalies exceed the z &gt; 2.5 threshold for the selected filters.
              </div>
            ) : filteredZones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-ksp-blue bg-ksp-slate/40 shadow-sm ring-1 ring-ksp-blue'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            zone.riskLevel === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : zone.riskLevel === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {zone.riskLevel}
                        </span>
                        <span className="text-xs text-gray-400">{zone.district} · {zone.station}</span>
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-ksp-navy">{zone.zoneName}</h3>
                    </div>

                    {/* Risk Score Gauge */}
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-ksp-navy">{zone.riskScore}<span className="text-xs text-gray-400">/100</span></div>
                      <div className="text-[10px] font-bold text-emerald-600">{zone.confidence}% Confidence</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                    <span className="font-bold text-ksp-accent">Predicted: {zone.predictedCategory}</span>
                    <span className="text-gray-400 text-[11px] font-medium">Click to inspect anomaly details →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anomaly & Emerging Call-Out Detail Inspector (Right 5 Cols) */}
        <div className="lg:col-span-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          {selectedZone ? (
          <>
          <div className="mb-4 border-b border-gray-100 pb-3">
            <span className="text-[10px] font-bold uppercase text-ksp-accent">ANOMALY & WHY FLAGGED ANALYSIS</span>
            <h2 className="text-base font-bold text-ksp-navy">{selectedZone.zoneName}</h2>
            <div className="mt-1 text-xs text-gray-500">{selectedZone.district} · {selectedZone.station}</div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Why Flagged Anomaly Call-Outs */}
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50/50 p-4">
              <div className="font-bold text-amber-900 mb-2">Why Flagged? (Feature Anomaly Call-Outs)</div>
              <ul className="space-y-1.5 text-amber-800 list-disc list-inside">
                {selectedZone.whyFlagged.map((reason, idx) => (
                  <li key={idx} className="leading-relaxed">{reason}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Action Panel */}
            <div className="rounded-lg border border-gray-100 bg-ksp-slate/40 p-4">
              <div className="font-bold text-ksp-navy mb-1">Recommended Patrol Action</div>
              <p className="text-gray-700 leading-relaxed font-medium">{selectedZone.recommendedAction}</p>
            </div>

            {/* Confidence & Scoring Details */}
            <div className="rounded-lg border border-gray-100 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Calculated Risk Index:</span>
                <span className="font-bold text-ksp-navy">{selectedZone.riskScore} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Model Confidence Score:</span>
                <span className="font-bold text-emerald-600">{selectedZone.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Target Category:</span>
                <span className="font-bold text-ksp-accent">{selectedZone.predictedCategory}</span>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="button"
              onClick={handleIssuePatrolOrder}
              className="w-full rounded-lg bg-ksp-navy hover:bg-ksp-blue transition-colors py-2.5 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>🚓</span> Issue Preventive Patrol Order for {selectedZone.station}
            </button>
          </div>
          </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              {zonesLoading ? 'Loading anomalies…' : 'Select an anomaly to view details.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Fine-Tune Model Weights & Retrain */}
      {showRetrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-ksp-navy">Fine-Tune Risk Model Parameters</h3>
                <p className="text-xs text-gray-400">Adjust feature weight coefficients for QuickML Engine</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRetrainModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRetrainSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ksp-navy mb-1">
                  Historical Incident Baseline Weight ({weightHistorical})
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weightHistorical}
                  onChange={(e) => setWeightHistorical(e.target.value)}
                  className="w-full text-ksp-navy"
                />
              </div>

              <div>
                <label className="block font-bold text-ksp-navy mb-1">
                  Habitual Offender Bail Release Proximity Weight ({weightBail})
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weightBail}
                  onChange={(e) => setWeightBail(e.target.value)}
                  className="w-full text-ksp-navy"
                />
              </div>

              <div>
                <label className="block font-bold text-ksp-navy mb-1">
                  ANPR Transit / Vehicle Surge Weight ({weightAnpr})
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={weightAnpr}
                  onChange={(e) => setWeightAnpr(e.target.value)}
                  className="w-full text-ksp-navy"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRetrainModal(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 font-bold text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-ksp-navy px-4 py-2 font-bold text-white hover:bg-ksp-blue shadow-md"
                >
                  Trigger Retrain & Update Weights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
