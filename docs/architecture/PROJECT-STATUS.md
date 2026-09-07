# LandBD / Shohoz Jomir Hishab — Project Status

Last reviewed: 2026-08-20

## Overall assessment

The repository is **substantially developed** but **not yet production-complete**.

Major features (Next.js app, admin, blog/CMS, land tools, RAJUK GIS rebuild) exist. Remaining work is primarily functional QA, lockfile/CI health, and cleanup of legacy routes.

## Status by area

| Area | Status | Notes |
|------|--------|-------|
| Next.js application | Ready | Next.js 16.1.6 + React 19 + TypeScript |
| Main application architecture | Ready | Large App Router structure |
| Land calculation | Needs QA | Implemented; functional QA still required |
| Admin panel | Ready | Multiple admin modules exist |
| Blog / CMS | Ready | Create/edit/list routes exist |
| User management | Ready | Admin users section exists |
| RAJUK GIS | Needs QA | Major rebuild implemented; needs functional QA |
| Data Monitor | In progress | Being refactored |
| CI / package-lock | **Broken** | `package-lock.json` out of sync with `package.json` |

## Critical issue (blocks CI)

`package-lock.json` is missing `@arcgis/core@4.34.8` and many transitive dependencies.

Result: `npm ci` fails immediately → CI jobs finish in ~20s without running lint, typecheck, or build.

### Fix (run on a normal machine / GitHub Actions runner)

```bash
rm -rf node_modules package-lock.json
npm install
npm run typecheck
npm run lint
npm run build
git add package-lock.json
git commit -m "fix: regenerate package-lock.json for @arcgis/core and deps"
```

After this commit lands on `main`, CI should run the full pipeline (lint → typecheck → production build).

## Known remaining technical debt (from Phase 1)

- Legacy `/api/tiles` still referenced (admin/data-monitor audit needed before deletion).
- Legacy `/api/rajuk-token` returns HTTP 410 (safe to remove after deployment reference check).
- Route migration candidates (`/khatiyan` → `/records/...`, etc.) not yet applied.
- Functional QA still required for land calculation modules and RAJUK map flows (`/dap-map`, `/rajuk-test`).

## Architecture rules (must keep)

See `AGENTS.md`:

- Firebase Auth + Firestore remain the primary auth/database.
- RAJUK credentials stay server-only (`RAJUK_API_KEY`).
- `/dap-map` must fall back to public RAJUK data if private token is unavailable.

## Recommended next steps

1. **Highest priority:** Regenerate and commit a healthy `package-lock.json` (see fix above).
2. Confirm CI (lint + typecheck + build) passes on `main`.
3. Run functional QA on land calculation and `/dap-map` + `/rajuk-test`.
4. Audit and remove legacy `/api/tiles` + `/api/rajuk-token` after confirming no remaining consumers.
5. Continue Phase 2 hardening and design-system consistency.

## Related docs

- `docs/architecture/PHASE-1-STATUS.md` — Phase 1 refactor details
- `AGENTS.md` — architecture constraints
- `README.md` — RAJUK runtime notes
