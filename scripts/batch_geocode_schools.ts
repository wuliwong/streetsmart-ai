import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const INPUT_FILE = path.join(DATA_DIR, 'school_rankings.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'school_rankings_geocoded.json');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("❌ Fatal: GOOGLE_MAPS_API_KEY environment variable is missing.");
  process.exit(1);
}

// Interfaces identical to generate_rankings.ts, plus our new strict place_id
interface RankedSchool {
  ncessch?: string;
  school_name: string;
  state_location: string;
  latitude: number | null;
  longitude: number | null;
  enrollment: number | null;
  teachers_fte: number | null;
  free_or_reduced_price_lunch: number | null;
  title_i_status: string | null;
  streetSmartsScore: number;
  is_private: boolean;
  place_id?: string;
}

const CONCURRENCY = 15; // Extremely safe background threshold
const SAVE_INTERVAL = 1000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function expandAbbreviations(name: string): string {
  // Expand NCES strict abbreviations into full words that Google Places' algorithm prefers
  return name
    .replace(/\bMS\b/g, 'Middle School')
    .replace(/\bHS\b/g, 'High School')
    .replace(/\bEl Sch\b/g, 'Elementary School')
    .replace(/\bEl\b/g, 'Elementary')
    .replace(/\bSch\b/g, 'School')
    .replace(/\bCS\b/g, 'Charter School');
}

async function fetchPlaceId(school: RankedSchool): Promise<string | null> {
  // Query construction targeting exact school locations with expanded abbreviations
  const queryName = expandAbbreviations(school.school_name);
  const query = `${queryName} ${school.state_location}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name&key=${API_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    
    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    } else if (data.status === 'ZERO_RESULTS') {
      return "NOT_FOUND";
    } else {
      console.warn(`⚠️ Warning for ${query}: Google API returned status ${data.status}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Network error fetching ${query}:`, error);
    return null; // Don't fail the whole script, just return null so it doesn't get marked.
  }
}

async function main() {
  console.log('--- StreetSmarts: Batch Google Places Geocoder ---');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}. (Have you run generate_rankings.ts?)`);
    process.exit(1);
  }

  // Deterministically resume from the geocoded file if it exists so we don't repeat API calls
  const workingFile = fs.existsSync(OUTPUT_FILE) ? OUTPUT_FILE : INPUT_FILE;
  console.log(`Loading dataset from: ${workingFile}`);
  
  const rawData = fs.readFileSync(workingFile, 'utf-8');
  const schools: RankedSchool[] = JSON.parse(rawData);
  
  let newlyFoundCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;

  console.log(`Analyzing ${schools.length} total schools...`);

  // Purge purely unmapped schools dynamically instead of traversing sequentially
  const unmapped = schools.filter(s => !s.place_id || (s.place_id === "" && s.place_id !== "NOT_FOUND"));

  console.log(`Starting hyper-concurrent geocoding logic bounded strictly off ${unmapped.length} untracked items natively over ${CONCURRENCY} separate threads...`);

  let currentIndex = 0;

  async function asyncWorker() {
    while (currentIndex < unmapped.length) {
      await sleep(100); // Decouple native sockets
      
      const dbIndex = currentIndex++;
      const school = unmapped[dbIndex];
      const queryName = expandAbbreviations(school.school_name);
      
      const placeId = await fetchPlaceId(school);

      if (placeId === "NOT_FOUND") {
        school.place_id = "NOT_FOUND";
        notFoundCount++;
      } else if (placeId) {
        school.place_id = placeId;
        newlyFoundCount++;
      } else {
        errorsCount++;
      }

      const totalProcessed = newlyFoundCount + notFoundCount + errorsCount;

      // Aggressive Auto-Saving natively without thread racing overlapping
      if (totalProcessed > 0 && totalProcessed % SAVE_INTERVAL === 0) {
        process.stdout.write(`\n💾 Auto-saving checkpoint safely... [${totalProcessed} / ${unmapped.length}] (Found: ${newlyFoundCount})\n`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schools, null, 2));
      }
    }
  }

  // Construct worker threads autonomously to fire immediately
  const workers = Array(CONCURRENCY).fill(0).map(asyncWorker);
  await Promise.all(workers);

  // Final definitive save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(schools, null, 2));
  
  console.log('\n--- Geocoding Complete ---');
  console.log(`Skipped (Already Processed): ${skippedCount}`);
  console.log(`Newly Bound Place IDs: ${newlyFoundCount}`);
  console.log(`Unmatched (Zero Results): ${notFoundCount}`);
  console.log(`Runtime Errors: ${errorsCount}`);
  console.log(`Saved output to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
