# StreetSmarts Scoring — Roadmap & Future Data Improvements

## Current State (v1 — April 2026)

### Algorithm (4 Pillars, 100 pts)
| Pillar | Weight | Data Source | Coverage |
|---|---|---|---
| Academic Quality (SES-adjusted) | 50 pts | EdFacts 2018 (grades 3–8 proficiency) + grad rates | 69,523 elem/middle + 15,385 high schools |
| Chronic Absenteeism | 20 pts | CRDC 2017 | 86,476 schools |
| Student-Teacher Ratio | 20 pts | CCD 2021 (local geocoded file) | ~99k schools |
| Resource Context (Title I) | 10 pts | CCD 2021 (local geocoded file) | ~99k schools |

**Total schools in DB:** 83,967
**Score range:** 15–97 | **Average:** 54
**Data vintage:** 2017–2018 federal reporting year (pre-COVID)

### Key Differentiator
Academic scores are **SES-adjusted** — schools are scored against the expected proficiency for their poverty level (FRL%), not against a flat national baseline. A high-poverty school that outperforms its demographic expectation ranks above an affluent school that merely meets expectations. This is what GreatSchools was publicly criticized for not doing and had to retrofit.

---

## What to Add (Priority Order)

---

### Priority 1 — Fresher Data (High Impact, Low Effort)

**Problem:** 2018 data is pre-COVID. Test scores, grad rates, and absenteeism shifted dramatically 2020–2023. A parent looking at a score today is looking at a school from 6 years ago.

**What to do:**
- Re-run `download_edfacts.ts` targeting the latest available year. As of 2026, EdFacts likely has 2022 or 2023 assessment data available.
- Test the API: replace `2018` with `2022` or `2023` in the grade-level assessment URLs and check if they return data without 500 errors.
- Update `CRDC_YEAR` to 2021 (CRDC runs on 2-year cycles; 2021 data exists).
- Once confirmed working, update the year constants in `download_edfacts.ts` and re-run the full pipeline.

**Effort:** 1–2 hours (mostly API testing).
**Impact:** Massive credibility improvement. Eliminates the most obvious critic attack vector.

---

### Priority 2 — High School Coverage (High Impact, Moderate Effort)

**Problem:** Only 15,385 of ~30k high schools have real graduation rate data. The rest fall back to FRL proxy, which is a demographic signal, not a school quality signal.

**Root cause:** Many states' grad rate data failed during download due to API quirks — not missing data.

**What to do:**
1. Check which states are missing from `edfacts_grad_rates_2018.json` (compare ncessch FIPS prefixes to `ALL_FIPS`).
2. For missing states, attempt direct URL test: `https://educationdata.urban.org/api/v1/schools/edfacts/grad-rates/2018/?fips=XX&race=99&...&limit=1`
3. If data exists, reduce `OFFSET_SIZE` to 50 and increase `DELAY_REQ_MS` to 3000 for a targeted retry of only those states.

**Longer term:** Add **college enrollment rate** as a high school signal. NCES IPEDS has feeder school → college enrollment data. This is a far stronger high school quality signal than graduation rate alone.

**Effort:** 2–4 hours for coverage fix. College enrollment rate is a larger project (new data source, join logic).
**Impact:** Fills ~half the remaining FRL proxy schools with real data.

---

### Priority 3 — Private Schools (High Revenue Impact, High Effort)

**Problem:** ~16k private schools are in the geocoded dataset but scored on FRL proxy, which is meaningless. Private schools don't report to NCES/EdFacts. They're a premium segment — parents spending $20k+/year on tuition will scrutinize scores heavily.

**Data sources:**
- **NCES Private School Universe Survey (PSS):** Collected every 2 years. Contains enrollment, religious affiliation, school level, teacher counts. URL: `https://nces.ed.gov/surveys/pss/`. Available as downloadable CSV — no API.
- **State Department of Education:** Many states publish private school assessment participation data separately. Patchwork but better than nothing.
- **GreatSchools/Niche methodology:** They largely admit private school scores are self-reported or survey-based. We can do the same — build a school claim/verify portal.

**What to do:**
1. Download NCES PSS data for the latest available year.
2. Build a `download_private_schools.ts` that ingests the PSS CSV and joins by school name + address (fuzzy match since there's no universal private school ID equivalent to NCESSCH).
3. Score private schools on the pillars available from PSS (STR, enrollment health) and label the academic pillar as "Not Reported" rather than using a fake proxy.
4. Build a **school claim portal** — let private school administrators submit their own standardized test data (ERB, ISEE, state assessments, AP results). Verified submissions upgrade their score from estimated to verified.

**Effort:** 1–2 weeks engineering.
**Revenue angle:** Verified badges and featured listings for private schools = paid product.

---

### Priority 4 — AP / SAT / College Readiness (Moderate Impact, Moderate Effort)

**Problem:** The CRDC endpoints for AP enrollment and SAT/ACT participation returned 404 during our testing. These are high-value signals for high school scoring.

**What to do:**
1. Re-test CRDC AP and SAT endpoints with different years: `2015`, `2017`, `2019`, `2021`.
   - `https://educationdata.urban.org/api/v1/schools/crdc/ap-ib-enrollment/2021/?fips=42&limit=5`
   - `https://educationdata.urban.org/api/v1/schools/crdc/sat-act-participation/2021/?fips=42&limit=5`
2. If working, add to `download_edfacts.ts` as dataset #4.
3. Integrate into high school academic pillar: weight as 50% grad rate + 50% AP/SAT participation rate.

**Longer term:** College Board publishes school-level AP data. SAT school-level data requires a data partnership agreement with College Board — worth pursuing once at scale.

**Effort:** 1 hour API testing + 3–4 hours integration if endpoints work.
**Impact:** Significantly strengthens high school scores from a single blunt metric (grad rate) to a college readiness composite.

---

### Priority 5 — Teacher Quality (Lower Priority)

**Potential signals:**
- Teacher experience (years) — available in some CRDC datasets
- Teacher certification rate — CRDC `teachers-staff` endpoint
- Teacher turnover rate — not in federal datasets, would need state-level sources

**Assessment:** Low ROI for the effort. Teacher data is noisy, politically sensitive, and parents respond less to it than to test scores and absenteeism. Deprioritize until Priorities 1–3 are done.

---

## Scoring Transparency (Do This Before Launch)

Add to every school's score display:
- "Score based on 2017–2018 federal data" — visible, not buried
- Which pillars had real data vs. proxy for that specific school
- Brief plain-English explanation of what each pillar measures

This pre-empts the most common journalist/critic attack ("you're just measuring wealth") and builds trust with sophisticated parents.

---

## Competitive Landscape

| | GreatSchools | Niche | SchoolDigger | **StreetSmarts** |
|---|---|---|---|---|
| SES adjustment | Yes (added ~2017) | Partial | No | **Yes — core design** |
| Data source | State-reported | Mix + surveys | State-reported | Federal (EdFacts/CRDC) |
| Private schools | Yes | Yes | Limited | Partial (v1) |
| Data freshness | Varies by state | ~2022 | ~2022 | 2018 (v1) → update → current |
| Score transparency | Moderate | Low | Low | **High (goal)** |
| Coverage | ~140k | ~130k | ~120k | 84k (v1) |
