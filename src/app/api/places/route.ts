import { NextResponse } from 'next/server';

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
    };
}

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

        const places = allResults.map(place => mapPlace(place, categoryId));
        return NextResponse.json({ places });

    } catch (error) {
        console.error('Places API error:', error);
        return NextResponse.json({ error: 'Failed to fetch places data' }, { status: 500 });
    }
}
