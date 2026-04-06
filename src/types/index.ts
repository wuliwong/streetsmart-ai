// A streamlined interface representing a "Place" on our map
export interface MapPlace {
    id: string; // The unique Google Place ID
    name: string; // E.g. "Starbucks"
    address?: string; // Formatted address or vicinity
    placeTypes?: string[]; // Raw Google place types e.g. ["subway_station", "transit_station"]
    photoRef?: string;
    imageUrl?: string;
    website?: string;
    lat: number;
    lng: number;
    category: string; // E.g. "coffee", which maps to our CATEGORIES array
    rating?: number;
    userRatingsTotal?: number;
    streetSmartsScore?: number;
    in_district?: boolean; // True if this school is in the user's resolved school district

    // Custom School Ranking Extensions
    stateRank?: number;
    stateTotal?: number;
    nationalRank?: number;
    nationalTotal?: number;
    countyRank?: number;
    countyTotal?: number;
    schoolLevelLabel?: string;
}
