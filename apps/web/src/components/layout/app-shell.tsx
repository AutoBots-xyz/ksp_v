'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import { canAccessRoute, defaultHome, type Role } from '@/lib/rbac';
import { GlobalSearchBar } from '@/components/ui/search-bar';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  BarChart3, Landmark, Shield, FolderOpen, Network, 
  Brain, FileText, Settings, ShieldCheck, Bell, ChevronDown, LogOut, Menu, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface AppShellProps {
  title: string;
  scope: string;
  children: ReactNode;
}

const NAV = [
  { href: '/hub', label: 'SCRB Hub', icon: BarChart3 },
  { href: '/district', label: 'District Command', icon: Landmark },
  { href: '/station', label: 'Station Ops', icon: Shield },
  { href: '/cases', label: 'Case 360°', icon: FolderOpen },
  { href: '/network', label: 'Network Graph', icon: Network },
  { href: '/predict', label: 'AI Predict', icon: Brain },
  { href: '/reports', label: 'SmartBrowz', icon: FileText },
  { href: '/admin', label: 'Admin Console', icon: Settings },
  { href: '/audit', label: 'Audit Trail', icon: ShieldCheck },
];

const PERSONAS: Record<string, { name: string; email: string; initials: string }> = {
  DEVELOPER: { name: 'Lead Developer', email: 'dev.master@ksp.local', initials: 'DEV' },
  SUPER_ADMIN: { name: 'KSP System Admin', email: 'admin@ksp.local', initials: 'SA' },
  SCRB_ANALYST: { name: 'Rajesh Sharma', email: 'scrb.analyst@ksp.local', initials: 'RA' },
  DISTRICT_COMMAND: { name: 'SP Bengaluru Urban', email: 'sp.bu@ksp.local', initials: 'SP' },
  SHO: { name: 'Inspector Ramesh', email: 'sho.whitefield@ksp.local', initials: 'IR' },
  IO: { name: 'PSI Priya Sharma', email: 'io.priya@ksp.local', initials: 'PS' },
  DATA_OPERATOR: { name: 'Records Clerk Kumar', email: 'operator.whitefield@ksp.local', initials: 'RK' },
  AUDITOR: { name: 'Internal Auditor Roy', email: 'auditor@ksp.local', initials: 'AR' },
  VIEWER: { name: 'Demo Guest Account', email: 'viewer@ksp.local', initials: 'VG' },
};

