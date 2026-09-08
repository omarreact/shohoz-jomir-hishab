# LandBD / Shohoz Jomir Hishab — Project Status

Last reviewed: 2026-09-09

## Overall assessment

The repository is **substantially developed** and close to production-ready for core flows.

Major features (Next.js app, admin, blog/CMS, land tools, RAJUK GIS, page-access control, PDF export) exist. Remaining work is primarily **functional QA** of land/map flows.

## Status by area

| Area | Status | Notes |
|------|--------|-------|
| Next.js application | Ready | Next.js 16.1.6 + React 19 + TypeScript |
| Main application architecture | Ready | App Router; Firebase Auth/Firestore SSOT |
| Land calculation | Needs QA | Implemented; functional QA still required |
| Admin panel | Ready | Includes live RAJUK health on dashboard |
| Blog / CMS | Ready | Create/edit/list routes exist |
| User management | Ready | Admin users section exists |
| RAJUK GIS | Needs QA | Product maps: `/dap-map` + `/mouza-map` |
| Data Monitor | In progress | Registry still mixes Hosted names and app APIs |
| CI | Healthy | `npm install` in CI (lock may lag package.json briefly) |

## Recent cleanup (2026-09-09)

- RAJUK smoke auth-first; FS/0 + FS/1.
- Removed `/api/rajuk-token`, restore workflow.
- `/dap-map` identify + multi-plot UX; map consolidation.
- QA gates for `/rajuk-test` / `/ms-test`.
- Admin RAJUK health widget (diagnose gated Admin+).
- **Dependency prune:** removed unused `bcryptjs`, `bullmq`, `node-cron`, `opossum`, `redlock`, `tsyringe`, `reflect-metadata`, `leaflet-defaulticon-compatibility`, and related `@types`. Package name → `landbd-app`. Deleted dead `src/modules/jobs/*`.

### Follow-up (local)

```bash
npm install
git add package-lock.json
git commit -m "chore: sync package-lock after dependency prune"
```

Then optionally restore CI to `npm ci` once the lock is committed.

## Known remaining technical debt

- Functional QA for land calculation modules and map flows.
- Optional design-system consistency pass.

## Architecture rules (must keep)

See `AGENTS.md`:

- Firebase Auth + Firestore remain the primary auth/database.
- RAJUK credentials stay server-only.
- `/dap-map` must fall back to public RAJUK data if private token is unavailable.

## Recommended next steps

1. Commit synced `package-lock.json` after `npm install`.
2. Functional QA on land calculation and map flows.
3. Design-system consistency as capacity allows.

## Related docs

- `docs/architecture/PHASE-1-STATUS.md` — Phase 1 refactor details
- `AGENTS.md` — architecture constraints
- `README.md` — RAJUK runtime notes
