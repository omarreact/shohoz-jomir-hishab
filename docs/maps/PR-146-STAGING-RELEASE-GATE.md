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

## Production-aligned release build gate (2026-11-04)

- Release branch `release/landbd-pr146-preserve-prod-20261104` starts from the **actually deployed** Vercel commit `7795766f1110fd6f6b4643472a648cd8817b4d0e`, not from `main`. The original PR #146 branch omits 13 existing production-side commits.
- Preserve its live map layers and imagery in `MapLibreMap.tsx`; only bring in WebGL2/worker initialization protection. Keep live `vercel.json` and `wrangler.jsonc` unchanged.
- Initial release-branch Vercel preview `dpl_34oaa5vFbEv8PBD3HSEWXxVoVtdi` failed at `next build --webpack`. Do not deploy production until branch-specific PR CI and a new Vercel preview both pass, and mobile/land-record requests are tested without real user payment charges.
- Draft PR #147 is for **QA only**, not approved to merge to `main`. The production domain must remain on its prior READY deployment until all release gates are met.
