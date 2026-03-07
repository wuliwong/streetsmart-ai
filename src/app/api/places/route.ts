import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const query = searchParams.get('query');
    const categoryId = searchParams.get('categoryId');

    if (!lat || !lng || !query) {
        return NextResponse.json({ error: 'lat, lng, and query are required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        // using the older Places TextSearch API which is robust and supports simple queries + location bias
        // We append the location and a 5000 meter radius (about 3 miles)
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=5000&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            // Map the messy Google Places payload into our clean standard MapPlace interface
            // Photo reference extraction is cheap, so we grab the string here, but we will construct the heavy image URL lazily.
            const places = data.results.map((place: Record<string, unknown>) => {
                const geometry = place.geometry as { location: { lat: number, lng: number } };
                const placeId = place.place_id as string;

                let photoRef: string | undefined = undefined;

                // Extract photo if available from the search results
                const photos = place.photos as Array<{ photo_reference: string, maxwidth: number }> | undefined;
                if (photos && photos.length > 0) {
                    photoRef = photos[0].photo_reference;
                }

                return {
                    id: placeId,
                    name: place.name as string,
                    address: place.formatted_address as string,
                    photoRef,
                    lat: geometry.location.lat,
                    lng: geometry.location.lng,
                    category: categoryId, // Pass back the internal ID so the frontend knows what icon/color to paint
                    rating: place.rating as number,
                    userRatingsTotal: place.user_ratings_total as number,
                };
            });

            return NextResponse.json({ places });
        } else if (data.status === 'ZERO_RESULTS') {
            return NextResponse.json({ places: [] });
        } else {
            return NextResponse.json({ error: 'Places search failed', details: data.status }, { status: 400 });
        }
    } catch (error) {
        console.error('Places API error:', error);
        return NextResponse.json({ error: 'Failed to fetch places data' }, { status: 500 });
    }
}
