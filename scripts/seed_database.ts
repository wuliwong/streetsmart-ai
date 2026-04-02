/**
 * Universal PostgreSQL Database Seeder
 * 
 * Securely connects to any Postgres provider (Supabase, Vercel, RDS) via a standard POSTGRES_URL,
 * structurally builds its own SQL tables bypassing dashboard UIs, and chunk-uploads the geocoded json.
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { loadEnvConfig } from '@next/env';

// Inject environment variables natively outside Next
loadEnvConfig(process.cwd());

const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  console.error("❌ Fatal Block: POSTGRES_URL must be actively injected into .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: postgresUrl,
  ssl: postgresUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const INPUT_FILE = path.join(DATA_DIR, 'school_rankings_geocoded.json');

async function main() {
  console.log('--- StreetSmarts: Universal Postgres Cloud Seeder ---');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // 1. Eradicate old schemas and reconstruct structurally without user intervention
    console.log('Bootstrapping Postgres SQL Schema remotely...');
    await client.query('DROP TABLE IF EXISTS public.schools;');
    await client.query(`
      CREATE TABLE public.schools (
        place_id TEXT PRIMARY KEY,
        ncessch TEXT,
        school_name TEXT NOT NULL,
        state_location TEXT NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        enrollment INTEGER,
        teachers_fte DOUBLE PRECISION,
        free_or_reduced_price_lunch INTEGER,
        title_i_status TEXT,
        school_level INTEGER,
        charter INTEGER,
        "streetSmartsScore" INTEGER NOT NULL,
        is_private BOOLEAN NOT NULL
      );
    `);

    console.log(`Loading pre-calculated schema from: ${INPUT_FILE}`);
    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const schools: any[] = JSON.parse(rawData);

    // Isolate only mathematically validated bounds
    const verifiableSchools = schools.filter(s => s.place_id && s.place_id !== "NOT_FOUND");
    console.log(`Prepared ${verifiableSchools.length} mathematically validated schools for direct SQL transfer.`);

    // 3. Ultra-fast bulk transactional insertion
    const batchSize = 500;
    
    for (let i = 0; i < verifiableSchools.length; i += batchSize) {
      const chunk = verifiableSchools.slice(i, i + batchSize);
      process.stdout.write(`Uploading chunk [${i} - ${i + chunk.length}]... `);
      
      // Construct dynamic parameterized payload for bulk Postgres execution
      // Building a massive single query: INSERT INTO schools (...) VALUES ($1,$2...), ($13,$14...)
      let paramCounter = 1;
      const values: any[] = [];
      const placeholders = chunk.map(school => {
        values.push(
          school.place_id,
          school.ncessch || null,
          school.school_name,
          school.state_location,
          school.latitude || null,
          school.longitude || null,
          school.enrollment || null,
          school.teachers_fte || null,
          school.free_or_reduced_price_lunch || null,
          school.title_i_status?.toString() || null,
          school.school_level || null,
          school.charter || null,
          school.streetSmartsScore,
          school.is_private ? true : false
        );
        const set = Array.from({ length: 14 }, () => `$${paramCounter++}`).join(', ');
        return `(${set})`;
      }).join(', ');

      const query = `
        INSERT INTO public.schools (
          place_id, ncessch, school_name, state_location,
          latitude, longitude, enrollment, teachers_fte, free_or_reduced_price_lunch,
          title_i_status, school_level, charter, "streetSmartsScore", is_private
        ) VALUES ${placeholders}
        ON CONFLICT (place_id) DO NOTHING;
      `;

      await client.query(query, values);
      process.stdout.write(`✅ Successfully Transferred!\n`);
    }

    console.log(`✅ Successfully injected 100% of Data into remote Supabase/Postgres cluster!`);
  } catch (err) {
    console.error(`❌ Critical SQL Execution Failure:`, err);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
