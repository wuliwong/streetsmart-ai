/**
 * One-time EdFacts + CRDC Downloader
 *
 *  1. EdFacts assessments 2018 (grades 3-8)  → edfacts_proficiency_2018.json
 *  2. EdFacts grad-rates 2018                → edfacts_grad_rates_2018.json
 *  3. CRDC chronic-absenteeism 2017          → crdc_absenteeism_2017.json
 *
 * Safe to re-run — skips any dataset whose output file already exists.
 * Run once: npx tsx scripts/download_edfacts.ts
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const OFFSET_SIZE  = 200;    // records per request — tiny so nothing ever times out
const DELAY_REQ_MS = 1500;   // between every single request — consistent throttle we control

// All 50 states + DC
const ALL_FIPS = [
  '01','02','04','05','06','08','09','10','11','12','13','15','16','17','18',
  '19','20','21','22','23','24','25','26','27','28','29','30','31','32','33',
  '34','35','36','37','38','39','40','41','42','44','45','46','47','48','49',
  '50','51','53','54','55','56'
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchPage(url: string): Promise<{ count: number; results: any[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { count: data.count ?? 0, results: data.results ?? [] };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Drain all records for one FIPS using offset pagination.
// Each request fetches OFFSET_SIZE records. We know total from the first call.
// DELAY_REQ_MS between every request — we control the throttle completely.
async function drainFips(
  baseUrl: string,
  fips: string,
  onPage: (results: any[]) => void
): Promise<void> {
  const first = await fetchPage(`${baseUrl}&fips=${fips}&limit=${OFFSET_SIZE}&offset=0`);
  onPage(first.results);
  const total = first.count;
  for (let offset = OFFSET_SIZE; offset < total; offset += OFFSET_SIZE) {
    await delay(DELAY_REQ_MS);
    const { results } = await fetchPage(`${baseUrl}&fips=${fips}&limit=${OFFSET_SIZE}&offset=${offset}`);
    onPage(results);
  }
}

async function paginateByState(
  baseUrl: string,
  onPage: (results: any[]) => void
): Promise<void> {
  for (let i = 0; i < ALL_FIPS.length; i++) {
    const fips = ALL_FIPS[i];
    await delay(DELAY_REQ_MS); // uniform delay before every state too
    try {
      await drainFips(baseUrl, fips, onPage);
      process.stdout.write(i === 0 ? `    FIPS ${fips}` : ` ${fips}`);
    } catch (err: any) {
      process.stdout.write(` [${fips}:ERR]`);
    }
  }
  console.log(' ✓');
}

// ─── 1. EdFacts Proficiency (grades 3–8) ───────────────────────────────────

async function downloadProficiency(): Promise<void> {
  const OUT = path.join(DATA_DIR, 'edfacts_proficiency_2018.json');
  if (fs.existsSync(OUT)) {
    const count = Object.keys(JSON.parse(fs.readFileSync(OUT, 'utf8'))).length;
    console.log(`\n📚 [1/3] Proficiency — already downloaded (${count.toLocaleString()} schools). Skipping.`);
    return;
  }
  console.log('\n📚 [1/3] EdFacts Assessments 2018 (grades 3–8)');

  const GRADES = ['grade-3', 'grade-4', 'grade-5', 'grade-6', 'grade-7', 'grade-8'];
  const mathVals: Record<string, number[]> = {};
  const readVals: Record<string, number[]> = {};

  const processRows = (results: any[]) => {
    for (const row of results) {
      if (!row.ncessch) continue;
      const math = row.math_test_pct_prof_midpt;
      const read = row.read_test_pct_prof_midpt;
      if (math != null && math >= 0) { mathVals[row.ncessch] = mathVals[row.ncessch] ?? []; mathVals[row.ncessch].push(math); }
      if (read != null && read >= 0) { readVals[row.ncessch] = readVals[row.ncessch] ?? []; readVals[row.ncessch].push(read); }
    }
  };

  for (const grade of GRADES) {
    console.log(`  Fetching ${grade}...`);
    const base = `https://educationdata.urban.org/api/v1/schools/edfacts/assessments/2018/${grade}/?`;
    await paginateByState(base, processRows);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const output: Record<string, { math_proficiency: number | null; reading_proficiency: number | null }> = {};
  for (const ncessch of new Set([...Object.keys(mathVals), ...Object.keys(readVals)])) {
    output[ncessch] = { math_proficiency: avg(mathVals[ncessch] ?? []), reading_proficiency: avg(readVals[ncessch] ?? []) };
  }
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${Object.keys(output).length.toLocaleString()} schools → ${OUT}`);
}

// ─── 2. EdFacts Graduation Rates ───────────────────────────────────────────

async function downloadGradRates(): Promise<void> {
  const OUT = path.join(DATA_DIR, 'edfacts_grad_rates_2019.json');
  if (fs.existsSync(OUT)) {
    const count = Object.keys(JSON.parse(fs.readFileSync(OUT, 'utf8'))).length;
    console.log(`\n🎓 [2/3] Grad rates — already downloaded (${count.toLocaleString()} schools). Skipping.`);
    return;
  }
  console.log('\n🎓 [2/3] EdFacts Graduation Rates 2018');

  const best: Record<string, { rate: number; cohort: number }> = {};
  const processRows = (results: any[]) => {
    for (const row of results) {
      if (!row.ncessch) continue;
      const rate = row.grad_rate_midpt;
      const cohort = row.cohort_num;
      if (rate == null || rate < 0 || cohort == null || cohort < 0) continue;
      if (!best[row.ncessch] || cohort > best[row.ncessch].cohort) {
        best[row.ncessch] = { rate, cohort };
      }
    }
  };

  // Filter to all-students aggregate rows only — cuts records per state ~4x vs full demographic breakdown
  const base = `https://educationdata.urban.org/api/v1/schools/edfacts/grad-rates/2019/?race=99&disability=99&econ_disadvantaged=99&lep=99&foster_care=99&homeless=99&`;
  console.log('  Fetching all-students rows by state...');
  await paginateByState(base, processRows);

  const output: Record<string, number> = {};
  for (const [ncessch, { rate }] of Object.entries(best)) output[ncessch] = rate;
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${Object.keys(output).length.toLocaleString()} schools → ${OUT}`);
}

// ─── 3. CRDC Chronic Absenteeism ───────────────────────────────────────────

async function downloadAbsenteeism(): Promise<void> {
  const OUT = path.join(DATA_DIR, 'crdc_absenteeism_2022.json');
  if (fs.existsSync(OUT)) {
    const count = Object.keys(JSON.parse(fs.readFileSync(OUT, 'utf8'))).length;
    console.log(`\n📋 [3/3] Absenteeism — already downloaded (${count.toLocaleString()} schools). Skipping.`);
    return;
  }
  console.log('\n📋 [3/3] CRDC Chronic Absenteeism 2017');

  const output: Record<string, number> = {};
  const processRows = (results: any[]) => {
    for (const row of results) {
      if (!row.ncessch) continue;
      const count = row.students_chronically_absent;
      if (count != null && count >= 0) output[row.ncessch] = count;
    }
  };

  const base = `https://educationdata.urban.org/api/v1/schools/crdc/chronic-absenteeism/2022/?race=99&sex=99&disability=99&lep=99&homeless=99&`;
  console.log('  Fetching by state...');
  await paginateByState(base, processRows);

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`  ✅ ${Object.keys(output).length.toLocaleString()} schools → ${OUT}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('📥 EdFacts + CRDC Downloader');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  await downloadProficiency();
  await downloadGradRates();
  await downloadAbsenteeism();

  console.log('\n✅ All downloads complete. Run generate_rankings.ts next.');
}

main().catch(e => { console.error(e); process.exit(1); });
