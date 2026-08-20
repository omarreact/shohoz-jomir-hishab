# Phase 1 — Architecture Progress

**Policy:** Work continues on `main` (no separate feature branch for this phase), per product owner direction.

## Goals (incremental)

1. Centralize route/config boundaries without breaking URLs.
2. Grow `src/features/*` and `src/modules/*` without deleting working code.
3. Keep RAJUK technical identifiers and Firebase stack intact.
4. Prepare for Phase 2 design tokens and Phase 3 unified shell.

## Completed in this start batch

- [x] Phase 0 audit published: `docs/architecture/PHASE-0-AUDIT.md`
- [x] Expanded `FEATURE_ROUTES` with login, map QA path, bn/en labels, and `PRIMARY_NAV_KEYS`
- [x] Documented progress on `main`

## Explicitly deferred (do later in Phase 1)

- Physical App Router moves into `(public)` / `(auth)` route groups (large file moves; do in small verified batches).
- Compatibility redirects (`/khatiyan` → `/records/...`) until SEO/consumer audit is done.
- Unifying `Navbar` vs `GisNavbar` (Phase 3).
- Pure extraction of land-measurement / inheritance engines into feature folders (Phases 6–7).

## Verification checklist after each batch

```bash
npm install   # until lockfile is regenerated for npm ci
npm run typecheck
npm run lint
npm run build
```

Smoke: `/`, `/khatiyan`, `/land-measurement`, `/faraez`, `/dap-map`, `/admin`, `/login`.

## Related docs

- `PHASE-0-AUDIT.md`
- `PHASE-1-ARCHITECTURE.md`
- `PHASE-1-STATUS.md`
- `PROJECT-STATUS.md`
- `AGENTS.md`
