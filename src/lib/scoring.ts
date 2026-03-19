import { calculateDistanceStr, estimateTimeSeconds } from '@/lib/distance';
import type { MapPlace } from '@/types';

export interface ScoreDetails {
  totalScore: number;
  densityScore: number;
  qualityScore: number;
  proximityScore: number;
}

// Helper to calculate score for a SINGLE category
function calculateCategoryScore(
  searchLocation: { lat: number; lng: number },
  places: MapPlace[],
  travelMode: 'walking' | 'driving' | 'transit'
): ScoreDetails {
  if (places.length === 0) {
    return { totalScore: 0, densityScore: 0, qualityScore: 0, proximityScore: 0 };
  }

  // Pre-calculate travel times for all places
  const placesWithTime = places.map(p => {
    const distMeters = calculateDistanceStr(searchLocation.lat, searchLocation.lng, p.lat, p.lng).meters;
    const timeSeconds = estimateTimeSeconds(distMeters, travelMode);
    return { ...p, timeMins: timeSeconds / 60 };
  });

  // 1. Density Score (Max 35 points)
  let densityUtility = 0;
  placesWithTime.forEach(p => {
    // Cap minimum time at 1 minute so a place next door is extremely good but not infinity
    const timeMins = Math.max(p.timeMins, 1);
    densityUtility += 10 / timeMins;
  });

  // 10 utility (e.g., 5 places, 5 mins away avg) -> 35 * (1 - e^(-0.2 * 10)) = 35 * (1 - 0.135) = 30 points
  const k = 0.2; 
  const rawDensityScore = 35 * (1 - Math.exp(-k * densityUtility));
  const densityScore = Math.min(35, rawDensityScore);

  // 2. Quality Score (Max 35 points)
  let totalRatingWeight = 0;
  let weightedRatingSum = 0;

  placesWithTime.forEach(p => {
    if (p.rating && p.userRatingsTotal && p.userRatingsTotal > 0) {
      const weight = Math.log10(p.userRatingsTotal + 1);
      weightedRatingSum += p.rating * weight;
      totalRatingWeight += weight;
    }
  });

  const avgRating = totalRatingWeight > 0 ? (weightedRatingSum / totalRatingWeight) : 3.0;
  const qualityScore = Math.min(35, (avgRating / 5.0) * 35);

  // 3. Proximity Score (Max 30 points)
  // Average travel time of the closest 3 places in this category
  const numToEvaluate = Math.max(3, Math.min(placesWithTime.length, 5));
  const closestPlaces = [...placesWithTime].sort((a, b) => a.timeMins - b.timeMins).slice(0, numToEvaluate);
  
  const sumClosestTime = closestPlaces.reduce((sum, p) => sum + p.timeMins, 0);
  const avgClosestTime = closestPlaces.length > 0 ? (sumClosestTime / closestPlaces.length) : 60;

  // Linear decay for the closest options. Ideal is < 5 mins. Zero points if > 45 mins.
  const proximityRatio = Math.max(0, 1 - (avgClosestTime / 45));
  const proximityScore = 30 * proximityRatio;

  const totalScore = Math.floor(densityScore + qualityScore + proximityScore);

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    densityScore,
    qualityScore,
    proximityScore
  };
}

/**
 * Calculates a personalized "StreetSmarts Score" (0-100) using a Gravity Utility Model by Category and Travel Time.
 */
export function calculateStreetSmartsScore(
  searchLocation: { lat: number; lng: number } | null,
  places: MapPlace[],
  activeCategories: string[],
  travelMode: 'walking' | 'driving' | 'transit'
): ScoreDetails | null {
  if (!searchLocation || activeCategories.length === 0 || places.length === 0) {
    return null;
  }

  let sumTotal = 0;
  let sumDensity = 0;
  let sumQuality = 0;
  let sumProximity = 0;

  activeCategories.forEach(categoryId => {
    const categoryPlaces = places.filter(p => p.category === categoryId);
    const score = calculateCategoryScore(searchLocation, categoryPlaces, travelMode);
    
    sumTotal += score.totalScore;
    sumDensity += score.densityScore;
    sumQuality += score.qualityScore;
    sumProximity += score.proximityScore;
  });

  const count = activeCategories.length;

  return {
    totalScore: Math.round(sumTotal / count),
    densityScore: Math.round(sumDensity / count),
    qualityScore: Math.round(sumQuality / count),
    proximityScore: Math.round(sumProximity / count)
  };
}
