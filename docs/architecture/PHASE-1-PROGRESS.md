# Phase 1 — Architecture Progress

**Policy:** Work continues on `main` (no separate feature branch for this phase), per product owner direction.

## Goals (incremental)

1. Centralize route/config boundaries without breaking URLs.
2. Grow `src/features/*` and `src/modules/*` without deleting working code.
3. Keep RAJUK technical identifiers and Firebase stack intact.
4. Prepare for Phase 2 design tokens and Phase 3 unified shell.

## Completed

- [x] Phase 0 audit: `docs/architecture/PHASE-0-AUDIT.md`
- [x] Expanded `FEATURE_ROUTES` with login, map QA, bn/en labels, `PRIMARY_NAV_KEYS`
- [x] Config barrel exports labels + nav keys
- [x] **Navbar** driven by `FEATURE_ROUTES` / `FEATURE_LABELS` / `PRIMARY_NAV_KEYS` / `SITE_CONFIG`
  - Desktop primary links: records, land measurement, inheritance, urban planning map, documents, blog
  - Map label uses neutral product copy (নগর পরিকল্পনা মানচিত্র), not raw service branding
  - Secondary maps (geospatial, LIOS) + map QA remain in mobile/search only
  - Login / admin still use centralized routes

## Explicitly deferred

- App Router moves into `(public)` / `(auth)` route groups
- Compatibility redirects (`/khatiyan` → `/records/...`)
- Unifying `Navbar` vs `GisNavbar` (Phase 3)
- Pure extraction of measurement / inheritance engines (Phases 6–7)

## Verification

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Smoke: `/`, `/khatiyan`, `/land-measurement`, `/faraez`, `/dap-map`, `/porcha`, `/blog`, `/admin`, `/login`.

## Related docs

- `PHASE-0-AUDIT.md`
- `PHASE-1-ARCHITECTURE.md`
- `PHASE-1-STATUS.md`
- `PROJECT-STATUS.md`
- `AGENTS.md`
