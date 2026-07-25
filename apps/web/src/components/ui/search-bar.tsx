'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{cases: any[], entities: any[]}>({ cases: [], entities: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside to close results
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults({ cases: [], entities: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // We will call the backend API /api/v1/search
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api/v1';
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        
        if (json.success !== false) {
          setResults(json.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search cases, criminals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.length >= 3) setIsOpen(true) }}
          className="w-64 md:w-80 rounded-full bg-slate-800 border border-slate-700 py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-ksp-blue transition-all"
        />
        {loading && <span className="absolute right-3 text-gray-400 text-[10px] animate-pulse">...</span>}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-gray-200 z-50 p-2">
          
          {/* Cases Results */}
          {results.cases.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Cases</div>
              <div className="space-y-1">
                {results.cases.slice(0, 5).map(c => (
                  <Link href={`/cases/${c.CaseMasterID}`} key={c.CaseMasterID} className="block hover:bg-slate-50 p-2 rounded-lg transition-colors">
                    <div className="font-bold text-ksp-blue text-xs">{c.CrimeNo}</div>
                    <div className="text-[11px] text-gray-600 truncate">{c.BriefFacts}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Entities Results */}
          {results.entities.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-2">Persons</div>
              <div className="space-y-1">
                {results.entities.slice(0, 5).map(e => (
                  <Link href={`/network?entity=${e.PersonKey}`} key={e.PersonKey} className="block hover:bg-slate-50 p-2 rounded-lg transition-colors flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-[10px] text-rose-600 font-bold">
                      {e.PersonName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-ksp-navy text-xs">{e.PersonName}</div>
                      <div className="text-[10px] text-gray-500">Accused/Suspect</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.cases.length === 0 && results.entities.length === 0 && !loading && (
            <div className="p-4 text-center text-xs text-gray-500">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
