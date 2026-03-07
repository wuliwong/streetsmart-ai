import { NextResponse } from 'next/server';

function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : result >> 1;
        points.push([lng / 1e5, lat / 1e5]);
    }
    return points;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const originLat = searchParams.get('originLat');
    const originLng = searchParams.get('originLng');
    const destLat = searchParams.get('destLat');
    const destLng = searchParams.get('destLng');
    const mode = searchParams.get('mode') || 'transit';

    if (!originLat || !originLng || !destLat || !destLng) {
        return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=${mode}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== 'OK' || !data.routes?.[0]) {
            return NextResponse.json({ error: 'No route found', details: data.status }, { status: 404 });
        }

        const route = data.routes[0];
        const durationSeconds = route.legs[0].duration.value;
        const durationMinutes = Math.ceil(durationSeconds / 60);
        const durationStr = durationMinutes > 60
            ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
            : `${durationMinutes} min`;

        const coordinates = decodePolyline(route.overview_polyline.points);

        return NextResponse.json({
            type: 'Feature',
            properties: { durationStr },
            geometry: {
                type: 'LineString',
                coordinates,
            }
        });
    } catch (error) {
        console.error('Directions error:', error);
        return NextResponse.json({ error: 'Failed to fetch directions' }, { status: 500 });
    }
}
