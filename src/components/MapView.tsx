'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ComponentType } from 'react';
import Map, { NavigationControl, Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import { MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { MapPlace } from '@/types';
import { CATEGORIES } from '@/lib/constants';
// Mapbox CSS is required for the map to render correctly


interface MapViewProps {
    onMapLoad?: () => void;
    searchLocation?: { lat: number; lng: number } | null;
    places?: MapPlace[];
    travelMode: 'walking' | 'driving' | 'transit';
    onTravelModeChange: (mode: 'walking' | 'driving' | 'transit') => void;
    selectedPlace: MapPlace | null;
    onPlaceSelect: (place: MapPlace | null) => void;
}

type MarkerIcon = ComponentType<{
    size?: number;
    className?: string;
}>;

const markerIcons = LucideIcons as unknown as Record<string, MarkerIcon>;

// Initial center over San Francisco, CA
const INITIAL_VIEW_STATE = {
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 13,
    pitch: 45, // Angled for a 3D-ish view
    bearing: -17.6 // Slight rotation
};

// Using Mapbox's Dark Style for the premium cinematic feel
const MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

export function MapView({ onMapLoad, searchLocation, places = [], travelMode, onTravelModeChange, selectedPlace, onPlaceSelect }: MapViewProps) {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [hoveredPlace, setHoveredPlace] = useState<MapPlace | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [routeData, setRouteData] = useState<any>(null);

    // When selectedPlace changes, fly the map to that spot
    useEffect(() => {
        if (mapRef.current && selectedPlace) {
            mapRef.current.flyTo({
                center: [selectedPlace.lng, selectedPlace.lat],
                duration: 1200, // Brisk focus animation
                zoom: 16, // Zoom in closer on individual places
                essential: true,
            });
        }
    }, [selectedPlace]);

    // Fetch actual route between the origin and hovered place
    // Walking/driving use Mapbox Directions; transit uses Google Directions API (server-side)
    useEffect(() => {
        if (!searchLocation || !hoveredPlace) {
            const t = setTimeout(() => setRouteData(null), 0);
            return () => clearTimeout(t);
        }

        let isMounted = true;

        const fetchRoute = async () => {
            try {
                if (travelMode === 'transit') {
                    const url = `/api/directions?originLat=${searchLocation.lat}&originLng=${searchLocation.lng}&destLat=${hoveredPlace.lat}&destLng=${hoveredPlace.lng}&mode=transit`;
                    const res = await fetch(url);
                    if (!res.ok) return;
                    const data = await res.json();
                    if (isMounted) setRouteData(data);
                } else {
                    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
                    const profile = travelMode === 'walking' ? 'walking' : 'driving';
                    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${searchLocation.lng},${searchLocation.lat};${hoveredPlace.lng},${hoveredPlace.lat}?geometries=geojson&access_token=${token}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (isMounted && data.routes?.[0]) {
                        const durationInSeconds = data.routes[0].duration;
                        const durationInMinutes = Math.ceil(durationInSeconds / 60);
                        const durationStr = durationInMinutes > 60
                            ? `${Math.floor(durationInMinutes / 60)}h ${durationInMinutes % 60}m`
                            : `${durationInMinutes} min`;
                        setRouteData({
                            type: 'Feature',
                            properties: { durationStr },
                            geometry: data.routes[0].geometry
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch directions", err);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchRoute();
        }, 200);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [searchLocation, hoveredPlace, travelMode]);

    // Lazy load the website for the selected place when they click on it
    // This prevents 429 errors from Google from trying to fetch 70 detail pages at once on the initial category scan
    useEffect(() => {
        // If we already have the website (or null if it failed/empty), skip.
        if (!selectedPlace || selectedPlace.website !== undefined) return;

        const fetchDetails = async () => {
            if (!selectedPlace) return;
            try {
                const url = new URL(`/api/place-details`, window.location.origin);
                url.searchParams.set('placeId', selectedPlace.id);

                const res = await fetch(url.toString());
                const data = await res.json();

                onPlaceSelect({
                    ...selectedPlace,
                    website: data.website || null
                });
            } catch (err) {
                console.error("Failed to lazy load place details", err);
            }
        };

        fetchDetails();
    }, [selectedPlace?.id, selectedPlace, onPlaceSelect]);

    // When searchLocation changes, trigger a smooth 'flyTo' animation in Mapbox
    // We use a useEffect so the map reacts independently whenever the parent page sets a new location
    useEffect(() => {
        if (mapRef.current && searchLocation) {
            mapRef.current.flyTo({
                center: [searchLocation.lng, searchLocation.lat],
                duration: 2000, // 2 seconds for a dramatic cinematic fly-over
                zoom: 15,
                essential: true, // This animation is considered essential with respect to prefers-reduced-motion
            });
        }
    }, [searchLocation]);

    const onMapLoadCallback = useCallback((e: mapboxgl.MapboxEvent) => {
        mapRef.current = e.target;
        // Notify parent that map is ready
        if (onMapLoad) onMapLoad();

        // Adding 3D buildings layer for that extra wow factor
        const map = e.target;
        if (!map.getLayer('3d-buildings')) {
            const layers = map.getStyle().layers;
            // Find the label layer to insert the 3D buildings below it
            let labelLayerId;
            for (let i = 0; i < layers.length; i++) {
                const layerLayout = layers[i].layout;
                if (layers[i].type === 'symbol' && layerLayout && typeof layerLayout === 'object' && 'text-field' in layerLayout) {
                    labelLayerId = layers[i].id;
                    break;
                }
            }

            map.addLayer(
                {
                    id: '3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 14,
                    paint: {
                        'fill-extrusion-color': '#2a2a35', // Dark sleek buildings
                        // use an 'interpolate' expression to add a smooth transition effect to the
                        // buildings as the user zooms in
                        'fill-extrusion-height': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            14,
                            0,
                            14.05,
                            ['get', 'height']
                        ],
                        'fill-extrusion-base': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            15,
                            0,
                            15.05,
                            ['get', 'min_height']
                        ],
                        'fill-extrusion-opacity': 0.6
                    }
                },
                labelLayerId
            );
        }
    }, [onMapLoad]);

    // Read Token from ENV
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
        return (
            <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center p-8">
                <div className="glass-panel p-6 text-center text-red-400 border-red-500/50 max-w-md">
                    <h3 className="font-bold mb-2">Missing Mapbox Token</h3>
                    <p className="text-sm text-white/70">Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={MAP_STYLE}
                mapboxAccessToken={mapboxToken}
                onLoad={onMapLoadCallback}
                // These settings optimize the feel of the map interaction
                maxZoom={20}
                minZoom={3}
                pitchWithRotate={true}
                dragRotate={true}
            >
                <NavigationControl position="bottom-right" showCompass={false} />

                {/* Recenter Map Button */}
                {searchLocation && (
                    <div className="absolute bottom-[100px] right-2.5 z-20">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mapRef.current) {
                                    mapRef.current.flyTo({
                                        center: [searchLocation.lng, searchLocation.lat],
                                        zoom: 15,
                                        duration: 1500,
                                        essential: true
                                    });
                                }
                            }}
                            className="w-[29px] h-[29px] bg-[#1a1a1a] rounded flex items-center justify-center text-slate-300 hover:text-white border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-colors"
                            title="Recenter Map"
                        >
                            <LucideIcons.LocateFixed size={16} />
                        </button>
                    </div>
                )}

                {/* The Central "Home" Marker - only show if we have a search location, otherwise default to initial*/}
                <Marker
                    longitude={searchLocation?.lng || INITIAL_VIEW_STATE.longitude}
                    latitude={searchLocation?.lat || INITIAL_VIEW_STATE.latitude}
                    anchor="bottom"
                >
                    <div className="relative flex items-center justify-center group cursor-pointer">
                        {/* The outer glowing pulse effect */}
                        <div className="absolute w-12 h-12 bg-[var(--accent)]/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />

                        {/* The solid "Home" origin pin */}
                        <div className="relative z-10 p-3 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                            <MapPin size={22} className="text-white" />
                        </div>

                        {/* A soft dot to represent the exact base on the ground */}
                        <div className="absolute -bottom-1 w-2 h-1 bg-gray-700 rounded-full shadow-sm" />
                    </div>
                </Marker>

                {/* Render Fetched Places */}
                {places.map(place => {
                    const categoryMeta = CATEGORIES.find(c => c.id === place.category);
                    const IconComponent = categoryMeta ? markerIcons[categoryMeta.iconName] || MapPin : MapPin;
                    const isSelected = selectedPlace?.id === place.id;

                    return (
                        <Marker
                            key={place.id}
                            longitude={place.lng}
                            latitude={place.lat}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                if (isSelected) {
                                    onPlaceSelect(null);
                                } else {
                                    onPlaceSelect(place);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div
                                className="relative flex flex-col items-center justify-center group cursor-pointer"
                                onMouseEnter={() => setHoveredPlace(place)}
                                onMouseLeave={() => setHoveredPlace(null)}
                            >
                                {/* Hover tooltip — hidden when place is already selected */}
                                {!isSelected && (
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                                        <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-xl text-left" style={{ minWidth: '140px', maxWidth: '220px' }}>
                                            <p className="text-white text-xs font-semibold leading-snug">{place.name}</p>
                                            <p className="text-slate-400 text-xs mt-0.5 capitalize">
                                                {place.placeTypes?.find(t => !['point_of_interest', 'establishment', 'premise', 'political'].includes(t))
                                                    ?.replace(/_/g, ' ') ?? place.category}
                                            </p>
                                            {place.address && (
                                                <p className="text-slate-500 text-xs mt-1 leading-snug line-clamp-2">{place.address}</p>
                                            )}
                                        </div>
                                        <div className="w-2 h-2 bg-black/90 border-b border-r border-white/10 rotate-45 mx-auto -mt-1" />
                                    </div>
                                )}

                                {/* The solid, softly rounded category pin container */}
                                <div className={`relative z-10 p-2.5 border rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${isSelected ? '-translate-y-2 ' + (categoryMeta?.bgColor || 'bg-slate-700') + ' border-white/50' : 'bg-[#1a1a24] border-white/10 group-hover:-translate-y-1 group-hover:border-white/30'}`}>
                                    <IconComponent size={16} className={`transition-colors ${isSelected ? 'text-white' : categoryMeta ? categoryMeta.iconActiveClass : 'text-slate-400'}`} />
                                </div>

                                {/* A softer, small dot to represent the exact anchor point on the ground */}
                                <div className={`mt-1.5 w-1.5 h-1 rounded-full shadow-sm transition-transform ${isSelected ? 'bg-white scale-150' : 'bg-white/30 group-hover:scale-125'}`} />
                            </div>
                        </Marker>
                    );
                })}

                {/* Render Hover Route if active */}
                {routeData && (
                    <Source id="route-source" type="geojson" data={routeData}>
                        <Layer
                            id="route-line"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': hoveredPlace
                                    ? (CATEGORIES.find(c => c.id === hoveredPlace.category)?.color || '#00f0ff')
                                    : '#00f0ff',
                                'line-width': 4,
                                'line-opacity': 0.8
                            }}
                        />
                        {/* ETA Label Layer */}
                        {routeData.properties?.durationStr && (
                            <Layer
                                id="route-label"
                                type="symbol"
                                layout={{
                                    'symbol-placement': 'line-center',
                                    'text-field': ['get', 'durationStr'],
                                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                                    'text-size': 14,
                                    'text-offset': [0, -1],
                                    'text-allow-overlap': true,
                                    'text-ignore-placement': true,
                                }}
                                paint={{
                                    'text-color': '#ffffff',
                                    'text-halo-color': '#000000',
                                    'text-halo-width': 2,
                                }}
                            />
                        )}
                    </Source>
                )}

                {/* Travel Mode Toggle Overlay */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xl z-20">
                    <button
                        onClick={() => onTravelModeChange('walking')}
                        className={`p-2 rounded-full transition-all duration-300 ${travelMode === 'walking' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        title="Walking"
                    >
                        <LucideIcons.Footprints size={18} />
                    </button>
                    <button
                        onClick={() => onTravelModeChange('driving')}
                        className={`p-2 rounded-full transition-all duration-300 ${travelMode === 'driving' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        title="Driving"
                    >
                        <LucideIcons.Car size={18} />
                    </button>
                    <button
                        onClick={() => onTravelModeChange('transit')}
                        className={`p-2 rounded-full transition-all duration-300 ${travelMode === 'transit' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        title="Transit"
                    >
                        <LucideIcons.TrainFront size={18} />
                    </button>
                </div>

                {/* Selected Place Popup */}
                {selectedPlace && (
                    <Popup
                        longitude={selectedPlace.lng}
                        latitude={selectedPlace.lat}
                        anchor="bottom"
                        offset={45}
                        onClose={() => onPlaceSelect(null)}
                        closeButton={false}
                        className="cinematic-popup z-50"
                        maxWidth="300px"
                    >
                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] min-w-[200px] max-w-[280px]">
                            {/* Render Photo if available */}
                            {selectedPlace.photoRef && (
                                <div className="w-full h-32 mb-3 rounded-xl overflow-hidden shadow-inner bg-slate-800/50">
                                    <img
                                        src={`/api/place-image?photoRef=${encodeURIComponent(selectedPlace.photoRef)}`}
                                        alt={selectedPlace.name}
                                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                    />
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="text-white font-bold text-lg leading-tight break-words pr-2">
                                    {selectedPlace.name}
                                </h3>
                                {/* Render Link Action if available */}
                                {selectedPlace.website && (
                                    <a
                                        href={selectedPlace.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-400 transition-colors shrink-0"
                                        title="Visit Website"
                                    >
                                        <LucideIcons.Globe size={14} />
                                    </a>
                                )}
                            </div>

                            <p className="text-slate-400 text-xs mb-3 font-medium uppercase tracking-wider">
                                {selectedPlace.placeTypes?.find(t => !['point_of_interest', 'establishment', 'premise', 'political'].includes(t))
                                    ?.replace(/_/g, ' ') ?? selectedPlace.category}
                            </p>

                            <div className="flex items-start gap-2 text-sm text-slate-300 mb-2">
                                <LucideIcons.MapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{selectedPlace.address || 'Address unavailable'}</span>
                            </div>

                            {selectedPlace.rating && (
                                <div className="flex items-center gap-2 text-sm text-amber-400">
                                    <LucideIcons.Star size={14} className="fill-amber-400/20" />
                                    <span className="font-semibold">{selectedPlace.rating}</span>
                                    <span className="text-slate-500 text-xs">({selectedPlace.userRatingsTotal || 0} reviews)</span>
                                </div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
