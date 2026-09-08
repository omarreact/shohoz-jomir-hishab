# LandBD / Shohoz Jomir Hishab — Project Status

Last reviewed: 2026-09-09

## Overall assessment

The repository is **substantially developed** and close to production-ready for core flows.

Major features (Next.js app, admin, blog/CMS, land tools, RAJUK GIS, page-access control, PDF export) exist. Remaining work is primarily functional QA, route consolidation, and optional dependency hygiene.

## Status by area

| Area | Status | Notes |
|------|--------|-------|
| Next.js application | Ready | Next.js 16.1.6 + React 19 + TypeScript |
| Main application architecture | Ready | App Router; Firebase Auth/Firestore SSOT |
| Land calculation | Needs QA | Implemented; functional QA still required |
| Admin panel | Ready | Users, blog, settings, page-access, data-monitor |
| Blog / CMS | Ready | Create/edit/list routes exist |
| User management | Ready | Admin users section exists |
| RAJUK GIS | Needs QA | Rebuild + proxies live; smoke test aligned with production auth |
| Data Monitor | In progress | Registry still mixes Hosted names and app APIs |
| CI | Healthy | Lint/typecheck/build complete on recent main runs |

## Recent cleanup (2026-09-09)

- RAJUK smoke test obtains auth **before** metadata/query (anonymous layer metadata returns ArcGIS 499).
- Removed legacy `/api/rajuk-token` (HTTP 410 stub; tiles use `/api/rajuk/tile/...`).
- Removed one-shot `.github/workflows/restore-geospatial-map.yml` (pushed restores to main).
- Legacy `/api/tiles` route is **already gone**; only historical docs mentioned it.

## Known remaining technical debt

- Duplicate public routes: `/khatiyan` and `/khatian` — pick one canonical path + redirect.
- Map surface overlap: `/dap-map`, `/mouza-map`, `/geospatial-map`, `/map`, plus QA pages `/rajuk-test`, `/ms-test`.
- Gate QA/demo surfaces (`/ms-test`, seed-demo APIs) behind staff/super-admin.
- Functional QA still required for land calculation modules and RAJUK map flows.
- Possible unused dependencies (verify with knip/depcheck before removal): bcryptjs, bullmq, ioredis, redlock, tsyringe, opossum, node-cron, axios.
- Dual nav (global vs GIS) not fully unified.

## Architecture rules (must keep)

See `AGENTS.md`:

- Firebase Auth + Firestore remain the primary auth/database.
- RAJUK credentials stay server-only.
- `/dap-map` must fall back to public RAJUK data if private token is unavailable.

## Recommended next steps

1. Confirm RAJUK integration workflow is green on main after smoke-test fix.
2. Canonicalize `/khatiyan` vs `/khatian` with redirects.
3. Gate or unpublish `/ms-test` and tighten `/rajuk-test`.
4. Run functional QA on land calculation and map flows.
5. Dependency unused-code pass; continue design-system consistency.

## Related docs

- `docs/architecture/PHASE-1-STATUS.md` — Phase 1 refactor details
- `AGENTS.md` — architecture constraints
- `README.md` — RAJUK runtime notes
