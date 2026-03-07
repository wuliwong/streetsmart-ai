'use client';

import { useEffect, useState } from 'react';
import { Search, Navigation } from 'lucide-react';

interface SearchBarProps {
    onSearch: (address: string) => void;
    isSearching: boolean;
    initialQuery?: string;
}

export function SearchBar({ onSearch, isSearching, initialQuery = '' }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);

    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3 shadow-lg transition-all duration-300 focus-within:border-cyan-500/50 focus-within:bg-black/60 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.15)]"
        >
            <div className="pointer-events-none shrink-0 text-slate-500 transition-colors duration-200 group-focus-within:text-cyan-400">
                <Search size={18} strokeWidth={2.25} className={isSearching ? 'animate-pulse' : ''} />
            </div>

            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a city, neighborhood, or address"
                autoComplete="street-address"
                className="min-w-0 flex-1 bg-transparent border-none py-1 text-base font-medium text-white outline-none placeholder:text-slate-500"
            />

            <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 px-4 text-sm font-semibold text-cyan-50 shadow-[0_0_10px_rgba(0,240,255,0.1)] transition hover:bg-cyan-500/30 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:cursor-not-allowed disabled:bg-white/5 disabled:border-white/5 disabled:text-white/30 disabled:shadow-none"
                aria-label="Search"
            >
                <Navigation size={14} strokeWidth={2.5} className={isSearching ? 'animate-pulse' : ''} />
                Go
            </button>
        </form>
    );
}
