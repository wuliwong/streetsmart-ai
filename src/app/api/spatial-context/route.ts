import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    try {
        // Run both spatial lookups in parallel — ST_Contains checks if the point
        // falls inside any polygon in the respective boundary table
        const [districtResult, countyResult] = await Promise.all([
            pool.query(
                `SELECT geoid AS district_id, name AS district_name
                 FROM public.us_school_districts
                 WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
                 LIMIT 1`,
                [parseFloat(lng), parseFloat(lat)]
            ),
            pool.query(
                `SELECT geoid AS county_code, namelsad AS county_name, statefp AS state_fips
                 FROM public.us_counties
                 WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
                 LIMIT 1`,
                [parseFloat(lng), parseFloat(lat)]
            )
        ]);

        const district = districtResult.rows[0] || null;
        const county = countyResult.rows[0] || null;

        return NextResponse.json({
            district_id: district?.district_id || null,
            district_name: district?.district_name || null,
            county_code: county?.county_code || null,
            county_name: county?.county_name || null,
        });

    } catch (error) {
        console.error('Spatial context API error:', error);
        return NextResponse.json({ error: 'Failed to resolve spatial context' }, { status: 500 });
    }
}
