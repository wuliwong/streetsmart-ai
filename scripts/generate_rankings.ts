import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const OUT_FILE = path.join(DATA_DIR, 'school_rankings.json');

interface RawSchoolData {
  ncessch: string;
  leaid: string | null;
  school_name: string;
  state_location: string;
  county_code: string | null;
  latitude: number | null;
  longitude: number | null;
  enrollment: number | null;
  teachers_fte: number | null;
  free_or_reduced_price_lunch: number | null;
  title_i_status: string | null;
}

interface RankedSchool extends RawSchoolData {
  is_private: boolean;
  frl_percentage: number | null;
  // Academic data — exactly one of these will be populated per school
  math_proficiency: number | null;       // elementary/middle: EdFacts grades 3-8
  reading_proficiency: number | null;    // elementary/middle: EdFacts grades 3-8
  grad_rate: number | null;              // high school: EdFacts grad rates
  // Absenteeism
  chronic_absenteeism_rate: number | null; // CRDC: absent count / enrollment
  // Scoring internals
  expected_proficiency: number | null;
  proficiency_delta: number | null;
  streetSmartsScore: number;
}

// ─── Data Loaders ────────────────────────────────────────────────────────────

function loadProficiency(): Map<string, { math: number | null; reading: number | null }> {
  const filePath = path.join(DATA_DIR, 'edfacts_proficiency_2018.json');
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  edfacts_proficiency_2018.json not found — elementary/middle schools will use FRL proxy.');
    console.warn('   Run: npx tsx scripts/download_edfacts.ts');
    return new Map();
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const map = new Map<string, { math: number | null; reading: number | null }>();
  for (const [ncessch, scores] of Object.entries(raw) as any[]) {
    map.set(ncessch, { math: scores.math_proficiency, reading: scores.reading_proficiency });
  }
  console.log(`   Proficiency data: ${map.size.toLocaleString()} schools`);
  return map;
}

function loadGradRates(): Map<string, number> {
  const filePath = path.join(DATA_DIR, 'edfacts_grad_rates_2019.json');
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  edfacts_grad_rates_2018.json not found — high schools will use FRL proxy.');
    return new Map();
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const map = new Map<string, number>();
  for (const [ncessch, rate] of Object.entries(raw) as any[]) {
    map.set(ncessch, rate as number);
  }
  console.log(`   Grad rate data:   ${map.size.toLocaleString()} schools`);
  return map;
}

