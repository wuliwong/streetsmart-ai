import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;

            // We also want to grab a nicely formatted high-level name for the marker (e.g. "Seattle, WA" instead of a full street address)
            const formattedAddress = data.results[0].formatted_address;

            return NextResponse.json({
                lat: location.lat,
                lng: location.lng,
                name: formattedAddress,
            });
        } else {
            return NextResponse.json({ error: 'Location not found', details: data.status }, { status: 404 });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json({ error: 'Failed to fetch location data' }, { status: 500 });
    }
}
