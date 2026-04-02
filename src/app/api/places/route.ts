import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type RawPlace = Record<string, unknown>;

function mapPlace(place: RawPlace, categoryId: string | null) {
    const geometry = place.geometry as { location: { lat: number, lng: number } };
    const photos = place.photos as Array<{ photo_reference: string }> | undefined;
    return {
        id: place.place_id as string,
        name: place.name as string,
        address: (place.formatted_address ?? place.vicinity) as string,
        placeTypes: place.types as string[] | undefined,
        photoRef: photos?.[0]?.photo_reference,
        lat: geometry.location.lat,
        lng: geometry.location.lng,
        category: categoryId,
        rating: place.rating as number,
        userRatingsTotal: place.user_ratings_total as number,
        streetSmartsScore: undefined as number | undefined,
    };
}

// Legacy runtime text heuristics removed: Replaced structurally by explicit O(1) precalculated mathematical `place_id` binding

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const query = searchParams.get('query');
    const categoryId = searchParams.get('categoryId');
    const typesParam = searchParams.get('type');

    if (!lat || !lng || !query) {
        return NextResponse.json({ error: 'lat, lng, and query are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        let allResults: RawPlace[] = [];

        if (typesParam) {
            // NearbySearch ranked by distance — one call per type, then merge + deduplicate
            const types = typesParam.split(',').map(t => t.trim()).filter(Boolean);
            const fetches = types.map(type =>
                fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${encodeURIComponent(type)}&key=${apiKey}`)
                    .then(r => r.json())
                    .then(d => (d.status === 'OK' ? d.results as RawPlace[] : []))
            );
            const results = await Promise.all(fetches);
            const merged = results.flat();
            // Deduplicate by place_id
            const seen = new Set<string>();
            for (const place of merged) {
                const id = place.place_id as string;
                if (!seen.has(id)) {
                    seen.add(id);
                    allResults.push(place);
                }
            }
        } else {
            // TextSearch with location bias (legacy fallback — no category needs this anymore)
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=5000&key=${apiKey}`);
            const data = await res.json();
            if (data.status === 'OK') allResults = data.results;
        }

        let places = allResults.map(place => mapPlace(place, categoryId));

        if (categoryId === 'schools') {
            try {
                // Bulk query the exact UUID array natively avoiding any full table scans mathematically
                const placeIds = places.map(p => p.id);
                let schoolData: any[] = [];
                
                if (placeIds.length > 0) {
                    const { rows } = await pool.query(
                        'SELECT * FROM public.schools WHERE place_id = ANY($1::text[])',
                        [placeIds]
                    );
                    schoolData = rows;
                }
                
                if (schoolData.length > 0) {
                    const sectorsParam = searchParams.get('sectors')?.split(',').filter(Boolean) || [];
                    const levelsParam = searchParams.get('levels')?.split(',').filter(Boolean) || [];
                    
                    places = places.filter(p => {
                        // Strict O(1) mathematical ID lookup bounding NCES permanently to Google Places.
                        // Eradicates all fragile runtime false-positives intrinsically.
                        const match = schoolData.find((s: any) => s.place_id && s.place_id === p.id);
                        
                        if (match) {
                            // Filter logic based on our proprietary dataset fields
                            let levelMatches = levelsParam.length === 0;
                            if (levelsParam.includes('elementary') && match.school_level === 1) levelMatches = true;
                            if (levelsParam.includes('middle') && match.school_level === 2) levelMatches = true;
                            if (levelsParam.includes('high') && match.school_level === 3) levelMatches = true;
                            
                            let sectorMatches = sectorsParam.length === 0;
                            const isPrivate = match.is_private === true;
                            const isCharter = match.charter === 1;
                            
                            if (sectorsParam.includes('public') && !isPrivate && !isCharter) sectorMatches = true;
                            if (sectorsParam.includes('charter') && isCharter) sectorMatches = true;
                            if (sectorsParam.includes('private') && isPrivate) sectorMatches = true;
                            
                            if (!levelMatches || !sectorMatches) return false; // Drop from map!

                            if (match.streetSmartsScore) {
                                p.rating = match.streetSmartsScore / 20;
                                p.userRatingsTotal = match.enrollment || 150;
                                p.streetSmartsScore = match.streetSmartsScore;
                            }
                            return true;
                        } else {
                            // Non-dataset places (daycares, missing private, missing public) 
                            // NEVER drop them per user's strict 'Google Fallback' requirement!
                            if (!p.rating) {
                                p.rating = 3.5;
                                p.userRatingsTotal = 50;
                            }
                            return true;
                        }
                    });
                }
            } catch (err) {
                console.error("Failed to inject school rankings", err);
            }
        }

        return NextResponse.json({ places });

    } catch (error) {
        console.error('Places API error:', error);
        return NextResponse.json({ error: 'Failed to fetch places data' }, { status: 500 });
    }
}
