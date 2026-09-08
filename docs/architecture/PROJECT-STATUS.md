# LandBD / Shohoz Jomir Hishab — Project Status

Last reviewed: 2026-09-09

## Overall assessment

The repository is **substantially developed** and close to production-ready for core flows.

Major features (Next.js app, admin, blog/CMS, land tools, RAJUK GIS, page-access control, PDF export) exist. Remaining work is primarily functional QA, map route consolidation, and optional dependency hygiene.

## Status by area

| Area | Status | Notes |
|------|--------|-------|
| Next.js application | Ready | Next.js 16.1.6 + React 19 + TypeScript |
| Main application architecture | Ready | App Router; Firebase Auth/Firestore SSOT |
| Land calculation | Needs QA | Implemented; functional QA still required |
| Admin panel | Ready | Users, blog, settings, page-access, data-monitor |
| Blog / CMS | Ready | Create/edit/list routes exist |
| User management | Ready | Admin users section exists |
| RAJUK GIS | Needs QA | `/dap-map` has identify + multi-plot highlight; smoke covers FS/0 + FS/1 |
| Data Monitor | In progress | Registry still mixes Hosted names and app APIs |
| CI | Healthy | Lint/typecheck/build complete on recent main runs |

## Recent cleanup (2026-09-09)

- RAJUK smoke test obtains auth **before** metadata/query; also verifies RS plot layer.
- Removed legacy `/api/rajuk-token` and one-shot restore-geospatial-map workflow.
- `/dap-map`: map click identify, multi-plot outline/selection, RS/MS filter, Bangla layer legend.
- Canonical khatiyan route is `/khatiyan`; `/khatian` remains a redirect alias.
- QA gates: `/rajuk-test` default **admin**, `/ms-test` default **super_admin**; removed from public nav/sitemap.

## Known remaining technical debt

- Map surface overlap: `/dap-map`, `/mouza-map`, `/geospatial-map`, `/map` (product consolidation still open).
- Functional QA still required for land calculation modules and map flows.
- Possible unused dependencies (verify with knip/depcheck before removal).
- Dual nav (global vs GIS) not fully unified.

## Architecture rules (must keep)

See `AGENTS.md`:

- Firebase Auth + Firestore remain the primary auth/database.
- RAJUK credentials stay server-only.
- `/dap-map` must fall back to public RAJUK data if private token is unavailable.

## Recommended next steps

1. Map product consolidation (primary: `/dap-map` + `/mouza-map`).
2. Run functional QA on land calculation and map flows.
3. Dependency unused-code pass; continue design-system consistency.
4. Optional admin RAJUK health widget (diagnose API already exists).

## Related docs

- `docs/architecture/PHASE-1-STATUS.md` — Phase 1 refactor details
- `AGENTS.md` — architecture constraints
- `README.md` — RAJUK runtime notes
