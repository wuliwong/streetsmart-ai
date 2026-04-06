import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId');
    const category = searchParams.get('category');

    if (!placeId) {
        return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        let websiteUrl: string | null = null;
        let ranks: any = null;

        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.status === 'OK' && detailsData.result?.website) {
            websiteUrl = detailsData.result.website;
        }

        if (category === 'schools') {
            const query = `
                WITH target AS (
                    SELECT place_id, "streetSmartsScore", state_location, school_level, county_code
                    FROM public.schools 
                    WHERE place_id = $1
                )
                SELECT 
                    t.state_location,
                    t.school_level,
                    t.county_code,
                    (SELECT COUNT(*) FROM public.schools WHERE school_level IS NOT DISTINCT FROM t.school_level) as national_total,
                    (SELECT COUNT(*) FROM public.schools WHERE school_level IS NOT DISTINCT FROM t.school_level AND "streetSmartsScore" > t."streetSmartsScore") + 1 as national_rank,
                    (SELECT COUNT(*) FROM public.schools WHERE school_level IS NOT DISTINCT FROM t.school_level AND state_location = t.state_location) as state_total,
                    (SELECT COUNT(*) FROM public.schools WHERE school_level IS NOT DISTINCT FROM t.school_level AND state_location = t.state_location AND "streetSmartsScore" > t."streetSmartsScore") + 1 as state_rank,
                    (SELECT COUNT(*) FROM public.schools WHERE school_level IS NOT DISTINCT FROM t.school_level AND county_code = t.county_code) as county_total,
                    (SELECT COUNT(*) FROM public.schools WHERE school_level IS NOT DISTINCT FROM t.school_level AND county_code = t.county_code AND "streetSmartsScore" > t."streetSmartsScore") + 1 as county_rank
                FROM target t;
            `;
            const { rows } = await pool.query(query, [placeId]);
            if (rows.length > 0) {
                const row = rows[0];
                const levels: Record<number, string> = { 1: 'Elementary', 2: 'Middle', 3: 'High' };
                ranks = {
                    stateRank: parseInt(row.state_rank, 10),
                    stateTotal: parseInt(row.state_total, 10),
                    nationalRank: parseInt(row.national_rank, 10),
                    nationalTotal: parseInt(row.national_total, 10),
                    countyRank: row.county_code ? parseInt(row.county_rank, 10) : null,
                    countyTotal: row.county_code ? parseInt(row.county_total, 10) : null,
                    schoolLevelLabel: row.school_level ? `${levels[row.school_level] || 'All'} Schools` : 'All Schools'
                };
            }
        }


        return NextResponse.json({ website: websiteUrl, ...(ranks || {}) });
    } catch (error) {
        console.error('Place Details API error:', error);
        return NextResponse.json({ error: 'Failed to fetch place details data' }, { status: 500 });
    }
}
