#!/bin/bash

# ==============================================================================
# StreetSmarts TIGER/Line Shapefile Downloader & PostGIS Ingester
# ==============================================================================
#
# This script automates downloading the 2023 US Census Bureau TIGER/Line 
# shapefiles for Counties and Unified School Districts, and injects them into
# a PostGIS-enabled PostgreSQL (Supabase) database.
#
# PREREQUISITES:
# 1. PostGIS must be enabled on your database:
#    psql -c "CREATE EXTENSION IF NOT EXISTS postgis;"
# 2. `shp2pgsql` must be installed locally.
#    Mac: `brew install postgis`
#
# USAGE:
# DB_URL="postgres://user:password@host:port/postgres" ./scripts/load_tiger_shapefiles.sh
#

set -e

if [ -z "$DB_URL" ]; then
    echo "❌ Error: You must set the DB_URL environment variable."
    echo "Usage: DB_URL=\"postgres://...\" ./load_tiger_shapefiles.sh"
    exit 1
fi

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📂 Working in temporary directory: $TEMP_DIR"

# ==============================================================================
# 1. US COUNTIES (tl_2023_us_county.zip)
# ==============================================================================
echo "⬇️  Downloading US Counties Shapefile (2023)..."
curl -sL -o counties.zip "https://www2.census.gov/geo/tiger/TIGER2023/COUNTY/tl_2023_us_county.zip"
unzip -q counties.zip -d counties

# Convert Shapefile to PostGIS SQL and pipe directly into database
# -s 4269: Sets standard NAD83 SRID from Census
# -I: Creates a highly-optimized GiST spatial index automatically
echo "🚀 Piping Counties into PostGIS table 'us_counties'..."
shp2pgsql -W "latin1" -s 4269 -I counties/tl_2023_us_county.shp public.us_counties | psql "$DB_URL" > /dev/null

echo "✅ Counties completely loaded!"

# ==============================================================================
# 2. UNIFIED SCHOOL DISTRICTS (tl_2023_[FIPS]_unsd.zip)
# ==============================================================================
echo "⬇️  Downloading Unified School Districts (2023)..."
echo "The Census Bureau splits School Districts by state. Looping through 50 states..."

psql "$DB_URL" -c "DROP TABLE IF EXISTS public.us_school_districts;" > /dev/null

STATE_FIPS=( "01" "02" "04" "05" "06" "08" "09" "10" "11" "12" "13" "15" "16" "17" "18" "19" "20" "21" "22" "23" "24" "25" "26" "27" "28" "29" "30" "31" "32" "33" "34" "35" "36" "37" "38" "39" "40" "41" "42" "44" "45" "46" "47" "48" "49" "50" "51" "53" "54" "55" "56" )

FIRST_INSERT=1
for fips in "${STATE_FIPS[@]}"; do
    FILE_NAME="tl_2023_${fips}_unsd"
    curl -sL -o "${FILE_NAME}.zip" "https://www2.census.gov/geo/tiger/TIGER2023/UNSD/${FILE_NAME}.zip"
    
    # If a state actually has unified districts (most do), parse and append
    if unzip -q "${FILE_NAME}.zip" -d "unsd_${fips}" 2>/dev/null; then
        if [ "$FIRST_INSERT" -eq 1 ]; then
            # Create Table (no index yet for speed)
            shp2pgsql -W "latin1" -s 4269 -c "unsd_${fips}/${FILE_NAME}.shp" public.us_school_districts | psql "$DB_URL" > /dev/null
            FIRST_INSERT=0
        else
            # Append to Table
            shp2pgsql -W "latin1" -s 4269 -a "unsd_${fips}/${FILE_NAME}.shp" public.us_school_districts | psql "$DB_URL" > /dev/null
        fi
        echo "   - State FIPS ${fips} loaded"
    fi
done

echo "🚀 Building Spatial Index for School Districts..."
psql "$DB_URL" -c "CREATE INDEX ON public.us_school_districts USING GIST(geom);" > /dev/null

echo "✅ Unified School Districts completely loaded!"

# ==============================================================================
# 3. OPTIMIZATION / PROJECTION
# ==============================================================================
# TIGER shapefiles come in SRID 4269 (NAD83). Google Maps/GPS uses SRID 4326 (WGS84).
# We can reproject the geometry column to 4326 so your Lat/Lng queries are natively aligned.

echo "🔄 Reprojecting geometries from NAD83 (4269) to WGS84 (4326) for API compatibility..."
psql "$DB_URL" -c "
    ALTER TABLE public.us_counties 
      ALTER COLUMN geom TYPE geometry(MultiPolygon, 4326) 
      USING ST_Transform(geom, 4326);
    
    ALTER TABLE public.us_school_districts 
      ALTER COLUMN geom TYPE geometry(MultiPolygon, 4326) 
      USING ST_Transform(geom, 4326);
" > /dev/null

echo "🎉 Success! TIGER/Line data is fully ingested and indexed."
echo "Cleanup: Removing temp directory"
rm -rf "$TEMP_DIR"
