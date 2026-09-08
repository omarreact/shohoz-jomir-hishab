# LandBD / Shohoz Jomir Hishab — Project Status

Last reviewed: 2026-09-09

## Overall assessment

The repository is **substantially developed** and close to production-ready for core flows.

Major features (Next.js app, admin, blog/CMS, land tools, RAJUK GIS, page-access control, PDF export) exist. Remaining work is primarily functional QA and optional dependency hygiene.

## Status by area

| Area | Status | Notes |
|------|--------|-------|
| Next.js application | Ready | Next.js 16.1.6 + React 19 + TypeScript |
| Main application architecture | Ready | App Router; Firebase Auth/Firestore SSOT |
| Land calculation | Needs QA | Implemented; functional QA still required |
| Admin panel | Ready | Users, blog, settings, page-access, data-monitor |
| Blog / CMS | Ready | Create/edit/list routes exist |
| User management | Ready | Admin users section exists |
| RAJUK GIS | Needs QA | Product maps: `/dap-map` + `/mouza-map`; smoke covers FS/0 + FS/1 |
| Data Monitor | In progress | Registry still mixes Hosted names and app APIs |
| CI | Healthy | Lint/typecheck/build complete on recent main runs |

## Recent cleanup (2026-09-09)

- RAJUK smoke test auth-first; verifies mauza + RS plot layers.
- Removed legacy `/api/rajuk-token` and restore-geospatial-map workflow.
- `/dap-map`: identify, multi-plot highlight, RS/MS filter, Bangla legend.
- Canonical `/khatiyan`; `/khatian` redirect alias.
- QA gates: `/rajuk-test` admin, `/ms-test` super_admin; off public nav/sitemap.
- **Map consolidation:** primary product maps are `/dap-map` + `/mouza-map`. `/map` → `/dap-map`. `/geospatial-map` remains advanced shell (direct URL).

## Known remaining technical debt

- Functional QA for land calculation modules and map flows.
- Possible unused dependencies (verify with knip/depcheck before removal).
- Optional admin RAJUK health widget (diagnose API exists).

## Architecture rules (must keep)

See `AGENTS.md`:

- Firebase Auth + Firestore remain the primary auth/database.
- RAJUK credentials stay server-only.
- `/dap-map` must fall back to public RAJUK data if private token is unavailable.

## Recommended next steps

1. Functional QA on land calculation and map flows.
2. Dependency unused-code pass; design-system consistency.
3. Optional admin RAJUK health widget.

## Related docs

- `docs/architecture/PHASE-1-STATUS.md` — Phase 1 refactor details
- `AGENTS.md` — architecture constraints
- `README.md` — RAJUK runtime notes
