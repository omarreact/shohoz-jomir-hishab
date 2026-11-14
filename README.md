# সহজ জমির হিসাব — LandBDAPP

Next.js application for Bangladesh land calculations and land information.

## Development

```bash
npm install
npm run dev
```

## RAJUK runtime integration

The RAJUK map and data pages use only the verified official runtime architecture:

- `/geospatial-map` — canonical MapLibre GIS workspace with LandBD layer controls and proxied official RAJUK data.
- `/mouza-map` — Mouza selection/export workspace.
- `/rajuk-test` — staff/admin FeatureServer QA workspace for District → Upazila → Mauza → RS/MS Plot and coordinate identify.
- Plot/hierarchy data comes from `Rajuk_dap_db/FeatureServer` layers 10, 9, 1 and 0.
- Map visualization uses the six verified Hosted MapServer services.
- RAJUK credentials are server-only; the browser receives normalized application responses and proxied tiles, never the API key or generated token.

### Environment

Copy `.env.example` to `.env.local`. The RAJUK runtime can use the official public config path without a private credential. If an operator configures an explicit fallback credential, keep it server-only, for example:

```env
RAJUK_API_KEY=optional-server-only-fallback
```

Do **not** use `NEXT_PUBLIC_RAJUK_API_KEY`, commit a real credential, or store generated RAJUK tokens in Firestore.

### Verified RAJUK flow

RAJUK access remains server-side. The auth service first uses the official public config/API-key path when available, then configured portal/server credentials as fallbacks. Short-lived credentials are cached server-side (Redis/local memory), refreshed before expiry, and FeatureServer/MapServer traffic is exposed to the browser only through LandBD's normalized/query/tile proxy routes.
