# SchoolSmarts: Data and Scoring Overview
## Business Analysis & Service Comparison Document

This document provides a high-level overview of the StreetSmarts proprietary "SchoolSmarts" scoring methodology and its underlying data architecture. It is designed to facilitate business analysis and serve as a baseline for comparing our offering against existing market solutions (e.g., GreatSchools, Niche).

---

## 1. System Architecture & Data Engineering

SchoolSmarts utilizes a "hybrid-ingestion" architecture that merges proprietary, pre-processed datasets with real-time geospatial data.

### The Seed Data Pipeline
Our foundation is built upon 100,500+ comprehensive public, charter, and private school records sourced directly from the most authoritative national databases:
*   **NCES (National Center for Education Statistics) EDGE**
*   **Urban Institute Education Data Portal (CCD/PSS)**

### The Geocoding Challenge & Solution
Raw national datasets lack the specific `place_id` keys necessary to link schools to consumer maps instantly. 

We executed a one-time, comprehensive batch geocoding operation to map every raw NCES school record to its definitive Google Places `place_id`. While this incurred front-loaded operational costs (~$1,600 via Google Places API), it yielded a massive competitive advantage: **O(1) mathematical lookups.**

### Real-Time Integration
When a user searches an address:
1.  Our system queries Google Places for raw geographic results within a specific radius.
2.  We intercept this raw array and cross-reference the `place_id`s directly against our Postgres database in a single, lightning-fast query.
3.  We inject our proprietary metrics (`streetSmartsScore`, filtered demographics, normalized enrollment) into the Google payload *before* it reaches the client.

**Advantage:** This completely eliminates the need for error-prone, on-the-fly fuzzy text matching. The mapping is precise, instantaneous, and allows our custom data to feel native to the Google Maps UI.

---

## 2. The Custom Scoring Methodology

Our algorithm translates raw educational data into an intuitive, 100-point "SchoolSmarts Score." The current model uses a weighted distribution across four key pillars.

*(Note: The current iteration utilizes base proxies that will be swapped for live API data as development progresses).*

### Pillar 1: Student-Teacher Ratio (30% Weight)
*   **Metric:** Total Enrollment / Full-Time Equivalent (FTE) Teachers.
*   **Logic:** Smaller class sizes generally correlate with more personalized attention and better outcomes.
*   **Scoring:** 
    *   Ratio ≤ 12:1 = 30 points
    *   Ratio 13:1 to 16:1 = 25 points
    *   Ratio 17:1 to 20:1 = 15 points
    *   Ratio > 20:1 = 5 points

### Pillar 2: Socio-Economic Context (20% Weight)
*   **Metric:** Proportion of students qualifying for Free or Reduced-Price Lunch (FRL) / Title I Status.
*   **Logic:** Evaluates the funding and socioeconomic context of the district. We use a proprietary baseline (15 points ±5) that can be tuned to reward either highly-funded tier-one districts or schools successfully bridging the achievement gap in high-need areas.

### Pillar 3: Enrollment Health & Stability (10% Weight)
*   **Metric:** Total overall enrollment count.
*   **Logic:** Assesses the baseline stability and socialization opportunities of an institution.
*   **Scoring:**
    *   Enrollment > 200 = 10 points
    *   Enrollment > 50 = 5 points
    *   Missing/Zero = 0 points (penalizes defunct or unregistered micro-schools).

### Pillar 4: Academic Performance Proxy (40% Weight)
*   **Metric:** Standardized assessment percentiles (Math / Reading proficiency).
*   **Current State:** Currently utilizing a normalized curve proxy for rapid prototyping.
*   **Future State:** Will connect to the EdFacts API or state-level endpoints to pull live proficiency data.

---

## 3. The Address Score (Gravity Utility Model)

The true value of StreetSmarts isn't just grading a single school; it's grading **how an address relates to the schools around it.** 

When a user searches a home, our Gravity Utility Model evaluates the address based on three factors (max 100 points per category):

1.  **Density & Utility (35%):** Uses actual travel times (walking, transit, driving). It calculates an asymptotic utility formula (`10 / timeMins`) to reward addresses that have highly accessible options.
2.  **Quality (35%):** We calculate a weighted average of the nearby schools. Crucially, we weight the average by the logarithm of the school's enrollment (`Math.log10(enrollment + 1)`). This ensures a massive high-performing public school holds more gravity than a small 10-person private school.
3.  **Proximity (30%):** Evaluates the absolute closest 3 options. It applies a linear decay ratio, rewarding addresses whose top choices are under 5 minutes away and heavily penalizing addresses where the closest options are over 45 minutes away.

---

## 4. Competitive Positioning Analysis

### What differentiates SchoolSmarts?

*   **Holistic Geospatial Integration:** Competitors (GreatSchools, Niche) evaluate schools in a vacuum. We evaluate *addresses based on their functional relationship to the schools*.
*   **Modern Weighting (Logarithmic vs. Linear):** Our algorithm prevents tiny sample sizes from skewing neighborhood data by using logarithmic weighting for student populations.
*   **Speed & UI:** Our O(1) database mapping allows our proprietary scores to render inside a premium, glassmorphism map interface instantly, bypassing the clunky, tab-based navigation of legacy competitors.
*   **Zero-Friction Filtering:** Real-time toggling between Public, Private, Charter, and Grade levels allows users to visualize only the educational subset relevant to their specific family right on the map.
