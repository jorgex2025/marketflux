'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ placeholder = 'Buscar productos...', className = '', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/products/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.data ?? []);
        setShowSuggestions(true);
      } catch {}
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center border rounded-xl transition-colors ${focused ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-zinc-200'} bg-white`}>
          <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400 ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-2 text-zinc-400 hover:text-zinc-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium rounded-r-xl hover:bg-indigo-700 transition-colors">
            Buscar
          </button>
        </div>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden">
          {suggestions.map((s: any) => (
            <button
              key={s.id}
              onClick={() => { setQuery(s.name); router.push(`/products/${s.slug}`); setShowSuggestions(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-left"
            >
              {s.image && <img src={s.image} alt="" className="w-8 h-8 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-zinc-400">${Number(s.price ?? 0).toLocaleString('es-CO')}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
