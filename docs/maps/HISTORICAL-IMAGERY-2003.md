# Historical imagery policy for LandBD GIS

Last reviewed: 2026-11-14

## Decision

LandBD does **not** embed, scrape, proxy, reverse-engineer, or reconstruct Google Earth historical imagery tiles.

Google Earth exposes historical imagery as an Earth product experience and availability varies by place and date. The Google Maps Platform documentation does not provide a supported public historical raster-tile endpoint for embedding the Earth archive in an independent MapLibre application. Google also restricts direct access to Google map/satellite tiles outside the supported Maps Platform products.

Therefore the `/geospatial-map` historical control uses only sources with a documented, embeddable interface and clear attribution.

## Current embedded historical sources

### NASA GIBS / MODIS Terra

LandBD currently exposes exact-date NASA GIBS WMTS imagery for:
- 2003-01-17
- 2010-01-17
- 2020-01-17
- 2025-01-17

The 2003 option is explicitly labelled **NASA MODIS 2003**, not Google Earth 2003. MODIS true-colour imagery is regional/low resolution (roughly 250 m for the underlying corrected-reflectance product) and is not suitable for parcel, building, ownership, or legal-boundary verification.

Source endpoint family:
`https://gibs.earthdata.nasa.gov/wmts/`

### EOX Sentinel-2 cloudless 2016/2017

The existing Sentinel-2 cloudless layer remains available as a higher-resolution historical visual reference. Its attribution and licence notice remain visible in the raster source definition. It is still imagery context, not a cadastral/legal record.

## Google Earth access

The sidebar may open Google Earth in a separate browser tab so a user can manually inspect whatever historical timeline Google makes available for that location. The LandBD map does not request Google Earth imagery tiles and does not label NASA/EOX imagery as Google imagery.

Official references:
- Google Earth historical imagery: https://developers.google.com/maps/documentation/earth/historical-imagery
- Google Earth web: https://earth.google.com/web/
- Google Maps Platform FAQ / tile-use restrictions: https://developers.google.com/maps/faq

## Potential future 2003 alternative

USGS Landsat 7 imagery is available for 2003 and can be accessed through supported public-data systems such as Google Earth Engine. It offers materially better spatial resolution than MODIS for historical landscape comparison, but a production integration should use a documented Earth Engine/API service, proper project/authentication/quota handling, explicit attribution, and verified cloud/date selection.

LandBD must not expose an ad-hoc Earth Engine token, undocumented tile URL, or imagery labelled as parcel-accurate.

Reference:
- Earth Engine USGS Landsat 7 Collection 2 Tier 1 TOA catalog: https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LE07_C02_T1_TOA

## UX policy

Historical imagery stays inside the collapsed sidebar and is loaded only when selected. Switching basemaps must preserve:
- current map position and zoom,
- RS/MS visibility,
- selected dag highlighting,
- active vector overlays.

No historical imagery is evidence of title, ownership, certified parcel geometry, or legal boundary.