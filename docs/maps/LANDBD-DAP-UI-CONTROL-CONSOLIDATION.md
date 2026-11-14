# LandBD GIS control consolidation (RAJUK DAP workflow reference)

Reference: https://masterplan.rajuk.gov.bd/ (RAJUK Enterprise GIS Portal, ArcGIS-powered).

Scope: UI-only improvements for `/geospatial-map`, based on the existing MapLibre/RAJUK proxy, not a mirror or copy of RAJUK datasets.

## Changes
- Consolidate plot lookup, RS/MS and planning layer checkboxes, basemap/historical imagery, search results and legend into one scrollable panel.
- Remove the second floating layer popup and redundant basemap action. One checkbox controls RS/MS raster plus its corresponding vector boundary and labels.
- Make desktop panel open by default at >=1024px, mobile collapsed; allow manual closing, and collapse/expand on breakpoint changes.
- Hide the right-hand navigation toolbox behind the sidebar on narrow screens; constrain control height so short landscape screens can scroll.
- Separate coordinates from the bottom identify/measurement dock and suppress coordinates during measurement.
- Apply RS black and MS red to **vector boundaries and labels**. Existing RAJUK raster tiles might contain baked-in colors; these cannot be recolored through CSS/MapLibre line paint.
- Keep LandBD branding, authenticated planning layer checks, no new imagery licensing assumptions, and existing data endpoints.

## Existing supported actions retained
Zoom in/out, full RAJUK-area extent, north reset, live geolocation (subject to permission), map pitch, fullscreen, PNG snapshot (subject to tile CORS), browser print, measure point/distance/line/polygon/rectangle, plot identify and detail inspection, layer opacity, available basemap vintages, and parcel results.

## Important limits
RAJUK's public portal describes ArcGIS-backed advanced GIS planning capabilities, but its web application's interactive canvas was not machine-readable in this audit. The PR does **not** establish one-to-one feature parity for unverified RAJUK tools or layer datasets. Some RS/MS data and advanced layers require upstream permissions and data availability. No nationwide RS/MS cadastral dataset is introduced.

## QA gates
- `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`, `npm run build`, `npm run cf:build`
- At 390x844, 768x1024, 1024x768 and 1440x900: no header/panel/map-tools/dock/legend collision
- On touch and keyboard: open/close panel, switch four tabs, Escape only where supported, scroll search and overlay layers
- Verify RS and MS toggle independently; all-off/default behavior restores vector labeling
- Verify GPS denial, PNG CORS error, map print, identify, zoom, basemap switching, measurement completion/undo
- Verify public visitors cannot toggle privileged overlays; authenticated access unchanged
- Never merge or deploy to production until real-device staging QA and source attribution/licensing review

Archive branch/source unaffected. No production, DNS, credentials, or Firestore updates.
