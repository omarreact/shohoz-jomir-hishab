# 05 — GIS and Map Stabilization

## Canonical architecture

Canonical production GIS route: `/geospatial-map` using MapLibre.

`/dap-map` is a compatibility redirect to `/geospatial-map`. It is not a second independent Leaflet DAP implementation.

Specialized pages remain independent:
- `/mouza-map`
- `/rajuk-test`

Leaflet remains valid where those existing specialized views require it. No broad MapLibre-to-Leaflet rewrite was performed.

## Coverage truthfulness

Repository documentation explicitly states:
- RAJUK GIS coverage is geographically limited;
- RAJUK is not nationwide;
- map-derived area is an estimate, not a certified survey or ownership share;
- nationwide vector parcel coverage must not be implied.

No synthetic nationwide RAJUK dataset was added.

## Map UI behavior

The global visitor AI widget is now suppressed on all map workspaces:
- `/geospatial-map`
- `/mouza-map`
- `/rajuk-test`
- `/dap-map`

Map-specific quality fixes include:
- removal of stale unused GIS state/metadata;
- stable district/upazila/mouza cascade updates from user actions;
- reduced hook/state-effect warnings;
- stable Rajuk-test callback dependencies;
- simpler timeout request handling.

## QA limitation

No branch preview was deployed, so screenshot/interactive desktop/mobile visual QA of PR #164 is intentionally not claimed. GIS source tests, TypeScript, full Jest, Webpack and OpenNext builds passed.

## Status

Implementation DONE; branch visual QA remains a release-stage check after explicit preview/deploy authorization.
