// Haversine formula to calculate distance between two coordinates
export function calculateDistanceStr(lat1: number, lon1: number, lat2: number, lon2: number): { meters: number; milesStr: string } {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceMeters = R * c;
    const distanceMiles = distanceMeters * 0.000621371;

    return {
        meters: distanceMeters,
        milesStr: distanceMiles < 0.1 ? 'Under 0.1 mi' : `${distanceMiles.toFixed(1)} mi`
    };
}

// Approximate ETA based on straight-line distance and travel mode
// Walking average: ~1.4 meters per second (~3.1 mph)
// City driving average with lights (straight-line equivalent): ~6 meters per second (~13 mph)
export function estimateETA(distanceMeters: number, mode: 'walking' | 'driving'): string {
    const speedMs = mode === 'walking' ? 1.4 : 6.0;
    const seconds = distanceMeters / speedMs;
    const minutes = Math.ceil(seconds / 60);

    if (minutes > 60) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes} min`;
}
