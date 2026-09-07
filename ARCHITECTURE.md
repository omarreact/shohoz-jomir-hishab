# LandBD Architecture

**Branch:** `main`  
**Stack:** Next.js App Router · TypeScript · Firebase Auth/Firestore · MapLibre · ArcGIS/RAJUK proxies  
**Last updated:** 2026-08-31

This document is the authoritative map of production domains, dependency rules, and invariants.  
It extends the existing Phase 0/1 notes under `docs/architecture/`.

---

## 1. Domain map

```text
                         LAND BD
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
       MAPS              KHATIYAN            FARAEZ
         │                  │                  │
         │                  │                  │
         ├──────── LAND MEASUREMENT ───────────┤
         │                                     │
         └────────────── BLOG ─────────────────┘
                            │
                      SHARED PLATFORM
                   (auth, UI, API, config)
                            │
                      INFRASTRUCTURE
              (Firebase, Redis, RAJUK, GIS raster)
```

| Domain | UI routes | Domain logic | External services |
|--------|-----------|--------------|-------------------|
| **Maps / GIS** | `/geospatial-map`, `/mouza-map`, `/dap-map`, `/rajuk-test` | `src/features/geospatial-map`, `src/features/maps`, `src/lib/gis` | `src/services/rajuk/*`, `/api/rajuk/*`, `/api/mouza-map/*` |
| **Khatiyan** | `/khatiyan`, `/khatian` | `src/modules/khatiyan/*` | GIS bridge only |
| **Faraez** | `/faraez` | `src/modules/faraez/*` | GIS bridge only |
| **Land measurement** | `/land-measurement` | `src/modules/land/*` | none |
| **Blog** | `/blog`, `/blog/[category]/[slug]` | `src/features/blog/*` | Firestore via `/api/blogs` |
| **Admin** | `/admin/*` | `src/modules/admin`, `src/features/admin` | Firebase Admin, Cloudinary |
| **Auth** | `/login` | `src/modules/auth/*` | Firebase Auth |
| **Shared** | shell, nav, footer | `src/shared/*` | — |

---

## 2. Dependency rules (must not reverse)

```text
app/ routes
  → features/* (UI, hooks)
      → modules/* (pure domain engines)
          → services/* / infrastructure adapters
              → external APIs / Firebase / Redis

shared/ui  must not import features/* or modules/* business logic
modules/*  must not import react, maplibre, next/navigation, or features/*
features/A must not import features/B internals (use modules contracts or shared)
```

**Allowed cross-domain contracts**

| From | To | Contract |
|------|----|----------|
| Maps | Khatiyan / Faraez | `sendPlotToKhatiyan` / `sendPlotToFaraez` (`src/modules/khatiyan/gis-bridge.ts`) — **only** server-validated `KhatiyanPlot` |
| Home | Blog | `STATIC_BLOG_POSTS`, `toPlainText` (content helpers only) |

**Forbidden**

- Map components calling Faraez rational math directly  
- Blog pages importing MapLibre or ArcGIS clients  
- UI components using Firebase Admin SDK  
- Client code reading `RAJUK_*` secrets  

---

## 3. Architectural invariants

These must never be violated. Tests under `src/modules/**` and `tests/` enforce many of them.

### Faraez
1. Inheritance arithmetic uses **exact rational / bigint** — not IEEE-754 `number` for share totals.  
2. Estate conservation: allocated shares must sum to the conserved estate (see `conservation.ts`).  
3. Engine modules (`faraez.engine.ts`, `rational.ts`, `awl.ts`, `radd.ts`) must remain free of React and routing.

### Khatiyan
1. Owner shares convert through **`shareToTilExact` (bigint)** — never floating-point Til ledgers.  
2. Area allocation must conserve total plot area within documented epsilon.  
3. `calculations.ts` must not import UI or MapLibre.

### GIS / Mouza
1. Selected Mouza download includes **only** that Mouza (exact polygon mask), not viewport screenshots.  
2. Download API must **never** fetch arbitrary client-supplied URLs (SSRF).  
3. Token / portal credentials stay server-only (`src/services/rajuk/rajukAuth.service.ts`).  
4. Raster pipeline: tiles → mosaic → polygon mask → GeoTIFF/RAW (`src/lib/gis/*` + `mouzaRasterExport.service.ts`).

### Platform
1. Firebase remains primary auth + application database (see `AGENTS.md`).  
2. Admin authorization is **server-side** (claims / Firestore roles), never client-only.  
3. Domain route failures are isolated via `app/<domain>/error.tsx` + `DomainErrorFallback`.

