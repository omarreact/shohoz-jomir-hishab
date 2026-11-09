# LandBD GIS — free imagery and land-record provenance

## Approved default-free imagery options (2026-11-03)

* **NASA GIBS MODIS Terra TrueColor**: 2003-01-17, 2010-01-17, 2020-01-17 and 2025-01-17. Free and openly available from NASA GIBS. These are single-day regional scenes, not cloud-free annual imagery or certified cadastral sources. Approximately 250 m native ground resolution; GIBS Web Mercator Level9, maximum zoom 9. Higher web-map zoom interpolates pixels; do not imply extra detail.
* **EOxCloudless 2016**: 2016–2017 Sentinel-2 mosaic, ~10 m, CC BY 4.0 and permitted in commercial applications with visible attribution. The public endpoint has fair-use limits and no SLA: https://cloudless.eox.at/documentation/faq and https://cloudless.eox.at/license-non-commercial.
* **Esri World Imagery** is a pre-existing LandBD basemap, retained for compatibility; it is **not** a blanket unrestricted free-data license. Validate usage rights, attribution and download/export permissions before shipping commercial changes.
* **EOxCloudless 2018–2025**, Google historical Earth tiles, Mapbox, MapTiler and other trial/free-tier services are **not automatically eligible** for free commercial use and are intentionally not embedded by this patch.

## Interaction and data integrity rules

1. Changing basemaps must preserve the selected map center and zoom and not move to the hard-coded 2003 point.
2. RS/MS raster overlays must remain translucent; vector selection remains above raster overlays.
3. RAJUK RS/MS GIS is geographically limited by its published data service. Do not imply nationwide vector dag coverage.
4. Map-derived area is an estimate, not ownership share or an officially certified measurement.
5. Display acquisition dates and imagery resolution. Do not present NASA MODIS as a plot-level image.
6. Keep provider source attribution visible and linked on the map. Respect third-party rate limits; do not bulk download public tiles.

## National land records and Mouza PDFs

Production khatian search uses DLRMS. Official draft settlement surveys are separately linked at https://settlement.gov.bd/ . Official scanned Mouza map purchases/search are at https://map.settlement.gov.bd/ . These sources have different publication/finality statuses.

The old `MouzaMapViewer` was backed by `mockMouzaMapProvider` even in production; mock PDF endpoints output sample PDFs. The production browser is now disabled and its sample files are blocked by HTTP routes. A labelled demo browser remains available in development only. Real nationwide PDF browsing requires authorization and an actual provider integration; this patch does not invent one.

## Validation

Run `npm run typecheck`, `npm run lint`, `npm test -- --runTestsByPath src/features/geospatial-map/maplibre/freeImagerySources.test.ts src/features/land-records/server/mock-map-access.test.ts` and `npm run build`; then inspect desktop and mobile at `/geospatial-map`, `/mouza-map`, and `/dlrms-khatian`. Test NASA/EOX tile availability at sampled Bangladesh coordinates and review CORS/attribution; neither coverage nor browser rendering has been verified in this patch.
