'use client';

import type { ComponentType } from 'react';

import { useState, Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { CategoryScroller } from '@/components/CategoryScroller';
import { MapView } from '@/components/MapView';
import { BrandWordmark } from '@/components/BrandWordmark';
import { WeatherPanel } from '@/components/WeatherPanel';
import SchoolSmartsPanel, { SchoolFilters } from '@/components/SchoolSmartsPanel';
import { CATEGORIES } from '@/lib/constants';
import type { MapPlace } from '@/types';
import { calculateDistanceStr, estimateETA } from '@/lib/distance';
import { calculateStreetSmartsScore } from '@/lib/scoring';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL on first load — no categories active by default
  const [activeCategories, setActiveCategories] = useState<string[]>(
    searchParams.get('categories')
      ? searchParams.get('categories')!.split(',').filter(Boolean)
      : []
  );
  
  const [schoolFilters, setSchoolFilters] = useState<SchoolFilters>({
    sectors: searchParams.get('schoolSectors')?.split(',').filter(Boolean) || ['public', 'charter'],
    levels: searchParams.get('schoolLevels')?.split(',').filter(Boolean) || ['elementary', 'middle', 'high']
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | 'transit'>('walking');
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [searchOpen, setSearchOpen] = useState(true);
  const [scoreOpen, setScoreOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [closestOpen, setClosestOpen] = useState(true);

  const [isMobile, setIsMobile] = useState(false);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addressScore = useMemo(() => {
    return calculateStreetSmartsScore(searchLocation, places, activeCategories, travelMode);
  }, [searchLocation, places, activeCategories, travelMode]);

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
      if (activeCategories.includes('schools')) {
        params.set('schoolSectors', schoolFilters.sectors.join(','));
        params.set('schoolLevels', schoolFilters.levels.join(','));
      }
    }

    const newSearch = params.toString() ? `?${params.toString()}` : '';
    const newUrl = `/${newSearch}`;

    // Compare native keys and decoded values to prevent infinite loops caused by varying URL encodings (+ vs %20) between browsers and Next.js routers
    const sp1 = new URLSearchParams(params.toString());
    const sp2 = new URLSearchParams(searchParams.toString());

    let isChanged = false;
    const keys1 = Array.from(sp1.keys());
    const keys2 = Array.from(sp2.keys());

    if (keys1.length !== keys2.length) {
      isChanged = true;
    } else {
      for (const key of keys1) {
        if (sp1.get(key) !== sp2.get(key)) {
          isChanged = true;
          break;
        }
      }
    }

    if (isChanged) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchQuery, activeCategories, schoolFilters, router, searchParams]);

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
          const loc = { lat: data.lat, lng: data.lng };
          setSearchLocation(loc);

          // Immediately resolve school district + county for this address
          try {
            const spatialRes = await fetch(`/api/spatial-context?lat=${loc.lat}&lng=${loc.lng}`);
            if (spatialRes.ok) {
              const spatialData = await spatialRes.json();
              setDistrictId(spatialData.district_id || null);
            }
          } catch {
            setDistrictId(null);
          }
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
          if (categoryId === 'schools') {
            const params = new URLSearchParams({ lat: String(searchLocation.lat), lng: String(searchLocation.lng), query: 'Schools', categoryId });
            // Always fetch broad 'school' type from Google to prevent it from arbitrarily hiding middle/elem schools with bad metadata.
            params.set('type', 'school'); 
            
            // Pass filters to the route so the backend drops the irrelevant ones securely.
            params.set('sectors', schoolFilters.sectors.join(','));
            params.set('levels', schoolFilters.levels.join(','));

            // Pass resolved district so schools can be tagged in_district
            if (districtId) params.set('districtId', districtId);
            
            return fetch(`/api/places?${params.toString()}`).then(res => res.json());
          }

          const categoryMeta = CATEGORIES.find(c => c.id === categoryId);
          if (!categoryMeta) return null;

          const params = new URLSearchParams({ lat: String(searchLocation.lat), lng: String(searchLocation.lng), query: categoryMeta.query, categoryId });
          if ('placeType' in categoryMeta && categoryMeta.placeType) params.set('type', categoryMeta.placeType as string);
          return fetch(`/api/places?${params.toString()}`).then(res => res.json());
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
  }, [searchLocation, activeCategories, schoolFilters, districtId]);

  const handleSearch = (address: string) => {
    setSearchQuery(address);
  };

  const handleCategoryToggle = (categories: string[]) => {
    setActiveCategories(categories);
  };

  const renderableCategories = CATEGORIES.filter(c => c.id !== 'schools');
  const selectedCategories = renderableCategories.filter((category) => activeCategories.includes(category.id));

  return (
    <main className="flex min-h-screen w-full flex-col bg-[#050505] text-white md:h-screen md:flex-row md:overflow-hidden md:p-4 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black relative">
      <motion.aside
        animate={{ y: isMobile && isSheetCollapsed ? "calc(100% - 64px)" : 0 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        initial={false}
        className={`z-50 flex w-full flex-col bg-black/40 backdrop-blur-xl md:static md:order-1 md:h-full md:w-[380px] lg:w-[430px] md:overflow-hidden md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_0_40px_rgba(0,0,0,0.8)] ${isMobile ? 'fixed bottom-0 left-0 right-0 rounded-t-[32px] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' : ''}`}
        style={{ height: isMobile ? '85vh' : '100%' }}
      >
        {isMobile && (
          <button
            type="button"
            className="flex w-full justify-center items-center py-5 shrink-0 touch-none outline-none group"
            onClick={() => setIsSheetCollapsed(prev => !prev)}
            aria-label={isSheetCollapsed ? "Expand map details" : "Collapse map details"}
          >
            <div className={`w-14 h-1.5 rounded-full transition-colors ${isSheetCollapsed ? 'bg-cyan-400' : 'bg-white/30 group-hover:bg-white/50'}`} />
          </button>
        )}

        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-white/10 px-6 py-5 sm:px-8 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center shrink-0">
            <BrandWordmark size="sidebar" className="drop-shadow-md" />
          </div>

          <div
            className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 relative pb-32 md:pb-6"
            style={{ touchAction: "pan-y" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />

            <section className="relative z-10 rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(0,240,255,0.05)] sm:p-5 transition-all hover:from-cyan-500/20 hover:to-blue-600/10 hover:border-cyan-500/40">
              <button
                type="button"
                onClick={() => setSearchOpen(o => !o)}
                className="w-full flex items-center justify-between gap-3 group"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <LucideIcons.Search size={16} className="text-cyan-400" />
                  Search Area
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  {isSearching && (
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-400 animate-pulse">
                      Searching
                    </span>
                  )}
                  <LucideIcons.ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${searchOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {searchOpen && (
                <div className="mt-4">
                  <SearchBar onSearch={handleSearch} isSearching={isSearching} initialQuery={searchQuery} />
                </div>
              )}
            </section>

            {addressScore && (
              <section className="relative z-10 rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 backdrop-blur-md p-5 shadow-[0_0_30px_rgba(0,240,255,0.05)] transition-all">
                <button
                  type="button"
                  onClick={() => setScoreOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-3 group"
                >
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <LucideIcons.Sparkles size={16} className="text-cyan-400" />
                    StreetSmarts Score
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-2xl font-black text-cyan-400">{addressScore.totalScore}</span>
                    <LucideIcons.ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${scoreOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {scoreOpen && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="bg-black/40 rounded-xl p-2.5 text-center border border-white/5 shadow-inner">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Density</div>
                      <div className="text-sm font-semibold text-white">{addressScore.densityScore}<span className="text-[10px] text-slate-500 ml-0.5">/35</span></div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-2.5 text-center border border-white/5 shadow-inner">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Quality</div>
                      <div className="text-sm font-semibold text-white">{addressScore.qualityScore}<span className="text-[10px] text-slate-500 ml-0.5">/35</span></div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-2.5 text-center border border-white/5 shadow-inner">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Proximity</div>
                      <div className="text-sm font-semibold text-white">{addressScore.proximityScore}<span className="text-[10px] text-slate-500 ml-0.5">/30</span></div>
                    </div>
                  </div>
                )}
              </section>
            )}

            <WeatherPanel searchLocation={searchLocation} />

            <SchoolSmartsPanel
              filters={schoolFilters}
              onFiltersChange={setSchoolFilters}
              isActive={activeCategories.includes('schools')}
              onToggleActive={() => {
                const newCats = activeCategories.includes('schools')
                  ? activeCategories.filter(c => c !== 'schools')
                  : [...activeCategories, 'schools'];
                setActiveCategories(newCats);
              }}
            />

            <section className="relative z-10 rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(0,240,255,0.05)] sm:p-5 transition-all hover:from-cyan-500/20 hover:to-blue-600/10 hover:border-cyan-500/40">
              <button
                type="button"
                onClick={() => setFiltersOpen(o => !o)}
                className="w-full flex items-center justify-between gap-3 group"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <LucideIcons.SlidersHorizontal size={16} className="text-cyan-400" />
                  Filters
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    <span className="text-white">{selectedCategories.length}</span>/{CATEGORIES.length - 1}
                  </span>
                  <LucideIcons.ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {filtersOpen && (
                <div className="mt-4">
                  <CategoryScroller
                    activeCategories={activeCategories}
                    onCategoryToggle={handleCategoryToggle}
                  />
                </div>
              )}
            </section>

            {topPlaces.length > 0 && (
              <section className="relative z-10 rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(0,240,255,0.05)] sm:p-5">
                <button
                  type="button"
                  onClick={() => setClosestOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-3 group"
                >
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <LucideIcons.Navigation size={16} className="text-cyan-400" />
                    Closest Places
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      <span className="text-white">{topPlaces.length}</span> spots
                    </span>
                    <LucideIcons.ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${closestOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {closestOpen && <div className="mt-4 space-y-3">
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
                              {place.streetSmartsScore && (
                                <div className="mt-1 flex w-max items-center gap-1.5 rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                                  <LucideIcons.Sparkles size={10} className="text-cyan-400" />
                                  <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
                                    SchoolSmarts <span className="text-white ml-0.5">{place.streetSmartsScore}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className={`px-2 py-1 rounded-md bg-black/40 border border-white/10 flex items-center gap-1.5`}>
                              {travelMode === 'walking' ? <LucideIcons.Footprints size={10} className="text-slate-400" /> : travelMode === 'transit' ? <LucideIcons.TrainFront size={10} className="text-slate-400" /> : <LucideIcons.Car size={10} className="text-slate-400" />}
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
                </div>}
              </section>
            )}

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
        </div>
      </motion.aside>

      <div className="absolute inset-0 z-0 h-screen w-full md:relative md:order-2 md:h-full md:flex-1 md:overflow-hidden md:rounded-[32px] md:border md:border-white/10 md:shadow-[0_0_40px_rgba(0,0,0,0.8)] md:ml-4 bg-black">
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
