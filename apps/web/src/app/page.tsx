'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If loaded inside an iframe, break out to top window
    if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
      window.top.location.replace('/hub/');
      return;
    }

    router.replace('/hub/');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
        <p className="text-sm font-medium">Entering KSP Intelligence Platform...</p>
      </div>
    </div>
  );
}
