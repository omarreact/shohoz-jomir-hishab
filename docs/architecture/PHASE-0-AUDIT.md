# Phase 0 — Repository Audit & Safety Baseline

Date: 2026-08-20  
Baseline commit: `2a11b593338c17ae12d90ff70fc614c31cdccc85` (and subsequent main)

## Purpose

Establish a clear map of the current application before any structural or UI modernization work.  
No feature code is changed in this phase.

## Mandatory constraints (from AGENTS.md)

- **Firebase** remains the only primary auth + application database (Firestore + Auth + Admin SDK).
- Do **not** migrate to Prisma, Supabase, or another DB/auth stack unless explicitly requested.
- **RAJUK** technical service identifiers and server-side token handling must be preserved.
- UI may use neutral labels (e.g. Urban / Metropolitan Planning); do not break verified API integrations.
- `/dap-map` must still load public RAJUK data if private token is unavailable.
- Prefer fixing existing systems over wholesale replacement.

## Top-level layout

```
app/                 Next.js App Router (pages + API)
src/
  features/          Feature UI boundaries (partial)
  modules/           Domain logic (auth, faraez, land, etc.)
  services/          External integrations (rajuk)
  shared/            Config, UI kit, shell components
  locales/           bn translations
docs/architecture/   Status and phase docs
.github/workflows/   CI
```

No `prisma/` schema in active use. No Supabase dependency for core data.

## Public routes (app/)

| Route | Role |
|-------|------|
| `/` | Homepage |
| `/khatiyan` | Land record / khatiyan tools |
| `/land-measurement` | Unit conversion / measurement |
| `/faraez` | Islamic (and related) inheritance |
| `/porcha` | Porcha / document flow |
| `/dap-map` | RAJUK DAP map (ArcGIS + verified layers) |
| `/rajuk-test` | FeatureServer QA workspace |
| `/geospatial-map` | Geospatial map feature |
| `/lios-map` | LIOS map (minimal) |
| `/blog`, `/blog/[category]/[slug]` | Content |
| `/p/[slug]` | Custom pages |
| `/login` | Auth |
| `/faq`, `/privacy`, `/terms` | Static/info |
| `/nid-copy` | NID-related tool |
| `/403` | Forbidden |

## Admin routes

| Route | Role |
|-------|------|
| `/admin` | Dashboard |
| `/admin/users` | User management |
| `/admin/blog`, `.../new`, `.../edit/[id]` | CMS |
| `/admin/custom-pages` | Custom HTML pages |
| `/admin/data-monitor` | API / data monitoring |
| `/admin/settings` | Site settings |

## API surface (app/api)

- **Admin:** health, login-history, metrics, settings, stats, users (+ create, [id])
- **Auth:** `/api/auth/me`
- **Content:** blogs, pages, comments, notifications
- **Land/docs:** porcha
- **Maps:** `/api/rajuk/metadata`, `query`, `tile/[layer]/[z]/[y]/[x]`
- **Legacy:** `/api/rajuk-token` (HTTP 410 — intentionally disabled)
- **Unified gateway:** `/api/unified/*`
- **Public:** maintenance, settings
- **Infra:** health, cloudinary/sign

Note: Phase 1 status still flags legacy `/api/tiles` references for audit before deletion.

## Feature modules (src/features)

- `home` — landing sections
- `khatiyan` — calculators, owners/plots cards
- `faraez` — UI inputs/results
- `blog` — cards, comments, TOC
- `maps/rajuk` — GIS feature boundary + types
- `geospatial-map` — map component
- `admin` — DynamicApiTable, data-monitor registry

## Domain modules (src/modules)

- `auth` — useAuth, serverAuth
- `database` — firebaseAdmin, firebaseClient
- `faraez` — muslim-law, hindu-law, conversion, types (engines exist)
- `khatiyan` — calculations
- `land` — geometry
- `porcha` — data + large `porcha.json`
- `admin`, `notification`, `redis`, `jobs`, `unified`

## External services

- `src/services/rajuk/` — token auth, layers, query (server-side)
- ArcGIS Maps SDK + Leaflet/React-Leaflet in UI
- Cloudinary (signed uploads)
- Optional Redis / BullMQ where already present

## Shared shell & design

- `Navbar`, `GisNavbar` (map routes still use separate GIS nav)
- `ThemeProvider`, Tailwind v4, Radix-based `src/shared/ui/*`
- `SITE_CONFIG`, `feature-routes` centralized config (Phase 1 partial progress)
- Design tokens not fully standardized yet (raw utility colors still common)

## Auth & data

- Firebase Authentication + Firestore as SSOT
- Admin must verify server-side (not client-only `isAdmin`)
- next-firebase-auth-edge in stack

## CI / packaging

- CI currently uses `npm install --no-audit --no-fund` (temporary unblock)
- `package-lock.json` still ideally regenerated, then restore `npm ci`
- Scripts: `dev`, `build`, `lint`, `typecheck`

## Known technical debt (carry into later phases)

1. Lockfile out of sync with `package.json` (`@arcgis/core` and transitive graph).
2. Legacy `/api/tiles` / `/api/rajuk-token` cleanup after consumer audit.
3. Dual nav (global vs GIS) — Phase 3 should unify shell.
4. Route names still product-legacy (`/khatiyan` vs planned `/records`); migrate with redirects, not hard cuts.
5. Functional QA still needed for land math, Faraez, RAJUK map identify flows.
6. Homepage and admin not yet aligned to full design-system / SaaS shell goals.

## Safety baseline for Phase 1+

Before structural moves:

- [ ] Keep all existing public URLs resolving (add redirects if paths change).
- [ ] Do not move RAJUK service URL constants into UI-only renames.
- [ ] Do not strip Firebase modules.
- [ ] Prefer additive feature folders; delete dead code only after inventory confirms zero imports.
- [ ] Verify lint + typecheck + build after each meaningful structural batch.

## Deliverable status

| Item | Status |
|------|--------|
| Route inventory | Done |
| API inventory | Done |
| Feature / module map | Done |
| Auth/DB constraint confirmation | Done |
| Dependency note (no Prisma core) | Done |
| Debt list for later phases | Done |

**Next:** Phase 1 — Architecture & directory refactor (incremental, on `main` as directed).
