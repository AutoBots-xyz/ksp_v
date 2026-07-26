'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/ui/risk-badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
import { Search, MapPin, EyeOff, Eye, Plus, ShieldAlert, Users, Scale, ServerCog, Globe, History, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CaseRecord {
  crimeNo: string;
  title: string;
  majorHead: string;
  sections: string;
  station: string;
  district: string;
  ioName: string;
  filingDate: string;
  statutoryDueDate: string;
  gravity: 'HEINOUS' | 'MAJOR' | 'REGULAR';
  status: 'INVESTIGATION' | 'CHARGESHEET_FILED' | 'COURT_TRIAL' | 'BAIL_PENDING';
  complainant: { name: string; phone: string; address: string };
  accused: Array<{ name: string; status: string; arrests: number }>;
  victims: Array<{ name: string; age: number; gender: string }>;
  forensicStatus: string;
  spatialLocation: string;
  auditCount: number;
}

const INITIAL_CASES: CaseRecord[] = [
  {
    crimeNo: '2026-WF-0014',
    title: 'Phishing & Mule Account Syndicate Scam',
    majorHead: 'Cyber Fraud',
    sections: 'IPC 420, 120B / IT Act 66D',
    station: 'Whitefield PS',
    district: 'Bengaluru Urban',
    ioName: 'PSI Priya Sharma',
    filingDate: '2026-07-12',
    statutoryDueDate: '2026-09-10 (60 days)',
    gravity: 'HEINOUS',
    status: 'INVESTIGATION',
    complainant: { name: 'Kiran Vardhan', phone: '+91 98450 12345', address: 'Plot 42, ITPL Road, Whitefield' },
    accused: [
      { name: 'Sameer Sheikh @ Rahul', status: 'In Remand', arrests: 4 },
      { name: 'Vikram Singh', status: 'Absconding', arrests: 2 },
    ],
    victims: [{ name: 'Ananya Rao', age: 34, gender: 'Female' }],
    forensicStatus: 'Cyber Cell Log Extracted · Bank Accounts Frozen (₹14.2 Lakhs)',
    spatialLocation: '12.9698° N, 77.7499° E (Beat #3)',
    auditCount: 14,
  },
  {
    crimeNo: '2026-WF-0015',
    title: 'Night Break-in at Residential Complex',
    majorHead: 'House Breaking & Theft',
    sections: 'IPC 380, 457',
    station: 'Whitefield PS',
    district: 'Bengaluru Urban',
    ioName: 'PI Ramesh Kumar',
    filingDate: '2026-07-18',
    statutoryDueDate: '2026-09-16 (60 days)',
    gravity: 'MAJOR',
    status: 'INVESTIGATION',
    complainant: { name: 'Suresh Menon', phone: '+91 97411 88990', address: 'Villa 14, Palm Meadows, Whitefield' },
    accused: [{ name: 'Unidentified Gang (3 Persons)', status: 'Under Identification', arrests: 0 }],
    victims: [{ name: 'Suresh Menon', age: 52, gender: 'Male' }],
    forensicStatus: 'Fingerprint Samples Sent to FSL Bengaluru',
    spatialLocation: '12.9554° N, 77.7321° E (Beat #1)',
    auditCount: 8,
  },
  {
    crimeNo: '2026-EC-0089',
    title: 'Commercial Complex Armed Robbery',
    majorHead: 'Robbery / Dacoity',
    sections: 'IPC 392, 397',
    station: 'Electronic City PS',
    district: 'Bengaluru Urban',
    ioName: 'PSI Venkatesh B',
    filingDate: '2026-06-04',
    statutoryDueDate: '2026-08-03 (60 days)',
    gravity: 'HEINOUS',
    status: 'CHARGESHEET_FILED',
    complainant: { name: 'Ranganath K', phone: '+91 94480 33445', address: 'Phase 1, Electronic City' },
    accused: [{ name: 'Kishore Kumar @ Bullet', status: 'Judicial Custody', arrests: 7 }],
    victims: [{ name: 'Security Guard Mohan', age: 46, gender: 'Male' }],
    forensicStatus: 'CCTV Video Hash Matched · Recovery of Stolen Cash ₹4.5L',
    spatialLocation: '12.8399° N, 77.6770° E (Beat #2)',
    auditCount: 29,
  },
];

export default function CasesPage() {
  // Phase 1 (data wiring): cases now fetched from api.cases.list() instead of
  // the hardcoded INITIAL_CASES array. The seed CaseMaster has fewer fields than
  // the old CaseRecord (no complainant/victims/forensic), so those render as
  // "—" until real case-detail data is available. The crime/district/MO/status
  // fields are all real.
  const [cases, setCases] = useState<CaseRecord[]>(INITIAL_CASES);
  const [casesLoading, setCasesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gravityFilter, setGravityFilter] = useState<string>('ALL');
  const [hidePii, setHidePii] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRecord>(INITIAL_CASES[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCasesLoading(true);
      try {
        const data = await api.cases.list();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const mapped: CaseRecord[] = data.map((c: any) => {
            const gravMap: Record<number, 'HEINOUS' | 'MAJOR' | 'REGULAR'> = { 1: 'HEINOUS', 2: 'MAJOR', 3: 'REGULAR' };
            const catMap: Record<number, string> = { 1: 'Cyber Fraud', 2: 'House Breaking & Theft', 3: 'Robbery / Dacoity', 4: 'Vehicle Theft', 5: 'Grievous Assault', 6: 'Chain Snatching', 7: 'Cheating', 8: 'Murder', 9: 'Cattle Theft' };
            const distMap: Record<number, string> = { 443: 'Bengaluru Urban', 444: 'Bengaluru Rural', 445: 'Mysuru', 446: 'Belagavi', 447: 'Kalaburagi', 448: 'Mangaluru', 449: 'Hubballi-Dharwad', 450: 'Davanagere' };
            return {
              crimeNo: c.CrimeNo ?? c.crimeNo ?? '',
              title: c.BriefFacts ?? catMap[c.CrimeMajorHeadID] ?? '',
              majorHead: catMap[c.CrimeMajorHeadID] ?? '',
              sections: c.ModusOperandi ?? '',
              station: `Unit ${c.PoliceStationID ?? '?'}`,
              district: distMap[c.DistrictID] ?? `District ${c.DistrictID}`,
              ioName: '—',
              filingDate: (c.CrimeRegisteredDate ?? '').slice(0, 10),
              statutoryDueDate: '—',
              gravity: gravMap[c.GravityID] ?? 'REGULAR',
              status: c.CaseStatus ?? 'INVESTIGATION',
              complainant: { name: '—', phone: '—', address: '—' },
              accused: [],
              victims: [],
              forensicStatus: '—',
              spatialLocation: c.Latitude && c.Longitude ? `${c.Latitude}°, ${c.Longitude}°` : '—',
              auditCount: 0,
            };
          });
          if (!cancelled) {
            setCases(mapped);
            setSelectedCase(mapped[0]);
          }
        }
      } catch {
        // Fall back to INITIAL_CASES if fetch fails (dev without API).
      } finally {
        if (!cancelled) setCasesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  
  // New Case Form State
  const [newCrimeNo, setNewCrimeNo] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newMajorHead, setNewMajorHead] = useState('Cyber Fraud');
  const [newSections, setNewSections] = useState('IPC 420, IT Act 66D');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.crimeNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.majorHead.toLowerCase().includes(searchQuery.toLowerCase());
    if (gravityFilter === 'HEINOUS') return matchesSearch && c.gravity === 'HEINOUS';
    if (gravityFilter === 'PENDING') return matchesSearch && c.status === 'INVESTIGATION';
    return matchesSearch;
  });

  const maskString = (val: string) => (hidePii ? '•••••••• [REDACTED PII]' : val);

  const handleRegisterNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: CaseRecord = {
      crimeNo: newCrimeNo,
      title: newTitle,
      majorHead: newMajorHead,
      sections: newSections,
      station: 'Whitefield PS',
      district: 'Bengaluru Urban',
      ioName: 'PSI Assigned Pending',
      filingDate: new Date().toISOString().split('T')[0],
      statutoryDueDate: '60 days from now',
      gravity: 'MAJOR',
      status: 'INVESTIGATION',
      complainant: { name: 'Protected Witness', phone: 'N/A', address: 'N/A' },
      accused: [],
      victims: [],
      forensicStatus: 'Awaiting Initial Evidence Registration',
      spatialLocation: 'Unmapped',
      auditCount: 1,
    };
    setCases([newCase, ...cases]);
    setSelectedCase(newCase);
    setShowNewCaseModal(false);
  };

  return (
    <AppShell title="Case 360° View" scope="State-wide">
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-140px)] gap-4 lg:gap-6 overflow-visible lg:overflow-hidden">
        
        {/* Left Side: Case Directory List */}
        <Card className="w-full lg:w-1/3 flex flex-col overflow-hidden border-border bg-card shadow-none rounded-none max-h-96 lg:max-h-none">
          <div className="flex-none p-3 sm:p-4 border-b border-border space-y-3 sm:space-y-4 bg-secondary/20">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">Active Case Directory</h2>
              <Button size="icon" variant="ghost" onClick={() => setShowNewCaseModal(true)} title="Register New FIR">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Crime No, Title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={gravityFilter}
                onChange={(e) => setGravityFilter(e.target.value)}
                className="flex-1 rounded-none border border-input bg-background px-2 py-1 text-[10px] font-mono uppercase font-bold text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="ALL">All Gravities</option>
                <option value="HEINOUS">Heinous Cases Only</option>
                <option value="PENDING">Investigation Pending</option>
              </select>
              <Button
                variant={hidePii ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setHidePii(!hidePii)}
                className="h-7 text-xs flex-1 sm:flex-initial"
              >
                {hidePii ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {hidePii ? 'PII Hidden' : 'Mask PII'}
              </Button>
            </div>
          </div>
          
          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredCases.map((c) => (
              <div
                key={c.crimeNo}
                onClick={() => setSelectedCase(c)}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  selectedCase.crimeNo === c.crimeNo
                    ? 'border-primary bg-primary/5 ring-1 ring-inset ring-primary'
                    : 'border-border bg-card hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-primary">{c.crimeNo}</span>
                  <RiskBadge level={c.gravity} className="scale-75 origin-right" />
                </div>
                <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-1">{c.title}</h3>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{c.station}</span>
                  <span>{c.filingDate}</span>
                </div>
              </div>
            ))}
            {filteredCases.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No cases match the selected filters.
              </div>
            )}
          </div>
        </Card>

        {/* Right Side: Detailed 360° Case View */}
        <Card className="w-full lg:w-2/3 flex flex-col overflow-hidden border-border bg-card shadow-none rounded-none">
          
          {/* Header Banner */}
          <div className="flex-none border-b border-border p-4 sm:p-6 bg-background relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 w-48 sm:w-64 h-48 sm:h-64 -mt-10 -mr-10">
              <ShieldAlert className="w-full h-full text-foreground" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <span className="bg-primary px-2 py-1 font-mono text-xs sm:text-sm font-bold text-primary-foreground shadow-sm">
                  {selectedCase.crimeNo}
                </span>
                <RiskBadge level={selectedCase.status} />
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">{selectedCase.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {selectedCase.station}, {selectedCase.district}</div>
                <div className="flex items-center gap-1"><Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> IO: {selectedCase.ioName}</div>
                <div className="flex items-center gap-1 text-destructive"><ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Due: {selectedCase.statutoryDueDate}</div>
              </div>
            </div>
          </div>

          {/* Radix Tabs for Case Details */}
          <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 sm:px-6 py-0 h-12 overflow-x-auto hide-scrollbar">
              <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full bg-transparent px-3 sm:px-4 shrink-0">
                <FileText className="h-3.5 w-3.5 mr-1 sm:mr-2" /> Summary
              </TabsTrigger>
              <TabsTrigger value="people" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full bg-transparent px-3 sm:px-4 shrink-0">
                <Users className="h-3.5 w-3.5 mr-1 sm:mr-2" /> People
              </TabsTrigger>
              <TabsTrigger value="legal" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full bg-transparent px-3 sm:px-4 shrink-0">
                <Scale className="h-3.5 w-3.5 mr-1 sm:mr-2" /> Sections
              </TabsTrigger>
              <TabsTrigger value="process" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full bg-transparent px-3 sm:px-4 shrink-0">
                <ServerCog className="h-3.5 w-3.5 mr-1 sm:mr-2" /> Evidence
              </TabsTrigger>
              <TabsTrigger value="location" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full bg-transparent px-3 sm:px-4 shrink-0">
                <Globe className="h-3.5 w-3.5 mr-1 sm:mr-2" /> GIS
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none h-full bg-transparent px-3 sm:px-4 shrink-0">
                <History className="h-3.5 w-3.5 mr-1 sm:mr-2" /> Audit
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6 bg-background">
              <TabsContent value="summary" className="m-0 space-y-6 outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1 border-b pb-1">Primary Classification</h4>
                      <div className="text-sm font-semibold text-foreground">{selectedCase.majorHead}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{selectedCase.sections}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1 border-b pb-1">Complainant Details</h4>
                      <div className="text-sm font-semibold text-foreground">{maskString(selectedCase.complainant.name)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">{maskString(selectedCase.complainant.phone)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{maskString(selectedCase.complainant.address)}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1 border-b pb-1">Investigation Timeline</h4>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-muted-foreground">FIR Registered</span>
                        <span className="font-semibold text-foreground">{selectedCase.filingDate}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-destructive">
                        <span>Statutory Due Date</span>
                        <span className="font-bold">{selectedCase.statutoryDueDate}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-1 border-b pb-1">Forensic / Digital Footprint</h4>
                      <div className="text-sm text-foreground">{selectedCase.forensicStatus}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="people" className="m-0 space-y-6 outline-none">
                <div>
                  <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h4 className="text-sm font-bold text-foreground">Accused Persons</h4>
                  </div>
                  {selectedCase.accused.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">No accused registered yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCase.accused.map((a, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm">
                          <div>
                            <div className="font-bold text-sm text-foreground">{maskString(a.name)}</div>
                            <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                              <span className="flex items-center gap-1 text-destructive"><History className="h-3 w-3" /> {a.arrests} Prior Arrests</span>
                            </div>
                          </div>
                          <Badge variant={a.status === 'In Remand' || a.status === 'Judicial Custody' ? 'default' : 'destructive'}>
                            {a.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="legal" className="m-0 outline-none">
                <div className="rounded-lg border p-6 bg-card shadow-sm text-center">
                  <Scale className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
                  <div className="text-sm font-bold text-foreground">Legal Sandbox Validation Active</div>
                  <div className="text-xs text-muted-foreground mt-1">Sections matched against automated catalyst validations.</div>
                  <div className="mt-4 font-mono text-sm font-bold text-primary bg-primary/5 inline-block px-4 py-2 rounded-md border border-primary/20">
                    {selectedCase.sections}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="process" className="m-0 outline-none text-center py-10">
                <ServerCog className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-sm font-bold text-foreground">Digital Evidence Locker</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">Evidence hashed and stored in Catalyst Vault. View requires Level 3 clearance.</p>
              </TabsContent>
              
              <TabsContent value="location" className="m-0 outline-none text-center py-10">
                <Globe className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-sm font-bold text-foreground">GIS Mapping Coordinates</h3>
                <p className="text-xs font-mono bg-secondary px-3 py-1 rounded inline-block mt-2">{selectedCase.spatialLocation}</p>
              </TabsContent>
              
              <TabsContent value="audit" className="m-0 outline-none text-center py-10">
                <History className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-sm font-bold text-foreground">Immutable Audit Trail</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">This record has {selectedCase.auditCount} signed modifications stored in the blockchain ledger.</p>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      <AnimatePresence>
        {showNewCaseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowNewCaseModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg rounded-2xl border bg-card p-4 sm:p-6 shadow-2xl mx-auto"
            >
              <div className="mb-4 border-b pb-4">
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" /> Register New Case (FIR)
                </h3>
              </div>
              <form onSubmit={handleRegisterNewCase} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Crime Number</label>
                  <Input type="text" value={newCrimeNo} onChange={(e) => setNewCrimeNo(e.target.value)} placeholder="e.g. 2026-WF-0099" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Case Title</label>
                  <Input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Major Head</label>
                    <Input type="text" value={newMajorHead} onChange={(e) => setNewMajorHead(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sections</label>
                    <Input type="text" value={newSections} onChange={(e) => setNewSections(e.target.value)} required />
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                  <Button variant="outline" type="button" onClick={() => setShowNewCaseModal(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" className="w-full sm:w-auto">Register FIR</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
