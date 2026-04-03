# StreetSmarts Scoring and Data Enrichment System

This document outlines the architecture, pipeline, and economics of how StreetSmarts processes nearby places to generate personalized scores, with a specific focus on the custom SchoolSmarts data enrichment pipeline.

## 1. The Core `StreetSmarts` Algorithm

The core engine responsible for grading any given address is located in `src/lib/scoring.ts`. It calculates a "0-100" grade utilizing what is conceptually a **Gravity Utility Model**. It assesses the desirability of a location not just on pure distance, but as a function of multiple holistic factors.

For every active category, the algorithm processes the fetched `MapPlace` objects and calculates three sub-scores that sum up to 100 max points per category:

### A. Density Score (Max 35 points)
This measures the sheer volume and accessibility of places in the category. 
- It first calculates the estimated travel time for *every* place in the category based on the selected `travelMode` (walking, transit, driving).
- It calculates a "density utility" by summing `10 / timeMins` for each place (with a minimum of 1 minute so places next door aren't infinite value).
- It applies an exponential decay function to this utility to create an asymptotic score that caps at 35. Essentially, a handful of very close places, or a massive amount of medium-distance places, will yield a high score.

### B. Quality Score (Max 35 points)
This measures the user consensus of the nearby amenities.
- It calculates a weighted average of the Google Places `rating` (0-5 stars) for all places in that category.
- The weight applied to each rating is `Math.log10(userRatingsTotal + 1)`. This ensures that a 4.8 star place with 1,000 reviews carries vastly more weight than a 5.0 star place with 2 reviews.
- The returned score is simply this weighted average scaled proportionally up to 35 points.

### C. Proximity Score (Max 30 points)
This focuses exclusively on the absolute nearest options, mimicking how a resident primarily cares about their "go-to" spot regardless of how many other options exist further out.
- The algorithm identifies the 3 closest places in the category (or up to 5 if there are many).
- It averages their travel times.
- It applies a linear decay ratio. An average time of 0 yields a perfect 30. An average time of 45+ minutes yields 0.

### Final Calculation
The final address score presented to the user is the mathematical average of the total scores across all *active* categories.

---

## 2. The SchoolSmarts Enrichment Pipeline

Standard Google Places API results for schools lack crucial nuance (like student-teacher ratios, funding models, and academic performance proxies). To solve this and deliver the custom "SchoolSmarts" score, a custom data pipeline was engineered. 

### Why did it cost $1,600?

The cost arose from the initial **Geocoding Script** (`scripts/batch_geocode_schools.ts` and `scripts/generate_rankings.ts`).

1. **The Seed Data**: You pulled roughly 100,000+ public and private school records from national open data sets (Urban Institute / NCES / PSS). 
2. **The Bottleneck**: This dataset contained raw addresses and coordinates, but did *not* contain Google `place_id`s. 
3. **The Expense**: To achieve O(1) mathematical lookups on the frontend and avoid fuzzy text matching on the fly, you ran a script that fed every single one of those ~100,500 school names through the **Google Places Find Place From Text API**. At $17.00 per 1,000 requests, running this across 100,000 records incurred a one-time structural data charge of ~$1,700.

### How The Pipeline Works Now (Zero Added Cost)

The application now runs an extremely efficient, custom-joined query that merges our proprietary Postgres school data with Google's live local results.

1. **Frontend Request**: The user searches an address. The Next.js client calls the backend `/api/places` route.
2. **Google Retrieval**: The backend hits `https://maps.googleapis.com/maps/api/place/nearbysearch/json` requesting 'school' and 'university' types within the radius.
3. **Postgres Interception**: Before returning the results to the user, the backend (`src/app/api/places/route.ts`) intercepts the array of roughly ~20-60 `place_id`s returned by Google.
4. **The Bulk Query**: It runs a single, lightning-fast array query against Supabase:
   `SELECT * FROM public.schools WHERE place_id = ANY($1::text[])`
5. **The Merge**: The backend iterates over the Google Places results. If a strict `place_id` match is found in our Postgres database:
   - We replace the generic Google `rating` with our proprietary `streetSmartsScore` (scaled down to a 0-5 metric so the standard Quality algorithm still processes it naturally).
   - We replace the generic `userRatingsTotal` with the school's exact `enrollment`.
   - We inject the raw 1-100 `streetSmartsScore` into the payload so the frontend UI can render the custom badge.
   - We apply the user's active filters (Public, Charter, Private, Elementary, etc.) right there on the server, purging non-matching schools before they ever hit the client's map.

### The Original Seed Algorithm (`generate_rankings.ts`)

The proprietary 1-100 score injected into the database was calculated via:
- **Student/Teacher Ratio (30 points)**: Perfect score for < 12:1.
- **Title I / Free-Reduced-Lunch Proxy (20 points)**: Base metric representing funding parameters. 
- **Enrollment Health (10 points)**: > 200 kids = +10 pts.
- **Academic Baseline (40 points)**: A randomized baseline (to be replaced by live state assessment data API hooks in the future).
