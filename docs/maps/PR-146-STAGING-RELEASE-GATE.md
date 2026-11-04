# LandBD map preview release gate — PR #146

Scope: **Cloudflare preview only** for branch `fix/landbd-maps-rs-direct-search-webgl-20261104`.
Production Vercel, existing `landbd-app` production Worker, and custom domains must remain unchanged.

- Confirm Next.js CI and Cloudflare compatibility CI pass.
- Cloudflare Preview build command: `npm run cf:build`.
- Cloudflare Preview command: `npx wrangler preview`.
- Test `/geospatial-map`, `/mouza-map`, `/rajuk-test`.
- Confirm MapLibre v6 worker loads and WebGL error UI is actionable.
- Confirm RS direct plot-number lookup does not depend on the 2,000-record list.
- Verify live RAJUK, imagery provider access, exports, authentication/authorization, and responsive UI before promoting to production.
- Preview Worker builds may inherit live D1/R2 bindings: do **not** perform write-operation QA until isolated staging resources are verified.
