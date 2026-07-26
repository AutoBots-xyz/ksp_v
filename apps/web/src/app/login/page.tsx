'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { api } from '@/lib/api-client';

export default function LoginPage() {
  const [health, setHealth] = useState<{ status: string; env: string } | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    api.health()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  // Initialize Catalyst Embedded Auth iframe once both SDK & init.js scripts are loaded in browser
  useEffect(() => {
    if (!sdkLoaded || !initLoaded) return;
    if (typeof window === 'undefined' || !window.catalyst?.auth) return;

    const loginContainer = document.getElementById('loginDivElementId');
    if (!loginContainer) return;

    try {
      // Configuration passed to Catalyst Embedded Auth SDK
      // Ground Truth: service_url set to '/hub' (main landing dashboard route)
      const config = {
        service_url: '/hub',
        is_customize_forgot_password: false,
      };

      // Renders embedded authentication iframe inside #loginDivElementId
      window.catalyst.auth.signIn('loginDivElementId', config);
    } catch (err) {
      console.error('[CatalystAuth] Failed to initialize embedded login iframe:', err);
    }
  }, [sdkLoaded, initLoaded]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ksp-navy to-ksp-blue p-4 sm:p-6">
      {/* 1. Primary Catalyst Web SDK */}
      <Script
        src="https://static.zohocdn.com/catalyst/sdk/js/4.6.2/catalystWebSDK.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[CatalystAuth] catalystWebSDK.js loaded.');
          setSdkLoaded(true);
        }}
        onError={(e) => {
          console.error('[CatalystAuth] Failed to load catalystWebSDK.js', e);
        }}
      />

      {/* 2. Catalyst Project Environment Initialization script */}
      <Script
        src="/__catalyst/sdk/init.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[CatalystAuth] /__catalyst/sdk/init.js loaded.');
          setInitLoaded(true);
        }}
        onError={() => {
          console.warn('[CatalystAuth] /__catalyst/sdk/init.js not found (expected during standalone npm run dev).');
          setInitError(true);
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

        {/* Quick Dev Access Button — Always visible in local dev mode or when init.js fails */}
        {(process.env.NODE_ENV === 'development' || initError) && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡</span> Local Dev Bypass
                </h3>
                <p className="text-xs text-blue-800 mt-0.5">Skip cloud auth &amp; enter dashboard with mock data.</p>
              </div>
              <button
                onClick={() => {
                  document.cookie = "dev_session=true; path=/; max-age=86400";
                  window.location.href = '/hub';
                }}
                className="shrink-0 rounded-md bg-ksp-navy px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-900 transition flex items-center justify-center gap-1.5"
              >
                <span>Direct Go to Hub</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* Local Dev Banner Notice if served outside Catalyst CLI */}
        {initError && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <span className="font-semibold">ℹ Note for Local Development:</span>
            <p className="mt-1">
              <code>/__catalyst/sdk/init.js</code> is provided when running through <code>catalyst serve</code> or deployed to Web Client Hosting. Use the button above to proceed directly to the Hub.
            </p>
          </div>
        )}

        {/* Target container element required by catalyst.auth.signIn("loginDivElementId", config) */}
        <div
          id="loginDivElementId"
          className="min-h-[280px] w-full rounded-lg border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-center"
        >
          {initError ? (
            <div className="text-center py-6 max-w-xs">
              <div className="mb-2 text-2xl">🛡️</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Catalyst Cloud Auth Bypassed</p>
              <p className="text-xs text-slate-500 mb-4">
                Running in standalone development mode without Zoho Cloud credentials.
              </p>
              <button
                onClick={() => {
                  document.cookie = "dev_session=true; path=/; max-age=86400";
                  window.location.href = '/hub';
                }}
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