export function AppShell({ title, scope, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>('SCRB_ANALYST');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('ksp_demo_role') as Role;
      if (stored) setActiveRole(stored);
    }
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ksp_demo_role', role);
    }
    const targetHome = defaultHome(role);
    if (!canAccessRoute(pathname, role)) {
      router.push(targetHome);
    } else {
      window.location.reload();
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const persona = PERSONAS[activeRole] || PERSONAS.SCRB_ANALYST;
  const visibleNav = NAV.filter((item) => canAccessRoute(item.href, activeRole));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background font-sans text-foreground ksp-command-grid">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex flex-col shrink-0 border-b border-border bg-background/95 backdrop-blur-md">
        
        {/* Main Header Row */}
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <Link href="/hub" className="flex items-center gap-2 sm:gap-3 transition-opacity hover:opacity-90 shrink-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary font-extrabold text-primary-foreground text-sm">
              KSP
            </div>
            <div className="overflow-hidden hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight text-foreground truncate">State Police</span>
                <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive uppercase tracking-widest shrink-0">LIVE</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">Intelligence Platform</div>
            </div>
          </Link>

          {/* Global Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <GlobalSearchBar />
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase font-mono mr-2 border border-border px-2 py-1 bg-secondary/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </div>

            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8 text-muted-foreground hover:bg-secondary">
                  <Bell className="h-[1.2rem] w-[1.2rem]" />
                  <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground ring-2 ring-background">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80">
                <DropdownMenuLabel>Alerts & Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-1">
                  <div className="rounded-md bg-destructive/10 p-2 border-l-2 border-destructive">
                    <div className="font-bold text-destructive text-xs">Cyber Scam Advisory</div>
                    <div className="text-[10px] text-destructive/80 mt-0.5">High surge in OTP phishing in Whitefield PS</div>
                  </div>
                  <div className="rounded-md bg-amber-500/10 p-2 border-l-2 border-amber-500">
                    <div className="font-bold text-amber-600 dark:text-amber-500 text-xs">Statutory Deadline</div>
                    <div className="text-[10px] text-amber-600/80 dark:text-amber-500/80 mt-0.5">18 cases approaching 60-day limit</div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-muted-foreground hover:bg-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User Profile (desktop) */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 h-9 border-border bg-background hover:bg-secondary px-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-[10px]">
                      {persona.initials}
                    </div>
                    <div className="text-left hidden sm:flex sm:flex-col">
                      <span className="text-xs font-bold leading-none">{persona.name.split(' ')[0]}</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span>{persona.name}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{persona.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Switch Role (Demo)</DropdownMenuLabel>
                  {[
                    { role: 'DEVELOPER', label: '⚡ DEVELOPER (Full Access)' },
                    { role: 'SUPER_ADMIN', label: 'SUPER ADMIN' },
                    { role: 'SCRB_ANALYST', label: 'Analyst (State)' },
                    { role: 'DISTRICT_COMMAND', label: 'SP District Command' },
                    { role: 'SHO', label: 'Station House Officer' },
                    { role: 'IO', label: 'Investigating Officer' },
                  ].map((p) => (
                    <DropdownMenuItem 
                      key={p.role} 
                      onSelect={() => handleRoleChange(p.role as Role)}
                      onClick={() => handleRoleChange(p.role as Role)}
                      className={`cursor-pointer ${activeRole === p.role ? 'bg-primary/10 text-primary font-bold' : ''}`}
                    >
                      {p.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-2">
          <GlobalSearchBar />
        </div>
        
        {/* Secondary Navigation Row (Modules) */}
        <div className="hidden lg:flex items-center px-6 overflow-x-auto hide-scrollbar bg-secondary/10">
          <ul className="flex space-x-1">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/hub' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2.5 text-[11px] font-mono font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground border-b-2 border-transparent'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-16 bottom-0 w-4/5 max-w-xs bg-background border-r border-border overflow-y-auto shadow-2xl pb-16">
            <div className="p-4 border-b border-border bg-secondary/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-[10px]">
                  {persona.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{persona.name}</div>
                  <div className="text-[10px] text-muted-foreground">{persona.email}</div>
                </div>
              </div>
              <div className="mb-2">
                <span className="font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                  SCOPE: {scope}
                </span>
              </div>
            </div>
            <nav className="p-2">
              {visibleNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/hub' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-4 mt-2">
              <div className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Switch Role (Demo)</div>
              <div className="space-y-1">
                {[
                  { role: 'DEVELOPER', label: 'DEVELOPER' },
                  { role: 'SUPER_ADMIN', label: 'SUPER ADMIN' },
                  { role: 'SCRB_ANALYST', label: 'Analyst (State)' },
                  { role: 'DISTRICT_COMMAND', label: 'SP District Command' },
                  { role: 'SHO', label: 'Station House Officer' },
                  { role: 'IO', label: 'Investigating Officer' },
                ].map((p) => (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleRoleChange(p.role as Role)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      activeRole === p.role ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full mt-3 px-3 py-2 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 bg-transparent">
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 font-mono tracking-tight">System Status: Active</p>
          </div>
          <div className="flex items-center">
            <span className="font-mono bg-primary/10 border border-primary/20 px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-widest">
              SCOPE: {scope}
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>

      {/* Touch-Friendly Bottom Navigation Bar for Mobile & Tablet */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-md px-2 shadow-lg pb-safe">
        {[
          { href: '/hub', label: 'Hub', icon: BarChart3 },
          { href: '/cases', label: 'Cases', icon: FolderOpen },
          { href: '/network', label: 'Network', icon: Network },
          { href: '/predict', label: 'Predict', icon: Brain },
          { href: '/reports', label: 'Reports', icon: FileText },
        ].map((item) => {
          const isActive = pathname === item.href || (item.href !== '/hub' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-110 bg-primary/10' : ''}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition-all ${
            mobileMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className={`p-1 rounded-full ${mobileMenuOpen ? 'scale-110 bg-primary/10' : ''}`}>
            <Menu className="h-4 w-4" />
          </div>
          <span className="mt-0.5 tracking-tight">More</span>
        </button>
      </nav>
    </div>
  );
}
