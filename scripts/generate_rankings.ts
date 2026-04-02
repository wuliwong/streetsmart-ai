import fs from 'fs';
import path from 'path';

// Seed file destination
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const OUT_FILE = path.join(DATA_DIR, 'school_rankings.json');

// Interface based on typical CCD directory data + our custom score
interface RawSchoolData {
  ncessch?: string;
  school_name: string;
  state_location: string;
  latitude: number | null;
  longitude: number | null;
  enrollment: number | null;
  teachers_fte: number | null;
  free_or_reduced_price_lunch: number | null;
  title_i_status: string | null;
}

interface RankedSchool extends RawSchoolData {
  streetSmartsScore: number;
  is_private: boolean;
}

/**
 * Custom StreetSmarts Ranking Algorithm: 0-100 Score
 * Weights:
 * - Student/Teacher Ratio (30%): Ideal is ~15:1. Higher ratio = lower score.
 * - Title I / FRL (20%): Contextual proxy.
 * - Enrollment Health (10%): If missing or 0, penalize.
 * - (Mock) Subject Scores (40%): Since state assessments are in a separate dataset,
 *   we use a randomized normal curve proxy for seed data until linked.
 */
function calculateRanking(school: RawSchoolData): number {
  let score = 0;

  // 1. Student-Teacher Ratio (0-30 points)
  if (school.enrollment && school.teachers_fte && school.teachers_fte > 0) {
    const ratio = school.enrollment / school.teachers_fte;
    if (ratio <= 12) score += 30;
    else if (ratio <= 16) score += 25;
    else if (ratio <= 20) score += 15;
    else if (ratio <= 25) score += 5;
  } else {
    // Missing data gets median score
    score += 15;
  }

  // 2. Need Proxy via FRL (0-20 points)
  // Higher FRL percentage often correlates with funding needs. We reward lower FRL slightly higher for pure "academic" proxy,
  // but this can be tuned based on StreetSmarts philosophy (e.g. rewarding well-funded or need-based areas).
  // For now, baseline 15 points, ±5 based on known data.
  score += 15;

  // 3. Enrollment Health (0-10 points)
  if (school.enrollment && school.enrollment > 200) {
    score += 10;
  } else if (school.enrollment && school.enrollment > 50) {
    score += 5;
  }

  // 4. Academic Performance Proxy (0-40 points)
  // TODO: Link `edfacts` endpoint here. For seed data, inject a plausible base score 25-40
  score += 25 + Math.floor(Math.random() * 15);

  return Math.max(0, Math.min(100, score));
}

async function fetchSchools(stateCode = '42', year = '2021', limit = 4000) {
  const url = `https://educationdata.urban.org/api/v1/schools/ccd/directory/${year}/?fips=${stateCode}&limit=${limit}`;
  console.log(`Fetching from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StreetSmarts-Seed-Generator/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results as RawSchoolData[];
  } catch (error) {
    console.error('Failed to fetch from Urban Institute API:', error);
    return [];
  }
}

async function fetchPrivateSchools(stateCode = '36', year = '2017', limit = 100) {
  const url = `https://educationdata.urban.org/api/v1/schools/pss/directory/${year}/?fips=${stateCode}&limit=${limit}`;
  console.log(`Fetching from PSS (Private): ${url}`);
  
  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.results as RawSchoolData[];
  } catch (error) {
    console.error('Failed to fetch from PSS API:', error);
    return [];
  }
}

async function main() {
  console.log('--- StreetSmarts Ranking Generator: NATIONAL SEED ---');
  
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Array of all State FIPS codes for national injection
  const stateFips = [
    '01', '02', '04', '05', '06', '08', '09', '10', '11', '12', '13', '15',
    '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27',
    '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
    '40', '41', '42', '44', '45', '46', '47', '48', '49', '50', '51', '53',
    '54', '55', '56'
  ];

  console.log('Fetching public seed data (National)...');
  
  // Parallel fetch states in batches of 5 to avoid overwhelming the Urban Institute API
  const rawPublicSchools: RawSchoolData[] = [];
  const batchSize = 5;
  for (let i = 0; i < stateFips.length; i += batchSize) {
      const batch = stateFips.slice(i, i + batchSize);
      console.log(`Fetching states batch ${i/batchSize + 1} of ${Math.ceil(stateFips.length/batchSize)}...`);
      const results = await Promise.all(batch.map(fips => fetchSchools(fips, '2021', 15000))); // Huge limit per state
      results.forEach(stateData => rawPublicSchools.push(...stateData));
  }

  console.log('Fetching private seed data (National - skipping due to UI 404)...');
  const rawPrivateSchools: RawSchoolData[] = []; 

  console.log(`Processing ${rawPublicSchools.length} public and ${rawPrivateSchools.length} private schools...`);
  
  const rankedPublic: RankedSchool[] = rawPublicSchools.map(school => ({
    ...school,
    is_private: false,
    streetSmartsScore: calculateRanking(school)
  }));

  const rankedPrivate: RankedSchool[] = rawPrivateSchools.map(school => ({
    ...school,
    is_private: true,
    streetSmartsScore: calculateRanking(school)
  }));

  const mergedSchools = [...rankedPublic, ...rankedPrivate];
  mergedSchools.sort((a, b) => b.streetSmartsScore - a.streetSmartsScore);

  fs.writeFileSync(OUT_FILE, JSON.stringify(mergedSchools, null, 2));
  
  console.log(`✅ Successfully generated rankings for ${mergedSchools.length} total schools!`);
  console.log(`📁 Saved to: ${OUT_FILE}`);
  console.log('--- Complete ---');
}

main().catch(console.error);
