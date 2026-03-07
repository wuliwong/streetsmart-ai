import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const photoRef = searchParams.get('photoRef');

    if (!photoRef) {
        return new NextResponse('photoRef is required', { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return new NextResponse('Google Maps API key not configured', { status: 500 });
    }

    try {
        // IMPORTANT: We MUST rigidly encode the photo reference. 
        // It often contains characters like '+' and '=' which get evaluated as spaces or break the URL query parser if passed raw.
        const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(photoRef)}&key=${apiKey}`;

        // We use fetch (which automatically follows the 302 redirect from maps.googleapis.com to lh3.googleusercontent.com)
        // And then pipe the raw image buffer to the client. This hides the API Key entirely from the frontend DOM 
        // and solves the 429 Too Many Requests issue from Google tracking the user's browser IP directly.
        const response = await fetch(url);

        if (!response.ok) {
            return new NextResponse('Failed to fetch image', { status: response.status });
        }

        // Return the proxy response directly
        return new NextResponse(response.body, {
            status: 200,
            headers: {
                // Ensure it gets interpreted as an image block by the browser
                'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
                // Keep the image cached in the user's browser so panning around doesn't spam our edge proxy.
                'Cache-Control': 'public, max-age=86400'
            }
        });
    } catch (error) {
        console.error('Place Image Proxy API error:', error);
        return new NextResponse('Internal server error proxying image', { status: 500 });
    }
}
