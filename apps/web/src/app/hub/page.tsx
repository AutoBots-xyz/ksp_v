'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { RiskBadge } from '@/components/ui/risk-badge';
import { SampleDataBanner } from '@/components/ui/sample-data-banner';
import { api, type AlertItem, type TrendPoint } from '@/lib/api-client';
import { FileText, Megaphone, RotateCcw, AlertTriangle, Activity, Briefcase, Hash, ShieldAlert } from 'lucide-react';

interface DistrictStat {
  name: string;
  total: number;
  heinous: number;
  risk: 'HIGH' | 'MODERATE' | 'LOW';
  trend: string;
  stationCount: number;
}

const DISTRICT_DATA: DistrictStat[] = [
  { name: 'Bengaluru City', total: 14250, heinous: 380, risk: 'HIGH', trend: '+5.4%', stationCount: 108 },
  { name: 'Mysuru Range', total: 6420, heinous: 180, risk: 'MODERATE', trend: '-1.2%', stationCount: 42 },
  { name: 'Hubballi-Dharwad', total: 5180, heinous: 145, risk: 'MODERATE', trend: '+0.8%', stationCount: 36 },
  { name: 'Mangaluru Coastal', total: 4390, heinous: 110, risk: 'LOW', trend: '-3.1%', stationCount: 28 },
  { name: 'Belagavi Border', total: 6810, heinous: 235, risk: 'HIGH', trend: '+7.2%', stationCount: 48 },
  { name: 'Kalaburagi Range', total: 5800, heinous: 190, risk: 'MODERATE', trend: '+2.0%', stationCount: 39 },
];

