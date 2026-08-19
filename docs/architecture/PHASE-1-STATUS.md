# Phase 1 — Architecture Refactor Status

Branch: `refactor/phase-1-architecture`

## Completed in this phase

- Created a dedicated refactoring branch from the production baseline.
- Centralized site configuration in `src/shared/config/site.ts`.
- Centralized feature route names in `src/shared/config/feature-routes.ts`.
- Added `src/features/maps/rajuk/` as the GIS feature boundary.
- Exposed verified RAJUK layer/query types through the GIS feature boundary.
- Centralized root metadata/theme defaults through `SITE_CONFIG`.
- Migrated `/dap-map` visualization layers away from the legacy `/api/tiles?service=...` contract to the canonical `/api/rajuk/tile/{layer}/{level}/{row}/{col}` route.
- Canonical RAJUK tile resolution now maps only the verified six layer services.
- RAJUK token generation remains server-only and reads `RAJUK_API_KEY` from the environment.
- FeatureServer query access remains server-side and retries once after HTTP 498/499 token failures.

## Intentionally not removed yet

- Legacy `/api/tiles` route: an admin/data-monitor dependency audit is still required before deletion.
- Legacy `/api/rajuk-token` compatibility route: it returns HTTP 410 and exposes no token, but can be removed after checking deployment references.
- Firebase/auth infrastructure: still used by admin/auth flows and must not be removed blindly.
- Existing public routes: compatibility/SEO redirects will be designed before renaming routes.

## Target dependency direction

`app route → feature boundary → domain/service → provider API`

External GIS identifiers remain technically accurate; only user-facing labels should be generalized where required.

## Verification limitation

GitHub repository operations are available, but this environment does not provide a local Node.js install/build runner for this repository. Changes are therefore made conservatively and must be validated with CI/Vercel before merging to `main`.
