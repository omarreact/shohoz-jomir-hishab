# LandBD / Shohoz Jomir Hishab — Project Status

Last reviewed: 2026-11-12

## Overall assessment

The repository is **substantially developed** and close to production-ready for core flows.

Major features (Next.js app, admin, blog/CMS, land tools, RAJUK GIS, page-access control, PDF export) exist. Remaining work is primarily **functional QA** of land/map flows.

## Status by area

| Area | Status | Notes |
|------|--------|-------|
| Next.js application | Ready | Next.js 16.3.8 + React 19.2.3 + TypeScript |
| Main application architecture | Ready | App Router; Firebase Auth/Firestore SSOT |
| Land calculation | Needs QA | Implemented; functional QA still required |
| Admin panel | Ready | Includes live RAJUK health on dashboard |
| Blog / CMS | Ready | Create/edit/list routes exist |
| User management | Ready | Admin users section exists |
| RAJUK GIS | Needs QA | Canonical MapLibre `/geospatial-map`, `/mouza-map`, plus `/rajuk-test`; `/dap-map` redirects to `/geospatial-map` |
| Data Monitor | In progress | Registry still mixes Hosted names and app APIs |
| CI | Healthy | Node 22 + `npm ci`; full lint/typecheck/tests/Webpack build gate |

## Recent stabilization (2026-11-12)

- RAJUK smoke auth-first; FS/0 + FS/1.
- Removed `/api/rajuk-token`, restore workflow.
- `/dap-map` formalized as a compatibility alias to the canonical MapLibre `/geospatial-map`.
- QA gates for `/rajuk-test` / `/ms-test`.
- Admin RAJUK health widget (diagnose gated Admin+).
- **Dependency prune:** removed unused `bcryptjs`, `bullmq`, `node-cron`, `opossum`, `redlock`, `tsyringe`, `reflect-metadata`, `leaflet-defaulticon-compatibility`, and related `@types`. Package name → `landbd-app`. Deleted dead `src/modules/jobs/*`.

## Known remaining technical debt

- Functional QA for land calculation modules and map flows.
- Optional design-system consistency pass.

## Architecture rules (must keep)

See `AGENTS.md`:

- Firebase Auth + Firestore remain the primary auth/database.
- RAJUK credentials stay server-only.
- `/dap-map` must fall back to public RAJUK data if private token is unavailable.

## Recommended next steps

1. Keep production/browser QA for land calculation, GIS and PDF flows repeatable.
2. Keep DLRMS source provenance explicit and never treat third-party enrichment as official.
3. Continue targeted accessibility/lint cleanup without redesigning independent pages.

## Related docs

- `docs/architecture/PHASE-1-STATUS.md` — Phase 1 refactor details
- `AGENTS.md` — architecture constraints
- `README.md` — RAJUK runtime notes