export default function HubPage() {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | 'ytd'>('30d');
  const [activeCategory, setActiveCategory] = useState<'ipc' | 'sll' | 'cyber'>('ipc');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Phase 1.3: real emerging alerts from api.analytics.alerts() (rolling baseline).
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Phase 2.5: real trend series from api.analytics.trends() (ZCQL aggregation).
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastDesc, setBroadcastDesc] = useState('');
  const [broadcastDistrict, setBroadcastDistrict] = useState('Bengaluru City');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Phase 1.3: fetch real alerts (rolling-baseline spikes) on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAlertsLoading(true);
      setAlertsError(null);
      try {
        const data = await api.analytics.alerts();
        if (!cancelled) setAlerts(data);
      } catch (err) {
        if (!cancelled) setAlertsError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Phase 2.5: fetch real trend series whenever range changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTrendLoading(true);
      try {
        const data = await api.analytics.trends({ range: selectedRange });
        if (!cancelled) setTrendData(data);
      } catch {
        if (!cancelled) setTrendData([]);
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedRange]);

  const currentTrendPoints = trendData;

  const filteredDistricts = DISTRICT_DATA.filter((d) => {
    if (selectedDistrict !== 'ALL' && d.name !== selectedDistrict) return false;
    return true;
  });

  const filteredAlerts = alerts.filter((a) => {
    if (alertSeverityFilter !== 'ALL' && a.severity !== alertSeverityFilter) return false;
    return true;
  });

  const targetDist = DISTRICT_DATA.find((d) => d.name === selectedDistrict);
  const totalFirs = targetDist ? targetDist.total : 42850;
  const heinousCount = targetDist ? targetDist.heinous : 1240;

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastDesc) return;

    const newAlert: AlertItem = {
      id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
      title: broadcastTitle,
      location: broadcastDistrict,
      description: broadcastDesc,
      severity: broadcastSeverity,
      timestamp: 'Just now',
      currentCount: 0,
      baselineCount: 0,
      spikeRatio: 0,
    };

    setAlerts([newAlert, ...alerts]);
    setShowBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastDesc('');
  };

  return (
    <AppShell title="SCRB Intelligence Hub" scope="State-wide">
      {/* HONESTY RULE: emerging alerts (Phase 1.3) and the crime-trend chart
          (Phase 2.5) are now LIVE — fetched from api.analytics.* backed by real
          ZCQL aggregation over CaseMaster. The KPI cards and district density
          matrix below still render from the hardcoded DISTRICT_DATA array —
          banner stays until those are wired to real aggregate counts. */}
      <SampleDataBanner
        feature="KPI cards and the district density matrix"
        pendingSource="aggregate-counts endpoint wiring"
        className="mb-4"
      />

      {/* Top Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm">
        
        {/* Left Side Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground font-mono">TIMEFRAME:</span>
            <div className="flex rounded-none bg-secondary/50 p-1 border border-border/50">
              {(['7d', '30d', 'ytd'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={`rounded-none px-2 sm:px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-widest transition-all ${
                    selectedRange === range ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-6 w-px bg-border hidden sm:block"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground font-mono">DISTRICT:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="rounded-none border-b-2 border-border bg-transparent px-2 sm:px-3 py-1 text-sm font-bold text-foreground focus:outline-none focus:border-primary font-mono uppercase"
            >
              <option value="ALL">All Districts (State)</option>
              {DISTRICT_DATA.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" onClick={() => setSelectedDistrict('ALL')} className="text-xs">
            <RotateCcw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Reset
          </Button>
          <Button size="sm" onClick={() => setShowBroadcastModal(true)} className="text-xs">
            <Megaphone className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Broadcast
          </Button>
        </div>
      </div>

      {/* 4-Card KPI Grid */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <div onClick={() => router.push('/cases')} className="cursor-pointer">
          <MetricCard
            title="Total Registered FIRs"
            value={totalFirs.toLocaleString()}
            icon={FileText}
            trend="+4.2%"
            trendUp={true}
            description={selectedDistrict === 'ALL' ? 'Across 31 Commissions' : selectedDistrict}
          />
        </div>

        <div onClick={() => router.push('/cases')} className="cursor-pointer">
          <MetricCard
            title="Heinous Offences"
            value={heinousCount.toLocaleString()}
            icon={AlertTriangle}
            trend="-2.1%"
            trendUp={false}
            description="Murder, Robbery, Dacoity"
          />
        </div>

        <div onClick={() => router.push('/station')} className="cursor-pointer">
          <MetricCard
            title="Open Investigations"
            value="8,420"
            icon={Briefcase}
            description="Under IO monitoring"
          />
        </div>

        <div onClick={() => router.push('/district')} className="cursor-pointer">
          <MetricCard
            title="Chargesheet Disposal"
            value="78.4%"
            icon={Activity}
            trend="+1.8%"
            trendUp={true}
            description="Within statutory 60/90 days"
          />
        </div>
      </div>

      {/* Main Charts & Alerts Area */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Crime Trend Trajectory Analysis */}
        <Card className="lg:col-span-2 flex flex-col rounded-none shadow-none border-border">
          <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-border/50 bg-secondary/20">
            <div className="space-y-1">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">Crime Trend Trajectory Analysis</CardTitle>
              <CardDescription className="text-sm font-bold text-foreground">Monthly frequency trajectory across categories ({selectedRange})</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md bg-secondary p-1">
                {(['ipc', 'sll', 'cyber'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded px-3 py-1 text-xs font-bold uppercase transition-all ${
                      activeCategory === cat ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/reports')} title="Export Intelligence PDF Pack">
                <FileText className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-4 pb-6 min-h-[300px]">
            {trendLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">
                Loading trend series (ZCQL aggregation)…
              </div>
            ) : currentTrendPoints.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No trend data for the selected range.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentTrendPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey={activeCategory}
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Emerging Trends & Alerts */}
        <Card className="flex flex-col rounded-none shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50 bg-secondary/20">
            <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">Emerging Alerts</CardTitle>
            <RiskBadge level="CRITICAL" />
          </CardHeader>
          <div className="border-b bg-muted/30 px-4 py-2">
            <div className="flex gap-1">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
                <button
                  key={level}
                  onClick={() => setAlertSeverityFilter(level as any)}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
                    alertSeverityFilter === level
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {alertsLoading ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground animate-pulse">
                Loading emerging alerts (rolling-baseline computation)…
              </div>
            ) : alertsError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
                Alert load failed: {alertsError}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No alerts match the selected filter.
              </div>
            ) : (
              filteredAlerts.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    item.severity === 'HIGH'
                      ? 'border-destructive/50 bg-destructive/5'
                      : item.severity === 'MEDIUM'
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-blue-500/50 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-bold text-foreground">
                    <span>{item.title}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{item.timestamp}</span>
                  </div>
                  <div className="text-[10px] font-bold text-primary mt-0.5">{item.location}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* District Crime Matrix */}
      <Card className="rounded-none shadow-none border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/20">
          <div className="space-y-1">
            <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">District Crime Density Matrix</CardTitle>
            <CardDescription className="text-sm font-bold text-foreground">State-wide spatial intelligence breakdown ({filteredDistricts.length} Districts Shown)</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDistrict('ALL')}>
            Reset Selection
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-3">
            {filteredDistricts.map((dist) => (
              <div
                key={dist.name}
                className={`p-5 transition-colors cursor-pointer hover:bg-secondary/50 ${
                  selectedDistrict === dist.name ? 'bg-primary/5 ring-1 ring-inset ring-primary' : ''
                }`}
                onClick={() => setSelectedDistrict(dist.name)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{dist.name}</span>
                  <RiskBadge level={dist.risk} />
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Total FIRs</span>
                    <div className="text-lg font-extrabold text-foreground">{dist.total.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Heinous</span>
                    <div className="text-sm font-bold text-destructive">{dist.heinous}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Trend</span>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-500">{dist.trend}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowBroadcastModal(false)}
            />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative w-full max-w-lg rounded-2xl border bg-card p-4 sm:p-6 shadow-2xl mx-auto"
              >
                <div className="mb-4 flex flex-col space-y-1.5 border-b pb-4">
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Broadcast SCRB Intelligence Advisory</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Distribute state advisory to District Command & SHO units.</p>
                </div>

                <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-foreground">Target District</label>
                    <select
                      value={broadcastDistrict}
                      onChange={(e) => setBroadcastDistrict(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {DISTRICT_DATA.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-foreground">Severity Level</label>
                    <select
                      value={broadcastSeverity}
                      onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="HIGH">HIGH (Urgent Action)</option>
                      <option value="MEDIUM">MEDIUM (Watch Priority)</option>
                      <option value="LOW">LOW (Informational)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-foreground">Advisory Title</label>
                  <Input
                    type="text"
                    placeholder="E.g., Surge in Night Burglaries"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-foreground">Intelligence Details</label>
                  <textarea
                    placeholder="Provide specific details and required actions..."
                    value={broadcastDesc}
                    onChange={(e) => setBroadcastDesc(e.target.value)}
                    required
                    className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowBroadcastModal(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    <Megaphone className="mr-2 h-4 w-4" /> Send Broadcast
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