function loadAbsenteeism(): Map<string, number> {
  const filePath = path.join(DATA_DIR, 'crdc_absenteeism_2022.json');
  if (!fs.existsSync(filePath)) {
    console.warn('⚠️  crdc_absenteeism_2017.json not found — absenteeism pillar will use neutral fallback.');
    return new Map();
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const map = new Map<string, number>();
  for (const [ncessch, count] of Object.entries(raw) as any[]) {
    map.set(ncessch, count as number);
  }
  console.log(`   Absenteeism data: ${map.size.toLocaleString()} schools`);
  return map;
}

// ─── Scoring Algorithm ────────────────────────────────────────────────────────
//
//  PILLAR 1 — Academic Quality (SES-adjusted)   50 pts
//  PILLAR 2 — Chronic Absenteeism               20 pts
//  PILLAR 3 — Student-Teacher Ratio             20 pts
//  PILLAR 4 — Resource Context (Title I)        10 pts
//  TOTAL                                       100 pts
//
//  Enrollment health removed — not a meaningful quality signal for parents.
//  Academic dominates because that's what parents and press care about most.
//  Absenteeism elevated because it's a strong school culture/safety proxy
//  and is easy to explain: "a school where kids actually show up."

function deterministicJitter(nces: string): number {
  if (!nces) return 0;
  let hash = 0;
  for (let i = 0; i < nces.length; i++) hash = ((hash << 5) - hash) + nces.charCodeAt(i);
  return (Math.abs(hash) % 10) - 5; // ± 5
}

function calculateRanking(school: RankedSchool, expectationCurve: Map<number, number>): RankedSchool {
  let score = 0;

  // Compute FRL percentage
  if (school.enrollment && school.enrollment > 0 && school.free_or_reduced_price_lunch != null) {
    school.frl_percentage = Math.min(100, (school.free_or_reduced_price_lunch / school.enrollment) * 100);
  } else {
    school.frl_percentage = null;
  }

  // ── PILLAR 1: Academic Quality — SES-adjusted (50 pts) ──────────────────
  if (school.math_proficiency !== null || school.reading_proficiency !== null) {
    // Elementary / middle: actual proficiency vs SES expectation
    const actualProf = ((school.math_proficiency ?? 50) + (school.reading_proficiency ?? 50)) / 2;
    const frlBucket = school.frl_percentage !== null ? Math.floor(school.frl_percentage / 10) * 10 : 50;
    const expectedProf = expectationCurve.get(frlBucket) ?? 50;
    school.expected_proficiency = expectedProf;
    school.proficiency_delta = actualProf - expectedProf;
    // Center at 25 (midpoint of 50). ±20 pt proficiency delta = ±25 pts score swing.
    score += Math.max(0, Math.min(50, 25 + school.proficiency_delta * 1.25));

  } else if (school.grad_rate !== null) {
    // High school: graduation rate vs SES expectation
    const frlBucket = school.frl_percentage !== null ? Math.floor(school.frl_percentage / 10) * 10 : 50;
    const expectedGradRate = Math.max(55, 95 - frlBucket * 0.3);
    const gradDelta = school.grad_rate - expectedGradRate;
    school.expected_proficiency = expectedGradRate;
    school.proficiency_delta = gradDelta;
    score += Math.max(0, Math.min(50, 25 + gradDelta * 0.7));

  } else if (school.frl_percentage !== null) {
    // No real data: FRL proxy (0% FRL → 50 pts, 100% FRL → 0 pts)
    const frlScore = 50 * (1 - school.frl_percentage / 100);
    score += Math.max(0, Math.min(50, frlScore + deterministicJitter(school.ncessch) * 0.4));
    school.expected_proficiency = null;
    school.proficiency_delta = null;

  } else {
    score += 25 + deterministicJitter(school.ncessch) * 0.5;
    school.expected_proficiency = null;
    school.proficiency_delta = null;
  }

  // ── PILLAR 2: Chronic Absenteeism (20 pts) ───────────────────────────────
  // Strong school culture/safety proxy. Easy parent narrative: kids showing up.
  // 0% absent → 20 pts, 25%+ absent → 0 pts (linear decay)
  if (school.chronic_absenteeism_rate !== null && school.chronic_absenteeism_rate >= 0) {
    score += Math.max(0, Math.min(20, 20 * (1 - school.chronic_absenteeism_rate / 25)));
  } else {
    score += 10; // neutral fallback
  }

  // ── PILLAR 3: Student-Teacher Ratio (20 pts) ─────────────────────────────
  if (school.enrollment && school.teachers_fte && school.teachers_fte > 0) {
    const ratio = school.enrollment / school.teachers_fte;
    const penaltyRatio = Math.max(0, ratio - 12);
    score += Math.max(0, Math.min(20, 20 * Math.exp(-0.12 * penaltyRatio)));
  } else {
    score += 10; // median fallback
  }

  // ── PILLAR 4: Resource Context — Title I (10 pts) ────────────────────────
  // Captures funding/resource availability beyond what FRL% already models.
  const titleI = school.title_i_status != null ? String(school.title_i_status) : null;
  if (titleI === 'Not Title I' || titleI === '6') {
    score += 10;
  } else if (titleI === '5') {
    score += 4;  // Schoolwide — concentrated poverty, fewest discretionary resources
  } else if (titleI != null) {
    score += 7;  // Targeted Assistance
  } else {
    score += 7;
  }

  school.streetSmartsScore = Math.max(0, Math.min(100, Math.round(score)));
  return school;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌟 StreetSmarts Ranking Engine — 5-Pillar SES-Adjusted Scoring\n');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Phase 1: Load local geocoded base data
  console.log('📦 Phase 1: Loading geocoded school base data');
  const geocodedPath = path.join(DATA_DIR, 'school_rankings_geocoded.json');
  if (!fs.existsSync(geocodedPath)) {
    throw new Error('Fatal: school_rankings_geocoded.json not found in src/data/');
  }
  const rawData = JSON.parse(fs.readFileSync(geocodedPath, 'utf8'));
  console.log(`   Loaded ${rawData.length.toLocaleString()} schools from disk.\n`);

  // Phase 2: Load academic + absenteeism data
  console.log('📚 Phase 2: Loading academic and attendance datasets');
  const proficiencyMap = loadProficiency();
  const gradRateMap    = loadGradRates();
  const absenteeismMap = loadAbsenteeism();
  console.log('');

  // Phase 3: Build expectation curve (FRL → expected proficiency)
  console.log('📈 Phase 3: Building SES expectation curve');
  const expectationCurve = new Map<number, number>();
  for (let frl = 0; frl <= 100; frl += 10) {
    expectationCurve.set(frl, Math.max(30, 80 - frl * 0.35));
  }

  // Phase 4: Attach data and build school objects
  console.log('🔗 Phase 4: Attaching real data to schools');
  let profHits = 0, gradHits = 0, absentHits = 0;

  const allSchools: RankedSchool[] = rawData.map((school: any): RankedSchool => {
    const ncessch = school.ncessch ?? '';
    const enrollment = school.enrollment ?? null;

    // Proficiency (elementary/middle)
    const prof = proficiencyMap.get(ncessch);
    const math_proficiency = prof?.math ?? null;
    const reading_proficiency = prof?.reading ?? null;
    if (prof) profHits++;

    // Grad rate (high school) — only use if no proficiency data
    const grad_rate = (!prof && gradRateMap.has(ncessch)) ? (gradRateMap.get(ncessch) ?? null) : null;
    if (grad_rate !== null) gradHits++;

    // Absenteeism rate = absent count / enrollment
    let chronic_absenteeism_rate: number | null = null;
    const absentCount = absenteeismMap.get(ncessch);
    if (absentCount != null && enrollment && enrollment > 0) {
      chronic_absenteeism_rate = Math.min(100, (absentCount / enrollment) * 100);
      absentHits++;
    }

    return {
      ...school,
      is_private: school.is_private ?? false,
      frl_percentage: null,
      math_proficiency,
      reading_proficiency,
      grad_rate,
      chronic_absenteeism_rate,
      expected_proficiency: null,
      proficiency_delta: null,
      streetSmartsScore: 0,
    };
  });

  const total = allSchools.length;
  console.log(`   Real proficiency (elem/middle): ${profHits.toLocaleString()} / ${total.toLocaleString()} schools`);
  console.log(`   Real grad rates (high school):  ${gradHits.toLocaleString()} / ${total.toLocaleString()} schools`);
  console.log(`   Real absenteeism rate:          ${absentHits.toLocaleString()} / ${total.toLocaleString()} schools`);
  console.log(`   FRL proxy (no academic data):   ${(total - profHits - gradHits).toLocaleString()} / ${total.toLocaleString()} schools\n`);

  // Phase 5: Score every school
  console.log('🧠 Phase 5: Computing StreetSmarts scores');
  const ranked = allSchools.map(school => calculateRanking(school, expectationCurve));

  // Phase 6: Sort and write
  ranked.sort((a, b) => b.streetSmartsScore - a.streetSmartsScore);
  fs.writeFileSync(OUT_FILE, JSON.stringify(ranked, null, 2));

  const scores = ranked.map(s => s.streetSmartsScore);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const min = scores[scores.length - 1];
  const max = scores[0];
  console.log(`\n✅ Scored ${ranked.length.toLocaleString()} schools`);
  console.log(`   Score range: ${min}–${max}  |  Average: ${avg}`);
  console.log(`🚀 Output: ${OUT_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
