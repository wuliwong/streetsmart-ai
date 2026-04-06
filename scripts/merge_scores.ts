import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const GEOCODED_FILE = path.join(DATA_DIR, 'school_rankings_geocoded.json');
const NEW_SCORES_FILE = path.join(DATA_DIR, 'school_rankings.json');
const FINAL_MERGED_FILE = path.join(DATA_DIR, 'school_rankings_merged.json');

async function main() {
    console.log('--- StreetSmarts: Merging New SES Scores with $1,600 Geocodings ---');

    console.log(`Loading new SES-Adjusted Scores...`);
    const newScoresRaw = fs.readFileSync(NEW_SCORES_FILE, 'utf-8');
    const newScoresData = JSON.parse(newScoresRaw);

    // Create a fast lookup map for the new scores using NCESSCH
    const newScoreMap = new Map();
    for (const s of newScoresData) {
        if (s.ncessch) {
            newScoreMap.set(s.ncessch, s.streetSmartsScore);
        }
    }

    console.log(`Loading Geocoded Database Target...`);
    const geocodedRaw = fs.readFileSync(GEOCODED_FILE, 'utf-8');
    const geocodedData = JSON.parse(geocodedRaw);

    let updatedCount = 0;
    for (const school of geocodedData) {
        if (school.ncessch && newScoreMap.has(school.ncessch)) {
            school.streetSmartsScore = newScoreMap.get(school.ncessch);
            updatedCount++;
        }
    }

    console.log(`Mathematical Sync Complete! Updated ${updatedCount} schools with actual vs expected delta logic.`);
    
    console.log(`Writing to new file ${FINAL_MERGED_FILE} safely...`);
    fs.writeFileSync(FINAL_MERGED_FILE, JSON.stringify(geocodedData, null, 2));

    console.log('✅ Safely merged into new file! Ready for Database Seed.');
}

main().catch(console.error);
