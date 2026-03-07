import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
        return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        let websiteUrl: string | null = null;

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status === 'OK' && detailsData.result?.website) {
            websiteUrl = detailsData.result.website;
        }

        return NextResponse.json({ website: websiteUrl });
    } catch (error) {
        console.error('Place Details API error:', error);
        return NextResponse.json({ error: 'Failed to fetch place details data' }, { status: 500 });
    }
}