---

## 4. Layering by concern

### Calculation engines (pure)
- `src/modules/faraez/` — engine, rational, awl, radd, eligibility, validation  
- `src/modules/khatiyan/` — share-normalization, area-allocation, calculations, quick-calculation  
- `src/modules/land/` — plotArea, kani, standards, conversion-integrity  

### GIS infrastructure
- `src/services/rajuk/` — auth, query, layers, plot normalize, mouza raster export  
- `src/lib/gis/` — PNG decode, Web Mercator math, polygon mask, GeoTIFF writer, ZIP  
- `app/api/rajuk/*`, `app/api/mouza-map/*` — HTTP boundary  

### UI features
- `src/features/geospatial-map/` — MapLibre maps, mouza UI  
- `src/features/khatiyan/`, `src/features/faraez/`, `src/features/blog/`  

### Shared platform
- `src/shared/ui`, `src/shared/components`, `src/shared/config`, `src/shared/http`, `src/shared/stores`  

---

## 5. API boundary conventions

- Prefer validated inputs (Zod) at route edges — e.g. `mouzaExportQuerySchema`.  
- RAJUK/ArcGIS traffic goes through server routes; browsers do not hold portal tokens.  
- Error responses should remain JSON `{ error: string }` for GIS routes (existing shape).  

---

## 6. Testing strategy

| Layer | Location | Purpose |
|-------|----------|--------|
| Unit — Faraez | `src/modules/faraez/*.test.ts`, `tests/faraez.*` | rational, awl, radd, conservation, golden |
| Unit — Khatiyan | `src/modules/khatiyan/*.test.ts`, `tests/khatiyan.*` | shares, allocation, standards |
| Unit — Land | `src/modules/land/*.test.ts`, `tests/land.*` | area, kani, conversion |
| Unit — GIS pure | `src/lib/gis/*.test.ts` | projection, mask (no network) |
| Contract — bridge | `src/modules/khatiyan/gis-bridge*.test.ts` | Maps ↔ calculators payload + isolation |
| Service — RAJUK | `src/services/rajuk/*.test.ts` | auth/adapter contracts |

**Commands**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Cross-domain rule: a change under `src/features/geospatial-map` or `src/services/rajuk` must still leave Khatiyan and Faraez unit suites green.

---

## 7. Route inventory (public vs protected)

| Route | Access | Domain |
|-------|--------|--------|
| `/`, `/blog/*`, `/faq`, `/contact`, `/privacy`, `/terms` | Public | Platform / Blog |
| `/khatiyan`, `/faraez`, `/land-measurement`, `/porcha` | Public tools | Domain calculators |
| `/geospatial-map`, `/mouza-map`, `/dap-map` | Public maps | Maps |
| `/login` | Public | Auth |
| `/admin/*` | Staff (server-enforced) | Admin |
| `/api/rajuk/*`, `/api/mouza-map/*` | Public proxy (rate-limited / token server-side) | Maps infra |
| `/api/admin/*` | Admin session | Admin |

---

## 8. Safe change checklist

Before modifying a file:

1. Identify owning domain.  
2. List importers (`rg` / IDE references).  
3. If **shared**, verify all consumers.  
4. Prefer extending contracts over changing shapes.  
5. Run domain tests + full `npm test`.  
6. Do **not** replace bigint/rational math with `number` for convenience.  
7. Do **not** move folders wholesale without a compatibility shim period.

---

## 9. Incremental boundary plan (non-destructive)

Already in place:
- Domain modules under `src/modules/{faraez,khatiyan,land,auth}`  
- RAJUK services under `src/services/rajuk`  
- GIS pure libs under `src/lib/gis`  
- Feature UI under `src/features/*`  
- Domain `error.tsx` isolation for major product routes  

Next increments (when needed, small PRs):
1. Expand `src/shared/config/env.ts` for server-only secrets (without breaking Vercel).  
2. Extract ArcGIS tile client interface used only by `mouzaRasterExport.service.ts`.  
3. Add Blog / Admin contract tests for list/detail/slug.  
4. Reduce remaining `as any` in unified providers.

---

## 10. Related docs

- `AGENTS.md` — non-negotiable product constraints (Firebase, RAJUK, no Supabase/Prisma migration)  
- `docs/architecture/PHASE-0-AUDIT.md`  
- `docs/architecture/PHASE-1-ARCHITECTURE.md`  
- `docs/architecture/PROJECT-STATUS.md`  
