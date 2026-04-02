import { Pool } from 'pg';

if (!process.env.POSTGRES_URL) {
  throw new Error("❌ Fatal: POSTGRES_URL environment variable is missing.");
}

// Global connection pool to handle Next.js serverless micro-connections safely without exhausting Postgres
export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // Add SSL if the connection requires it (standard for Supabase/Vercel)
  ssl: process.env.POSTGRES_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});
