# LandBD / Atlas — map redesign and government source inventory

Reviewed November 3, 2026.

## Production routes

| Route | Experience | Preserved data source |
|---|---|---|
| `/geospatial-map` | Light cartographic atlas, live map, RS/MS overlays, historical imagery, layer opacity, search, live GPS, geodesic measurements, selected plot inspector, links to Khatiyan/Faraez | Existing `/api/rajuk/query`, `/api/rajuk/tile/*`, MapLibre controller |
| `/mouza-map` | Responsive source-led workspace; live District → Upazila → Mouza download form; professional authenticated export map; public government references; development-only mock PDF browse | Existing RAJUK cascade / `/api/mouza-map/download`, service entitlement |
| `/rajuk-test` | Record-first RS/MS parcel explorer; district/upazila/mouza/JL cascade, RS listing, MS scoped query, attribute-based acreage, map inspector, PDF/PNG export | Existing RAJUK query service, Leaflet plot viewer |
  
## Official sources (verified public references)

- **Ministry of Land** — https://land.gov.bd/ ; official categories include mutation, land development tax, land records and maps; official citizen assistance **16122**.
- **Land zoning project** — https://map.land.gov.bd/ ; describes ongoing mouza/plot digital land-use and zoning map georeferencing; cascading search division → district → upazila → mouza → sheet → plot. Land-use categories include agricultural, residential, forest, waterbody, roads, industry, tea gardens, coastal and char lands. These published classes are guidance labels, **not** zoning values for any selected RAJUK parcel.
- **Land Records & Maps / DLRMS** — https://dlrms.land.gov.bd/ ; existing production land-record provider remains the authoritative source for LandBD's nationally searchable Khatiyan workflow, subject to actual government API availability.
- **Department of Land Records & Surveys (DLRS)** — https://map.settlement.gov.bd/ ; scanned Mouza map lookup and purchase/issuance, not a freely replicable GIS tile feed.
- **Settlement** — https://settlement.gov.bd/ ; live site expressly warns that published records for ongoing surveys are DRAFT and can change; they must not be called certified final Khatiyans.
- **Official fees** — https://lsg-portal.land.gov.bd/vumisheba-fee ; linked rather than hard-coded as prices can change.

No unpublished cadastral dataset, scraping-only internal endpoint, paywalled download or unofficial owner record has been imported. Government portals are linked as source documents; the UI does not claim that they feed a new live LandBD API.

## Design system

- New independent cartographic design: parchment/off-white #f5f3ec, deep ink #1d5960, warm terra-cotta #bd754c, pale muted sage, typography-led hierarchy, round functional controls.
- Shared navigation, source provenance, mobile-friendly forms and panels, localized Bangla instructions, accessible control states and error feedback.
- Protect the selected parcel and viewport when switching imagery; historical MODIS is ~250m regional observation and must not be sold as plot-level imagery.

## Known constraints and required acceptance QA

1. **Geographic coverage**: RAJUK is not nationwide. Other Bangladesh districts must be searched through actual DLRMS and DLRS source portals.
2. **Ownership/legal validity**: satellite overlays, approximate GIS geometry and public land-record previews are not certified surveys or proof of ownership.
3. **Availability**: NASA GIBS/EOX map tiles and RAJUK/DLRMS gateways may be slow/unavailable; errors and access rights are respected.
4. **Commercial imagery**: use EOxCloudless 2016 CC BY 4.0 (attributed) and NASA GIBS public data. Do not embed newer non-commercial free EOx mosaics or unofficial Google Earth history tiles.
5. **Security**: plot popup and map-marker HTML text is escaped; no external service tokens are exposed in client code.
6. **Visual validation**: verify compact widths (360px/390px), tablet (768px), desktop (1366px), map interactions and download modal stacking in actual browser. CI checks alone do not establish UX pixel fidelity.
7. **Regression**: `npm run lint && npm run typecheck && npm test -- --runInBand && npm run build`; then real provider tests on all three routes. Do not merge without successful checks.

## Manual acceptance scenarios

- Map view: choose Esri → EOx 2016 → NASA 2003, preserve center/zoom; locate, draw polygon/line, undo, view RS/MS overlay; select feature and send to calculators.
- Mouza public: load district/upazila/mouza from RAJUK, download selected Mouza only; verify source and legal status; sample PDF endpoints return 404/503 on production.
- Mouza staff: search selected Mouza, switch historical imagery, identify plot, export GeoTIFF/RAW with correct metadata; imagery switching affects preview map, not underlying raster geodata.
- RAJUK: RS mode load then search plot; MS mode search scoped by mouza/JL; ensure acreage from attributes (not approximated ownership share), check image/PDF downloads and map attribution, test malicious HTML strings in popup.
