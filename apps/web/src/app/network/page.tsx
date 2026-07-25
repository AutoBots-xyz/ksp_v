'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/ui/risk-badge';
import { SampleDataBanner } from '@/components/ui/sample-data-banner';
import { api, type OffenderProfile, type OrganizedCrimeGroup } from '@/lib/api-client';
import { Search, Plus, Eye, EyeOff, Navigation, Maximize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CytoscapeComponent = dynamic(
  () => import('react-cytoscapejs').then((mod) => ({ default: mod.default || mod })),
  { ssr: false }
);

interface GraphNode {
  id: string;
  label: string;
  type: 'PERSON' | 'CASE' | 'PHONE' | 'BANK' | 'VEHICLE';
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  details: {
    category: string;
    subtext: string;
    casesCount: number;
    connectionsCount: number;
  };
}

interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

const getNodeColor = (type: GraphNode['type']) => {
  switch (type) {
    case 'PERSON': return '#ef4444';
    case 'CASE': return '#3b82f6';
    case 'PHONE': return '#f59e0b';
    case 'BANK': return '#8b5cf6';
    case 'VEHICLE': return '#10b981';
    default: return '#64748b';
  }
};

export default function NetworkPage() {
  const router = useRouter();
  const cyRef = useRef<any>(null);
  // Phase 1.4: nodes/edges now come from api.network.graph() (real query), not
  // hardcoded INITIAL_NODES/INITIAL_EDGES. On mount we fetch the full graph;
  // the search box triggers a focused BFS subgraph (seed + hops).
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [searchSeed, setSearchSeed] = useState('');
  const [hops, setHops] = useState<number>(2);
  const [layoutMode, setLayoutMode] = useState<'cose' | 'concentric' | 'breadthfirst'>('cose');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [hidePii, setHidePii] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<GraphNode['type']>('PHONE');
  const [newNodeRisk, setNewNodeRisk] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newRelation, setNewRelation] = useState('ASSOCIATED_WITH');

  // Fetch graph from the real endpoint. seed/hops control BFS focus.
  const fetchGraph = useCallback(async (seed?: string, h?: number) => {
    setGraphLoading(true);
    setGraphError(null);
    try {
      const data = await api.network.graph({ seed: seed || undefined, hops: h ?? hops });
      // Map API Cytoscape elements back to GraphNode/GraphEdge for the inspector.
      const apiNodes = (data.nodes || []).map((n) => ({
        id: n.data.id,
        label: n.data.label,
        type: (n.data.type as GraphNode['type']) ?? 'PERSON',
        risk: (n.data.risk as GraphNode['risk']) ?? 'HIGH',
        details: {
          category: n.data.type ?? 'Entity',
          subtext: 'Linked via co-accused relationship',
          casesCount: 0,
          connectionsCount: (data.edges || []).filter(
            (e) => e.data.source === n.data.id || e.data.target === n.data.id,
          ).length,
        },
      }));
      const apiEdges = (data.edges || []).map((e) => ({
        from: e.data.source,
        to: e.data.target,
        relation: e.data.label,
      }));
      setNodes(apiNodes);
      setEdges(apiEdges);
    } catch (err) {
      setGraphError(err instanceof Error ? err.message : 'Failed to load network graph');
      setNodes([]);
      setEdges([]);
    } finally {
      setGraphLoading(false);
    }
  }, [hops]);

  // Load full graph on mount.
  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Entity search: fetch a focused BFS subgraph from the searched seed.
  const [searchInput, setSearchInput] = useState('');
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      fetchGraph();
      return;
    }
    setSearchSeed(searchInput.trim());
    fetchGraph(searchInput.trim(), hops);
  };

  const maskLabel = (label: string, type: GraphNode['type']) => {
    if (!hidePii) return label;
    if (['PERSON', 'PHONE', 'BANK'].includes(type)) return '•••••••• [REDACTED]';
    return label;
  };

  // Phase 1.5: fetch the repeat-offender profile when a PERSON node is selected.
  const [offenderProfile, setOffenderProfile] = useState<OffenderProfile | null>(null);
  const [offenderLoading, setOffenderLoading] = useState(false);

  // Phase 2.6: organized-crime groups (label-propagation community detection).
  const [ocgGroups, setOcgGroups] = useState<OrganizedCrimeGroup[]>([]);
  useEffect(() => {
    api.network.communities()
      .then(setOcgGroups)
      .catch(() => setOcgGroups([]));
  }, []);
  useEffect(() => {
    if (!selectedNodeId) {
      setOffenderProfile(null);
      return;
    }
    let cancelled = false;
    setOffenderLoading(true);
    api.offenders.get(selectedNodeId)
      .then((p) => { if (!cancelled) setOffenderProfile(p); })
      .catch(() => { if (!cancelled) setOffenderProfile(null); })
      .finally(() => { if (!cancelled) setOffenderLoading(false); });
    return () => { cancelled = true; };
  }, [selectedNodeId]);

  // Convert to Cytoscape elements
  const elements = useMemo(() => {
    let cyNodes = nodes.filter(n => typeFilter === 'ALL' || n.type === typeFilter).map(n => ({
      data: { 
        id: n.id, 
        label: maskLabel(n.label, n.type), 
        color: getNodeColor(n.type),
        type: n.type,
      }
    }));

    let cyEdges = edges.map(e => ({
      data: { 
        source: e.from, 
        target: e.to, 
        label: e.relation 
      }
    }));

    if (searchSeed) {
      cyNodes = cyNodes.filter(n => n.data.label.toLowerCase().includes(searchSeed.toLowerCase()) || n.data.type.toLowerCase().includes(searchSeed.toLowerCase()));
    }

    // CRITICAL FIX: Cytoscape crashes if an edge references a non-existent node
    const nodeIds = new Set(cyNodes.map(n => n.data.id));
    cyEdges = cyEdges.filter(e => nodeIds.has(e.data.source) && nodeIds.has(e.data.target));

    return [...cyNodes, ...cyEdges];
  }, [nodes, edges, hidePii, typeFilter, searchSeed]);

  // Memoize stylesheet to prevent cytoscape re-renders
  const cyStylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'color': '#0f172a',
        'font-size': '11px',
        'font-weight': '600',
        'font-family': 'sans-serif',
        'text-valign': 'bottom' as const,
        'text-halign': 'center' as const,
        'text-margin-y': 6,
        'width': 32,
        'height': 32,
        'border-width': 2,
        'border-color': '#334155',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#94a3b8',
        'target-arrow-color': '#94a3b8',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier' as const,
        'label': 'data(label)',
        'font-size': '9px',
        'font-family': 'sans-serif',
        'color': '#475569',
        'text-background-opacity': 0.9,
        'text-background-color': '#ffffff',
        'text-background-padding': '3px',
        'text-background-shape': 'roundrectangle',
        'text-border-color': '#cbd5e1',
        'text-border-width': 1,
        'text-border-opacity': 0.8,
      }
    },
    {
      selector: ':selected',
      style: {
        'border-width': 3,
        'border-color': '#2563eb',
        'line-color': '#2563eb',
        'target-arrow-color': '#2563eb',
      }
    }
  ], []);

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.layout({ name: layoutMode, animate: true, animationDuration: 500 }).run();
    }
  }, [layoutMode, elements]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const handleAddEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel || !selectedNode) return;
    
    const newId = `node-${nodes.length + 1}`;
    const newGraphNode: GraphNode = {
      id: newId,
      label: newNodeLabel,
      type: newNodeType,
      risk: newNodeRisk,
      details: { category: `Added ${newNodeType}`, subtext: `Linked to ${selectedNode.label}`, casesCount: 1, connectionsCount: 1 },
    };
    const newGraphEdge: GraphEdge = { from: selectedNode.id, to: newId, relation: newRelation };

    setNodes([...nodes, newGraphNode]);
    setEdges([...edges, newGraphEdge]);
    setSelectedNodeId(newId);
    setShowAddNodeModal(false);
    setNewNodeLabel('');
  };

  return (
    <AppShell title="Network & Link Analysis" scope="Intelligence Graph">
      {/* Phase 1.4: the graph now fetches from api.network.graph() (real query
          over NoSQL NetworkEdges derived from co-accused case data). The search
          box triggers a focused BFS subgraph. The "Add Entity" action is still
          local-only (no persistence) — banner kept for that until a POST endpoint
          exists. */}
      <SampleDataBanner
        feature="The 'Add Entity' action (graph nodes/edges themselves are now live)"
        pendingSource="a network-edge POST endpoint for persistence"
        className="mb-4"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-none border border-border bg-card p-4 shadow-none">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search suspect/person key (BFS focus)…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Focus</Button>
          {searchSeed && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearchSeed(''); setSearchInput(''); fetchGraph(); }}>
              Clear
            </Button>
          )}
          
          <div className="flex rounded-none bg-secondary/50 p-1 border border-border/50">
            {[1, 2, 3].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => { setHops(h); if (searchSeed) fetchGraph(searchSeed, h); }}
                className={`rounded-none px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-widest transition-all ${
                  hops === h ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {h} Hop{h > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={layoutMode}
            onChange={(e) => setLayoutMode(e.target.value as any)}
            className="rounded-none border-b-2 border-border bg-transparent px-3 py-1 text-[10px] font-bold text-foreground focus:outline-none focus:border-primary font-mono uppercase"
          >
            <option value="cose">Force-Directed</option>
            <option value="concentric">Concentric Rings</option>
            <option value="breadthfirst">Hierarchical Tree</option>
          </select>

          <Button size="sm" onClick={() => setShowAddNodeModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Entity
          </Button>

          <Button
            size="sm"
            variant={hidePii ? 'destructive' : 'outline'}
            onClick={() => setHidePii(!hidePii)}
          >
            {hidePii ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {hidePii ? 'PII Masked' : 'Mask PII'}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between rounded-none border border-border bg-secondary/20 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[10px] font-mono text-muted-foreground uppercase tracking-widest mr-2">Filter:</span>
          {['ALL', 'PERSON', 'CASE', 'PHONE', 'BANK', 'VEHICLE'].map((t) => (
            <Badge
              key={t}
              variant={typeFilter === t ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-widest font-bold text-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-red-500" /> PERSON</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-blue-500" /> CASE FIR</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-amber-500" /> PHONE</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-purple-500" /> BANK A/C</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-emerald-500" /> VEHICLE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 h-[calc(100vh-280px)]">
        <Card className="lg:col-span-8 flex flex-col overflow-hidden bg-background rounded-none shadow-none border-border">
          <div className="flex-1 relative">
            {graphLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">
                Loading network graph (querying NetworkEdges)…
              </div>
            ) : graphError ? (
              <div className="m-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
                Graph load failed: {graphError}
              </div>
            ) : elements.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No graph data. {searchSeed ? `No entities found for "${searchSeed}".` : 'Graph is empty.'}
              </div>
            ) : (
            <CytoscapeComponent
              elements={elements}
              style={{ width: '100%', height: '100%' }}
              stylesheet={cyStylesheet as any}
              layout={{ name: layoutMode, animate: true }}
              diff={(a: any, b: any) => a !== b}
              get={(obj: any, key: string) => (obj ? obj[key] : null)}
              toJson={(obj: any) => obj}
              forEach={(list: any[], fn: any) => list && list.forEach(fn)}
              cy={(cy: any) => {
                if (cyRef.current !== cy) {
                  cyRef.current = cy;
                  cy.removeAllListeners();
                  cy.on('tap', 'node', (evt: any) => {
                    setSelectedNodeId(evt.target.id());
                  });
                }
              }}
            />
            )}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Button size="icon" variant="secondary" onClick={() => cyRef.current?.fit()}><Maximize className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" onClick={() => cyRef.current?.center()}><Navigation className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4 p-5 overflow-y-auto rounded-none shadow-none border-border bg-secondary/10">
          {/* Phase 2.6: Organized Crime Groups (community detection) */}
          {ocgGroups.length > 0 && (
            <div className="mb-4 border border-border p-4 space-y-2 bg-background shadow-sm">
              <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground tracking-widest">
                Organized Crime Groups (auto-detected)
              </div>
              <div className="space-y-2">
                {ocgGroups.slice(0, 4).map((g) => (
                  <div key={g.id} className="rounded border border-border/50 bg-card p-2 text-[11px]">
                    <div className="font-bold text-destructive">{g.id} · {g.memberCount} members</div>
                    <div className="text-muted-foreground">
                      Hub: {g.mostCentralNode.personName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.members.slice(0, 4).map((m) => (
                        <span
                          key={m.personKey}
                          className="cursor-pointer rounded bg-secondary px-1 py-0.5 text-[9px] font-mono hover:bg-primary hover:text-primary-foreground"
                          onClick={() => { setSelectedNodeId(m.personKey); fetchGraph(m.personKey, hops); }}
                        >
                          {m.personName}
                        </span>
                      ))}
                      {g.members.length > 4 && <span className="text-[9px] text-muted-foreground">+{g.members.length - 4} more</span>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground italic">
                Detected via label-propagation community detection over co-accused + shared-attribute edges.
              </p>
            </div>
          )}
          {selectedNode ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs font-bold uppercase text-primary">Node Inspector Drawer</span>
                <h2 className="text-xl font-bold text-foreground mt-1">
                  {maskLabel(selectedNode.label, selectedNode.type)}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <Badge style={{ backgroundColor: getNodeColor(selectedNode.type) }} className="text-white text-[9px] px-1.5 py-0 font-mono rounded-none">
                    {selectedNode.type}
                  </Badge>
                  <RiskBadge level={selectedNode.risk} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-background border border-border p-4 shadow-sm">
                  <div className="font-bold text-foreground">{selectedNode.details.category}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{selectedNode.details.subtext}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border p-4 text-center bg-background shadow-sm">
                    <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground tracking-widest">Cases</div>
                    <div className="mt-1 text-2xl font-mono font-extrabold text-foreground">{selectedNode.details.casesCount}</div>
                  </div>
                  <div className="border border-border p-4 text-center bg-background shadow-sm">
                    <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground tracking-widest">Links</div>
                    <div className="mt-1 text-2xl font-mono font-extrabold text-foreground">{selectedNode.details.connectionsCount}</div>
                  </div>
                </div>
                <div className="border border-border p-4 space-y-3 bg-background shadow-sm">
                  <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground tracking-widest">Quick Actions</div>
                  <Button className="w-full" onClick={() => { setHops((h) => Math.min(3, h + 1)); if (selectedNode) fetchGraph(selectedNode.id, Math.min(3, hops + 1)); }}>
                    Expand Network (+1 Hop)
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/cases')}>
                    Inspect Associated Cases
                  </Button>
                </div>

                {/* Phase 1.5: repeat-offender cross-case profile + MO tags */}
                {selectedNode.type === 'PERSON' && (
                  <div className="border border-border p-4 space-y-3 bg-background shadow-sm">
                    <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground tracking-widest">
                      Offender Cross-Case Profile
                    </div>
                    {offenderLoading ? (
                      <div className="text-xs text-muted-foreground animate-pulse">Loading offender history…</div>
                    ) : offenderProfile ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="border border-border p-2 text-center">
                            <div className="text-[9px] font-bold uppercase text-muted-foreground">Total Cases</div>
                            <div className="text-lg font-mono font-extrabold text-foreground">{offenderProfile.totalCases}</div>
                          </div>
                          <div className="border border-border p-2 text-center">
                            <div className="text-[9px] font-bold uppercase text-muted-foreground">Districts</div>
                            <div className="text-lg font-mono font-extrabold text-foreground">{offenderProfile.districtsActive.length}</div>
                          </div>
                        </div>
                        {offenderProfile.modusOperandiTags.length > 0 && (
                          <div>
                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Modus Operandi Patterns</div>
                            <div className="flex flex-wrap gap-1">
                              {offenderProfile.modusOperandiTags.map((t) => (
                                <span key={t.mo} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono font-bold text-foreground">
                                  {t.mo} ×{t.count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {offenderProfile.caseHistory.length > 0 && (
                          <div>
                            <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Case History (cross-district)</div>
                            <div className="max-h-40 space-y-1 overflow-y-auto">
                              {offenderProfile.caseHistory.slice(0, 8).map((c) => (
                                <div key={c.caseMasterId} className="rounded border border-border/50 bg-card p-1.5 text-[10px]">
                                  <div className="font-mono font-bold text-primary">{c.crimeNo}</div>
                                  <div className="text-muted-foreground">{c.crimeCategory} · Dist {c.districtId} · {c.registeredDate.slice(0, 10)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {offenderProfile.totalCases >= 3 && (
                          <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-[10px] font-bold text-destructive">
                            ⚠ REPEAT OFFENDER — {offenderProfile.totalCases} cases across {offenderProfile.districtsActive.length} district(s)
                          </div>
                        )}
                        <p className="text-[9px] text-muted-foreground italic">
                          Cross-jurisdiction tracking via name-based PersonKey. Production use requires PII/legal sign-off.
                        </p>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">No offender profile found for this node.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">Select a node to view details</div>
          )}
        </Card>
      </div>

      <AnimatePresence>
        {showAddNodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddNodeModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
              <h3 className="text-lg font-bold border-b pb-3 mb-4">Add Network Entity</h3>
              <form onSubmit={handleAddEntity} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Entity Label</label>
                  <Input type="text" value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <select value={newNodeType} onChange={(e) => setNewNodeType(e.target.value as any)} className="w-full rounded-md border bg-background p-2 text-sm">
                      {['PERSON', 'CASE', 'PHONE', 'BANK', 'VEHICLE'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Risk</label>
                    <select value={newNodeRisk} onChange={(e) => setNewNodeRisk(e.target.value as any)} className="w-full rounded-md border bg-background p-2 text-sm">
                      <option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Relation to Selected</label>
                  <select value={newRelation} onChange={(e) => setNewRelation(e.target.value)} className="w-full rounded-md border bg-background p-2 text-sm">
                    <option value="ASSOCIATED_WITH">ASSOCIATED_WITH</option>
                    <option value="TRANSFERRED_TO">TRANSFERRED_TO</option>
                    <option value="USED_PHONE">USED_PHONE</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setShowAddNodeModal(false)}>Cancel</Button>
                  <Button type="submit">Add Node</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
