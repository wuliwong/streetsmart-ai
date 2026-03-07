# Nearby Search (New) — Google Places API

> **Source:** [Google Maps Platform Documentation](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
> **Platform:** Web Service

---

## Introduction

A Nearby Search (New) request takes one or more place types and returns a list of matching places within the specified area. A field mask specifying one or more data types is required.

**Nearby Search (New) only supports POST requests.**

---

## Request

```
POST https://places.googleapis.com/v1/places:searchNearby
```

All parameters are passed in the JSON request body or in headers.

### Minimal example

```bash
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

---

## Response

```json
{
  "places": [
    { /* Place object */ }
  ]
}
```

Each place in the array is a `Place` object. The fields returned are determined by the `FieldMask` passed in the request.

---

## Parameters

### Required

#### `FieldMask`

Specify which fields to return via the `X-Goog-FieldMask` header or `$fields` / `fields` URL parameter. **There is no default — omitting it returns an error.**

```
X-Goog-FieldMask: places.displayName,places.formattedAddress
```

Use `*` to return all fields (development only — avoid in production):

```
X-Goog-FieldMask: *
```

**Fields by billing SKU:**

<details>
<summary>Nearby Search Pro SKU</summary>

- `places.accessibilityOptions`
- `places.addressComponents`
- `places.addressDescriptor` *(India GA, experimental elsewhere)*
- `places.adrFormatAddress`
- `places.attributions`
- `places.businessStatus`
- `places.containingPlaces`
- `places.displayName`
- `places.formattedAddress`
- `places.googleMapsLinks`
- `places.googleMapsUri`
- `places.iconBackgroundColor`
- `places.iconMaskBaseUri`
- `places.id`
- `places.location`
- `places.name` *(returns resource name `places/PLACE_ID` — use `places.displayName` for text)*
- `places.movedPlace`
- `places.movedPlaceId`
- `places.photos`
- `places.plusCode`
- `places.postalAddress`
- `places.primaryType`
- `places.primaryTypeDisplayName`
- `places.pureServiceAreaBusiness`
- `places.shortFormattedAddress`
- `places.subDestinations`
- `places.timeZone`
- `places.types`
- `places.utcOffsetMinutes`
- `places.viewport`

</details>

<details>
<summary>Nearby Search Enterprise SKU</summary>

- `places.currentOpeningHours`
- `places.currentSecondaryOpeningHours`
- `places.internationalPhoneNumber`
- `places.nationalPhoneNumber`
- `places.priceLevel`
- `places.priceRange`
- `places.rating`
- `places.regularOpeningHours`
- `places.regularSecondaryOpeningHours`
- `places.userRatingCount`
- `places.websiteUri`

</details>

<details>
<summary>Nearby Search Enterprise + Atmosphere SKU</summary>

- `places.allowsDogs`
- `places.curbsidePickup`
- `places.delivery`
- `places.dineIn`
- `places.editorialSummary`
- `places.evChargeAmenitySummary`
- `places.evChargeOptions`
- `places.fuelOptions`
- `places.generativeSummary`
- `places.goodForChildren`
- `places.goodForGroups`
- `places.goodForWatchingSports`
- `places.liveMusic`
- `places.menuForChildren`
- `places.neighborhoodSummary`
- `places.parkingOptions`
- `places.paymentOptions`
- `places.outdoorSeating`
- `places.reservable`
- `places.restroom`
- `places.reviews`
- `places.reviewSummary`
- `routingSummaries` *(Text Search and Nearby Search only)*
- `places.servesBeer`
- `places.servesBreakfast`
- `places.servesBrunch`
- `places.servesCocktails`
- `places.servesCoffee`
- `places.servesDessert`
- `places.servesDinner`
- `places.servesLunch`
- `places.servesVegetarianFood`
- `places.servesWine`
- `places.takeout`

</details>

---

#### `locationRestriction`

The search area, defined as a circle with a center and radius (in meters).

- Radius must be between `0.0` and `50000.0` (inclusive)
- Default radius is `0.0` — **you must set a value greater than 0**

```json
"locationRestriction": {
  "circle": {
    "center": {
      "latitude": 37.7937,
      "longitude": -122.3965
    },
    "radius": 500.0
  }
}
```

---

### Optional

#### `includedTypes` / `excludedTypes`

Filter by types from **Table A**. Up to 50 types per category.

> **Note:** Table B types are returned in responses only — they cannot be used as filters.

- `includedTypes` — only return places with at least one of these types
- `excludedTypes` — exclude places with any of these types
- Conflicting types (same type in both) return an `INVALID_REQUEST` error

#### `includedPrimaryTypes` / `excludedPrimaryTypes`

Filter by a place's **primary** type from Table A.

- A place has exactly one primary type (e.g., `mexican_restaurant`, `steak_house`)
- Use these to target or exclude specific primary categories
- Conflicting primary types return an `INVALID_ARGUMENT` error

> **Tip:** Specifying a general type like `"restaurant"` can return places with more specific primary types like `"chinese_restaurant"` or `"seafood_restaurant"`.

#### `languageCode`

Language for returned results (e.g., `"en"`, `"fr"`). Defaults to `en`. Invalid codes return `INVALID_ARGUMENT`.

#### `maxResultCount`

Maximum number of results to return. Must be between `1` and `20` (default: `20`).

#### `rankPreference`

How to sort results. Options:

| Value | Behavior |
|---|---|
| `POPULARITY` | Sort by popularity (default) |
| `DISTANCE` | Sort by ascending distance from the specified location |

#### `regionCode`

Two-character CLDR code (e.g., `"us"`, `"gb"`) used to format the response. If the response's country matches this code, the country name is omitted from `formattedAddress`.

---

## Examples

### Find places of one type

Restaurants within 500m, returning display name only:

```bash
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 37.7937, "longitude": -122.3965 },
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

