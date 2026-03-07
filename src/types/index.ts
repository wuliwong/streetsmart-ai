// A streamlined interface representing a "Place" on our map
export interface MapPlace {
    id: string; // The unique Google Place ID
    name: string; // E.g. "Starbucks"
    address?: string; // Formatted address
    photoRef?: string;
    imageUrl?: string;
    website?: string;
    lat: number;
    lng: number;
    category: string; // E.g. "coffee", which maps to our CATEGORIES array
    rating?: number;
    userRatingsTotal?: number;
}
