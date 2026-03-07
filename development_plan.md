# Streetsmarts V2 Implementation Plan

## Goal Description
Rebuild the conceptual core of the legacy "Streetsmarts" application from scratch, transforming it into a modern, state-of-the-art web application. The core user flow remains the same: a user enters an address and selects categories to intuitively discover nearby places. However, the new version will completely overhaul the tech stack and aesthetic to deliver a "WOW" factor with a highly premium, dynamic, and responsive user interface.

## User Review Required
> [!IMPORTANT]
> **Map Provider Selection**: The legacy app used Google Maps. For a truly premium, customizable, and modern aesthetic (e.g., sleek dark modes, 3D buildings, dynamic styling), I highly recommend using **Mapbox GL JS** for the visual map component, while continuing to use the **Google Places API** on the backend for the actual data fetching. Please confirm if Mapbox is acceptable for the frontend map renderer, or if we must strictly stick to Google Maps.

> [!NOTE]
> **Styling Approach**: Per system constraints, this project will use **Vanilla CSS** (no Tailwind) to build a bespoke design system featuring glassmorphism, modern typography, and curated color palettes.

## Proposed Tech Stack & Architecture

### Backend / Infrastructure
- **Framework**: Next.js (React) - Allows for both building the interactive frontend and securing API routes for Google Places calls.
- **Data Source**: Google Places API (New) & Geocoding API, accessed exclusively via Next.js Serverless API routes to protect API keys.

### Frontend / UI
- **Map Engine**: Mapbox GL JS (via `react-map-gl`) configured with a custom premium dark or sleek minimalist style.
- **Styling**: Vanilla CSS utilizing CSS Modules, CSS Variables for theming, and modern layout techniques (Grid/Flexbox).
- **Typography**: Modern Google Fonts (e.g., Inter, Outfit, or Plus Jakarta Sans).
- **Icons**: Sleek SVG icons (e.g., Lucide or Phosphor) replacing the legacy image-based icons.

### Design Aesthetics & UI Features
- **Premium "WOW" Factor**: A cinematic, deep aesthetic (e.g., dark mode with neon/vibrant accents) that feels like a high-end concierge tool.
- **Glassmorphism**: Floating UI elements (search bars, category filters, detail panels) with backdrop blurring over the active map.
- **Micro-animations**: Smooth transitions when toggling categories, clicking markers, or calculating routes. Hovering a marker will dynamically draw a glowing route line to the location.
- **Responsive Layout**: A full-screen map experience that works flawlessly across desktop and mobile devices.

## Proposed Implementation Phases

### Phase 1: Setup & Design System
- Initialize empty Next.js project.
- Set up base global CSS (variables, resets, typography, premium color palette).
- Implement foundational floating UI components (Search Bar, Category Scroller).

### Phase 2: Map Integration
- Integrate Mapbox and configure a base custom style.
- Implement the central "Home" marker logic.

### Phase 3: Data & API Integration
- Build Next.js API routes to handle Google Geocoding and Google Places API requests.
- Connect the frontend search bar and category toggles to fetch and manage state.

### Phase 4: Interactive UI Layers
- Render custom HTML/CSS map markers based on location categories.
- Implement the "Hover to Route" functionality using Mapbox directions or Google Directions API.
- Build the slide-out Place Detail cards showing photos, ratings, and summaries.

## Verification Plan

### Automated Tests
- Basic Next.js build verification (`npm run build`).

### Manual Verification
- **Search Flow**: Enter addresses in various formats to ensure the map centers correctly.
- **Category Filtering**: Toggle categories on/off and visually verify markers appear/disappear instantly.
- **Interactions**: Hover over markers to verify routes draw smoothly. Click markers to ensure detail panels open with correct layout and imagery.
- **Aesthetic Check**: Verify the UI feels distinctively premium, responsive, and visually cohesive across different screen sizes.
