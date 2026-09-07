# সহজ জমির হিসাব — LandBDAPP

Next.js application for Bangladesh land calculations and land information.

## Development

```bash
npm install
npm run dev
```

## RAJUK runtime integration

The RAJUK map and data pages use only the verified official runtime architecture:

- `/dap-map` — ArcGIS Maps SDK 4.x map with the six verified RAJUK cached layers.
- `/rajuk-test` — FeatureServer QA workspace for District → Upazila → Mauza → Plot and coordinate identify.
- Plot/hierarchy data comes from `Rajuk_dap_db/FeatureServer` layers 10, 9, 1 and 0.
- Map visualization uses the six verified Hosted MapServer services.
- RAJUK credentials are server-only; the browser receives normalized application responses and proxied tiles, never the API key or generated token.

### Environment

Copy `.env.example` to `.env.local` and set:

```env
RAJUK_API_KEY=your-server-only-arcgis-api-key
```

Do **not** use `NEXT_PUBLIC_RAJUK_API_KEY`, commit the real key, or store generated RAJUK tokens in Firestore.

### Verified RAJUK flow

The backend calls RAJUK `generateToken` with the configured API key and the target service URL, caches the short-lived token in server memory, refreshes it before expiry, and retries FeatureServer requests once after HTTP 498/499. Visualization tiles are served through the allow-listed LandBD tile proxy.
