# LandBD Phase 1 Architecture Map

## Baseline

- Branch: `refactor/phase-1-architecture`
- Base: `main` at `7c93b7c35037f228afe6a49fac61ec183500a360`
- Framework: Next.js App Router + TypeScript
- Public shell: `app/(site)` + shared shell components
- Admin: `app/admin`
- GIS: `app/dap-map`, `app/lios-map`
- Domain services: `src/services/*`
- Shared infrastructure: `src/shared/*`

## Target dependency direction

```text
app routes
  -> feature components/hooks
      -> domain services
          -> external providers / database

shared UI/components must not import feature-specific services.
UI must not call external RAJUK/ArcGIS services directly.
Admin authorization stays server-side.
```

## Current feature boundaries

### Records / Khatian
- Route: `app/khatiyan`
- Related APIs/services must be grouped under a records domain.
- Candidate target route: `/records` with `/records/khatian` compatibility redirect.

### Land measurement
- Route: `app/land-measurement`
- Calculation logic should move toward a pure domain engine under `src/features/land-measurement`.

### Inheritance / Faraez
- Route: `app/faraez`
- Calculation rules must be separated from React state/UI under `src/features/inheritance/engine`.

### GIS / Urban planning
- Route: `app/dap-map`
- Existing verified services:
  - `src/services/rajuk/rajukAuth.service.ts`
  - `src/services/rajuk/rajukLayers.service.ts`
  - `src/services/rajuk/rajukQuery.service.ts`
  - `src/types/rajuk-runtime.ts`
- Existing API boundary:
  - `app/api/rajuk/query`
  - `app/api/rajuk/metadata`
  - `app/api/rajuk/tile/[layer]/[level]/[row]/[col]`
- These are retained during Phase 1 because they represent the verified external integration. User-facing terminology may be neutralized later without changing provider identifiers.

### Admin
- Route: `app/admin`
- Existing subdomains include blog, custom pages, data monitor, users, settings and health/metrics APIs.
- Admin remains isolated from the public shell.

### Blog / CMS
- Routes: `app/blog`, `app/admin/blog`, `app/admin/custom-pages`
- Keep CMS-specific data access out of shared UI components.

## GIS architecture decision

Do not merge the verified RAJUK FeatureServer query service with generic tile infrastructure.

```text
Map UI
  -> LandBD GIS API
      -> token service
      -> FeatureServer queries
      -> tile proxy

Visualization tiles and attribute queries are separate capabilities.
```

The API key remains server-only via `RAJUK_API_KEY`.

## Authentication boundary

Current authentication uses Firebase plus server-side verification. Phase 1 does not remove Firebase. First trace all consumers of:

- `firebaseClient`
- `firebaseAdmin`
- `next-firebase-auth-edge`
- `serverAuth`
- `proxy.ts`

Only unused/duplicated authentication paths should be removed after dependency verification.

## Shared shell boundary

The current `ConditionalShell` performs shell selection. Target structure:

```text
AppShell
├── PublicShell
│   ├── Navbar
│   └── Footer
├── MapShell
│   └── Navbar + full-screen map
├── AdminShell
│   └── AdminSidebar + AdminHeader
└── AuthShell
```

Migration should preserve behavior while reducing routing logic inside presentation components.

## Theme boundary

Theme tokens belong in the shared design system. Feature components should consume semantic tokens rather than hard-coded color palettes.

Default: light.

Required semantic tokens:

- background
- foreground
- surface
- surface-muted
- border
- muted
- muted-foreground
- primary
- primary-foreground
- accent
- success
- warning
- danger

## Route migration policy

Do not delete existing public URLs abruptly. Introduce canonical professional routes and compatibility redirects where safe.

Initial candidates:

```text
/khatiyan          -> /records/khatian
/land-measurement  -> /land/measurement
/faraez            -> /inheritance
/dap-map           -> /maps/dap
```

Exact migration is deferred until route consumers and SEO metadata are audited.

## Dependency cleanup policy

No dependency is removed solely because it looks redundant. A package must be classified as:

1. Core runtime dependency
2. Feature dependency
3. Infrastructure dependency
4. Duplicate capability
5. Unused

Only categories 4 and 5 are candidates for removal.

## Phase 1 implementation order

1. Establish this refactor branch.
2. Map routes to feature modules.
3. Map API routes to domain services.
4. Trace Firebase/auth consumers.
5. Trace GIS consumers and eliminate duplicate call paths only after verification.
6. Introduce feature-level boundaries without changing external behavior.
7. Introduce canonical route aliases/redirects.
8. Run typecheck/lint/build and route smoke tests.
9. Proceed to Phase 2 design-system consolidation.
