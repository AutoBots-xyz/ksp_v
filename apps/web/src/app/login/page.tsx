'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const [health, setHealth] = useState<{ status: string; env: string } | null>(null);

  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);
  const [initError, setInitError] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If loaded inside an iframe (e.g. from a post-login redirect), break out to parent window
    if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
      window.top.location.replace('/hub/index.html');
      return;
    }

    api.health()
      .then(setHealth)
      .catch(() => setHealth(null));

    // Safely probe /__catalyst/sdk/init.js to avoid SyntaxError if server returns HTML SPA fallback
    fetch('/__catalyst/sdk/init.js')
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (res.ok && (ct.includes('javascript') || ct.includes('ecmascript'))) {
          const script = document.createElement('script');
          script.src = '/__catalyst/sdk/init.js';
          script.onload = () => setInitLoaded(true);
          script.onerror = () => setInitError(true);
          document.head.appendChild(script);
        } else {
          setInitError(true);
        }
      })
      .catch(() => setInitError(true));
  }, []);

  // Initialize Catalyst Embedded Auth iframe once both SDK & init.js scripts are loaded in browser
  useEffect(() => {
    if (!sdkLoaded || !initLoaded) return;
    if (typeof window === 'undefined' || !window.catalyst?.auth) return;

    // First check if user is already authenticated to prevent recursive iframe rendering
    if (typeof window.catalyst.auth.isUserAuthenticated === 'function') {
      try {
        const authCheck = window.catalyst.auth.isUserAuthenticated();
        if (authCheck instanceof Promise) {
          authCheck
            .then((authenticated: any) => {
              if (authenticated) {
                setIsRedirecting(true);
                window.location.replace('/hub/index.html');
              } else {
                renderCatalystAuthWidget();
              }
            })
            .catch(() => {
              renderCatalystAuthWidget();
            });
          return;
        } else if (authCheck) {
          setIsRedirecting(true);
          window.location.replace('/hub/index.html');
          return;
        }
      } catch (err) {
        console.warn('isUserAuthenticated error:', err);
      }
    }

    renderCatalystAuthWidget();
  }, [sdkLoaded, initLoaded]);

  const renderCatalystAuthWidget = () => {
    try {
      const config = {
        css_url: '',
      };
      if (window.catalyst?.auth?.signIn) {
        window.catalyst.auth.signIn('loginDivElementId', config);
      }
    } catch (err) {
      console.warn('catalyst.auth.signIn error:', err);
      setInitError(true);
    }
  };

  const handleQuickLogin = (role: string, targetPath: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ksp_demo_role', role);
      document.cookie = `dev_session=${role}; path=/; max-age=86400`;
    }
    window.location.href = targetPath;
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ksp-navy to-ksp-blue p-4 sm:p-6">
      {/* 1. Primary Catalyst Web SDK */}
      <Script
        src="https://static.zohocdn.com/catalyst/sdk/js/4.6.2/catalystWebSDK.js"
        strategy="afterInteractive"
        onLoad={() => {
          setSdkLoaded(true);
        }}
        onError={(e) => {
          console.error('[CatalystAuth] Failed to load catalystWebSDK.js', e);
        }}
      />

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ksp-navy">KSP Crime Intelligence</h1>
            <p className="text-xs text-gray-500">
              Karnataka State Police — Crime Intelligence & Analytical Platform
            </p>
          </div>
        </div>

        {/* Backend API Health Status */}
        <div
          className={`mb-6 rounded-md border px-4 py-2.5 text-xs font-semibold ${
            health?.status === 'ok'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}
        >
          {health ? (
            <>Backend API Status: {health.status.toUpperCase()} · Environment: {health.env}</>
          ) : (
            <>Connecting to Catalyst Backend...</>
          )}
        </div>

        {/* Fast Demo Access & Role Bypass — Always visible for testing and evaluation */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Quick Demo Access
              </h3>
              <p className="text-xs text-blue-800 mt-0.5">Instant 1-click access to the Karnataka Police Hub.</p>
            </div>
            <button
              id="direct-hub-btn"
              type="button"
              onClick={() => handleQuickLogin('SCRB_ANALYST', '/hub/index.html')}
              className="shrink-0 rounded-md bg-ksp-navy px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Direct Go to Hub</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="border-t border-blue-200/60 pt-2.5">
            <p className="text-[11px] font-semibold text-blue-900 mb-1.5">Or choose a police role persona:</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('SCRB_ANALYST', '/hub/index.html')}
                className="rounded border border-blue-200 bg-white px-2 py-1.5 text-[11px] font-medium text-blue-900 hover:bg-blue-50 text-left cursor-pointer"
              >
                👮 SCRB Analyst
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('SUPER_ADMIN', '/admin/index.html')}
                className="rounded border border-blue-200 bg-white px-2 py-1.5 text-[11px] font-medium text-blue-900 hover:bg-blue-50 text-left cursor-pointer"
              >
                🛡️ Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('DISTRICT_COMMAND', '/district/index.html')}
                className="rounded border border-blue-200 bg-white px-2 py-1.5 text-[11px] font-medium text-blue-900 hover:bg-blue-50 text-left cursor-pointer"
              >
                🏢 District SP
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('SHO', '/station/index.html')}
                className="rounded border border-blue-200 bg-white px-2 py-1.5 text-[11px] font-medium text-blue-900 hover:bg-blue-50 text-left cursor-pointer"
              >
                🚨 Station SHO
              </button>
            </div>
          </div>
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-medium text-slate-400 shrink-0 uppercase tracking-wider">
            Or Zoho Catalyst Sign In
          </span>
          <div className="border-t border-slate-200 w-full"></div>
        </div>

        {/* Target container element required by catalyst.auth.signIn("loginDivElementId", config) */}
        <div
          id="loginDivElementId"
          className="min-h-[280px] w-full rounded-lg border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-center"
        >
          {isRedirecting ? (
            <div className="text-center text-xs font-medium text-emerald-600">
              <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent mx-auto" />
              Authenticated! Redirecting to Karnataka Police Hub...
            </div>
          ) : initError ? (
            <div className="text-center py-6 max-w-xs">
              <div className="mb-2 text-2xl">🛡️</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Catalyst Cloud Auth Bypassed</p>
              <p className="text-xs text-slate-500 mb-4">
                Running in standalone development mode without Zoho Cloud credentials.
              </p>
              <button
                onClick={() => handleQuickLogin('SCRB_ANALYST', '/hub/index.html')}
                className="w-full rounded bg-blue-600 py-2 px-4 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
              >
                Enter Prototype Dashboard &rarr;
              </button>
            </div>
          ) : !sdkLoaded || !initLoaded ? (
            <div className="text-center text-xs font-medium text-slate-500">
              <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-ksp-navy border-t-transparent mx-auto" />
              Loading Catalyst Authentication Widget...
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Role-Based Access Control (RBAC) Enforced · Zoho Catalyst Auth
        </p>
      </div>
    </main>
  );
}
