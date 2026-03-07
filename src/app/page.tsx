'use client';

import type { ComponentType } from 'react';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { CategoryScroller } from '@/components/CategoryScroller';
import { MapView } from '@/components/MapView';
import { CATEGORIES } from '@/lib/constants';
import type { MapPlace } from '@/types';
import { calculateDistanceStr, estimateETA } from '@/lib/distance';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL on first load
  const [activeCategories, setActiveCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving'>('walking');
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);

  // Calculate Top 10 Closest Places dynamically
  const topPlaces = useMemo(() => {
    if (!searchLocation || places.length === 0) return [];

    // Map with distances
    const withDist = places.map(p => {
      const distInfo = calculateDistanceStr(searchLocation.lat, searchLocation.lng, p.lat, p.lng);
      const etaStr = estimateETA(distInfo.meters, travelMode);
      return {
        ...p,
        distanceMeters: distInfo.meters,
        distanceStr: distInfo.milesStr,
        etaStr
      };
    });

    // Sort by physical distance ascending and grab top 10
    withDist.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return withDist.slice(0, 10);
  }, [places, searchLocation, travelMode]);

  // Update URL whenever local state changes
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (activeCategories.length > 0) {
      params.set('categories', activeCategories.join(','));
    }

    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `/${newSearch}`;

    // Only push to router if the URL actually changed to prevent infinite loops from searchParams updates
    if (window.location.search !== newSearch) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchQuery, activeCategories, router, searchParams]);

  // Re-run geocoding whenever the search query state changes
  useEffect(() => {
    async function fetchLocation() {
      if (!searchQuery) {
        setSearchLocation(null);
        setPlaces(prev => prev.length === 0 ? prev : []);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?address=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchLocation({ lat: data.lat, lng: data.lng });
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      } finally {
        setIsSearching(false);
      }
    }

    // Debounce the fetch slightly if needed, but for now just call it
    const timeoutId = setTimeout(() => {
      fetchLocation();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch places whenever the location or the active categories change
  useEffect(() => {
    async function fetchPlaces() {
      if (!searchLocation || activeCategories.length === 0) {
        setPlaces(prev => prev.length === 0 ? prev : []);
        return;
      }

      try {
        // Fetch all categories in parallel
        const promises = activeCategories.map(categoryId => {
          const categoryMeta = CATEGORIES.find(c => c.id === categoryId);
          if (!categoryMeta) return null;

          return fetch(`/api/places?lat=${searchLocation.lat}&lng=${searchLocation.lng}&query=${encodeURIComponent(categoryMeta.query)}&categoryId=${categoryId}`)
            .then(res => res.json());
        }).filter(Boolean);

        const results = await Promise.all(promises);

        // Flatten the array of results
        const allPlaces: MapPlace[] = results.flatMap(res => res?.places || []);

        // Deduplicate places just in case there's overlap in category queries
        const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.id, item])).values());

        setPlaces(uniquePlaces);

      } catch (err) {
        console.error("Places API failed", err);
      }
    }

    fetchPlaces();
  }, [searchLocation, activeCategories]);

  const handleSearch = (address: string) => {
    setSearchQuery(address);
  };

  const handleCategoryToggle = (categories: string[]) => {
    setActiveCategories(categories);
  };

  const selectedCategories = CATEGORIES.filter((category) => activeCategories.includes(category.id));

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#050505] text-white md:h-screen md:flex-row md:overflow-hidden md:p-4 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black">
      <aside className="order-2 z-20 flex w-full shrink-0 flex-col bg-black/40 backdrop-blur-xl md:order-1 md:h-full md:w-[380px] lg:w-[430px] md:overflow-hidden md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 pb-6 pt-7 sm:px-8 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center">
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
              Street<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Smarts</span>
            </h1>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />

            <section className="relative z-10 rounded-[24px] border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-lg sm:p-5 transition-all hover:bg-black/60 hover:border-white/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(0,240,255,0.8)] animate-pulse"></span>
                    Search Area
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Center the map on a neighborhood, address, or town.
                  </p>
                </div>
                {isSearching && (
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.1)] animate-pulse">
                    Searching
                  </span>
                )}
              </div>
              <SearchBar onSearch={handleSearch} isSearching={isSearching} initialQuery={searchQuery} />
            </section>

            <section className="relative z-10 rounded-[24px] border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-lg sm:p-5 transition-all hover:bg-black/60 hover:border-white/20">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Filters
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Pick the essentials and lifestyle spots you want to compare.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                  <span className="text-white">{selectedCategories.length}</span>/{CATEGORIES.length}
                </span>
              </div>
              <CategoryScroller
                activeCategories={activeCategories}
                onCategoryToggle={handleCategoryToggle}
              />
            </section>

            {topPlaces.length > 0 && (
              <section className="relative z-10 rounded-[24px] border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-lg sm:p-5 flex flex-col h-[350px]">
                <div className="mb-4 flex items-center justify-between gap-3 shrink-0">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80 flex items-center gap-2">
                      <LucideIcons.Navigation size={12} /> Closest Places
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Top {topPlaces.length} nearby spots based on {travelMode === 'walking' ? 'walking' : 'driving'}.
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-3 custom-scrollbar">
                  {topPlaces.map(place => {
                    const categoryMeta = CATEGORIES.find(c => c.id === place.category);
                    const IconComponent = categoryMeta ? (LucideIcons as unknown as Record<string, ComponentType<{ size?: number; className?: string }>>)[categoryMeta.iconName] || LucideIcons.MapPin : LucideIcons.MapPin;

                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelectedPlace(place)}
                        className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${selectedPlace?.id === place.id
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                            : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex gap-3">
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${categoryMeta?.bgColor || 'bg-slate-700'}`}>
                              <IconComponent size={14} className="text-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <h4 className="text-sm font-semibold text-white leading-tight group-hover:text-cyan-300 transition-colors">
                                {place.name}
                              </h4>
                              <p className="text-xs font-medium text-slate-400 line-clamp-1">{place.address}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className={`px-2 py-1 rounded-md bg-black/40 border border-white/10 flex items-center gap-1.5`}>
                              {travelMode === 'walking' ? <LucideIcons.Footprints size={10} className="text-slate-400" /> : <LucideIcons.Car size={10} className="text-slate-400" />}
                              <span className="text-xs font-bold text-white tracking-wide">{place.etaStr}</span>
                            </div>
                            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                              {place.distanceStr}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/5 px-6 py-4 sm:px-8">
          <nav className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600">
            <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
            <span className="text-slate-800">·</span>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <span className="text-slate-800">·</span>
            <Link href="/tos" className="hover:text-slate-400 transition-colors">Terms</Link>
          </nav>
        </div>
      </aside>

      <div className="relative order-1 min-h-[52vh] flex-1 overflow-hidden bg-black md:order-2 md:h-full md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_0_40px_rgba(0,0,0,0.8)] ml-0 md:ml-4">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_40%)]" />
        <MapView
          searchLocation={searchLocation}
          places={places}
          travelMode={travelMode}
          onTravelModeChange={setTravelMode}
          selectedPlace={selectedPlace}
          onPlaceSelect={setSelectedPlace}
        />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}