Response:

```json
{
  "places": [
    { "displayName": { "text": "La Mar Cocina Peruana", "languageCode": "en" } },
    { "displayName": { "text": "Kokkari Estiatorio", "languageCode": "en" } },
    { "displayName": { "text": "Harborview Restaurant & Bar", "languageCode": "en" } }
  ]
}
```

Adding more fields to the mask (`places.formattedAddress,places.types,places.websiteUri`):

```json
{
  "places": [
    {
      "types": ["seafood_restaurant", "restaurant", "food", "point_of_interest", "establishment"],
      "formattedAddress": "PIER 1 1/2 The Embarcadero N, San Francisco, CA 94105, USA",
      "websiteUri": "http://lamarsf.com/",
      "displayName": { "text": "La Mar Cocina Peruana", "languageCode": "en" }
    },
    {
      "types": ["greek_restaurant", "meal_takeaway", "restaurant", "food", "point_of_interest", "establishment"],
      "formattedAddress": "200 Jackson St, San Francisco, CA 94111, USA",
      "websiteUri": "https://kokkari.com/",
      "displayName": { "text": "Kokkari Estiatorio", "languageCode": "en" }
    }
  ]
}
```

---

### Find places of multiple types

Convenience stores and liquor stores within 1000m:

```bash
curl -X POST -d '{
  "includedTypes": ["liquor_store", "convenience_store"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 37.7937, "longitude": -122.3965 },
      "radius": 1000.0
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName,places.primaryType,places.types" \
https://places.googleapis.com/v1/places:searchNearby
```

> Adding `places.primaryType` and `places.types` helps distinguish results when multiple types are requested.

---

### Exclude a place type

Schools within 1000m, excluding primary schools, ranked by distance:

```bash
curl -X POST -d '{
  "includedTypes": ["school"],
  "excludedTypes": ["primary_school"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 37.7937, "longitude": -122.3965 },
      "radius": 1000.0
    }
  },
  "rankPreference": "DISTANCE"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

---

### All places near a point, ranked by distance

```bash
curl -X POST -d '{
  "maxResultCount": 10,
  "rankPreference": "DISTANCE",
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 37.7937, "longitude": -122.3965 },
      "radius": 1000.0
    }
  }
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

---

### Get address descriptors

Address descriptors provide relational information about a place's location — nearby landmarks and containing areas.

> **Note:** Generally available in India; experimental elsewhere. Billed at the **Nearby Search Pro** SKU.

```bash
curl -X POST -d '{
  "maxResultCount": 5,
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 37.321328, "longitude": -121.946275 },
      "radius": 1000
    }
  },
  "includedTypes": ["restaurant", "cafe"],
  "rankPreference": "POPULARITY"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName,places.addressDescriptor" \
https://places.googleapis.com/v1/places:searchNearby
```

Response includes a `landmarks` array (with straight-line and travel distances) and an `areas` array (with containment relationships like `WITHIN` or `OUTSKIRTS`).
