# Phase 1 — Architecture Refactor Status

Branch: `refactor/phase-1-architecture` (historical)

> **See also:** [PROJECT-STATUS.md](./PROJECT-STATUS.md) for the current project assessment and recommended next steps.

## Completed in this phase

- Created a dedicated refactoring branch from the production baseline.
- Centralized site configuration in `src/shared/config/site.ts`.
- Centralized feature route names in `src/shared/config/feature-routes.ts`.
- Added `src/features/maps/rajuk/` as the GIS feature boundary.
- Exposed verified RAJUK layer/query types through the GIS feature boundary.
- Centralized root metadata/theme defaults through `SITE_CONFIG`.
- Migrated `/dap-map` visualization layers away from the legacy `/api/tiles?service=...` contract to the canonical `/api/rajuk/tile/{layer}/{level}/{row}/{col}` route.
- Canonical RAJUK tile resolution now maps only the verified six layer services.
- RAJUK token generation remains server-only.
- FeatureServer query access remains server-side and retries once after HTTP 498/499 token failures.

## Cleanup since Phase 1 (2026-09-09)

- Legacy `/api/tiles` route is no longer in the tree (migration complete).
- Legacy `/api/rajuk-token` compatibility route removed (was HTTP 410 only).
- One-shot `restore-geospatial-map` workflow removed.
- RAJUK smoke test updated to authenticate before layer metadata/query.

## Still intentional / open

- Firebase/auth infrastructure: still used by admin/auth flows and must not be removed blindly.
- Existing public routes: compatibility/SEO redirects still needed before any rename (e.g. `/khatiyan` vs `/khatian`).

## Target dependency direction

`app route → feature boundary → domain/service → provider API`

External GIS identifiers remain technically accurate; only user-facing labels should be generalized where required.
