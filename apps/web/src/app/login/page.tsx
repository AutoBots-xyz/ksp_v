'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { catalystAuth } from '@/lib/catalyst-auth';

export default function LoginPage() {
  const [health, setHealth] = useState<{ status: string; env: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.health()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await catalystAuth.signIn('/hub');
    } catch (err) {
      console.error('Sign in failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ksp-navy to-ksp-blue p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold text-ksp-navy">KSP Crime Intelligence</h1>
        <p className="mb-6 text-sm text-gray-500">
          Karnataka State Police — Crime Intelligence & Analytical Platform
        </p>

        <div
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${
            health?.status === 'ok'
              ? 'border-ksp-ok/30 bg-ksp-ok/10 text-ksp-ok'
              : 'border-ksp-warn/30 bg-ksp-warn/10 text-ksp-warn'
          }`}
        >
          {health ? (
            <>API {health.status} · env: {health.env}</>
          ) : (
            <>Connecting to Catalyst Backend...</>
          )}
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="w-full rounded-md bg-ksp-navy hover:bg-ksp-blue transition-colors px-4 py-2.5 text-sm font-semibold text-white shadow-md"
        >
          {loading ? 'Signing in...' : 'Sign in with Catalyst Auth'}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          Role-based access enforced end-to-end · Catalyst Authentication
        </p>
      </div>
    </main>
  );
}
