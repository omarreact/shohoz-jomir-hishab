# LandBD Routing Replanning — Phased Implementation

Last updated: 2026-10-09
Project: `omarreact/shohoz-jomir-hishab` → Vercel `shohoz-jomir-hishab`
Canonical production origin: `https://landbd.pincodeit.com`

## Non-negotiable constraints

- Do not change public destination URLs or existing khatian/GIS/report functionality in the initial phase.
- Firebase Authentication custom claims remain the role authority, and Firestore remains the page-access policy source.
- Firestore page rules can make a route more restrictive, never downgrade sensitive member/Admin paths to public.
- A browser-visible button or route guard is not an API security boundary. Protect sensitive data within server endpoints.
- A GitHub merge is not a production deployment. Verify deployed commit and alias before announcing live success.
- Avoid one Vercel preview deployment per intermediate commit. Create one atomic branch commit and run CI.

## Phase 1 — Routing foundation (implemented in initial PR)

1. Create one shared React authentication provider. Stop independent Firebase session listeners in each `useAuth` consumer.
2. Preserve requested safe post-login paths; send staff to `/admin` and regular accounts to `/` when no path is supplied. Deny direct nonstaff Admin return paths.
3. Centralize the inventory of Admin routes, minimum roles and legacy URLs in `src/shared/routing/route-registry.ts`. Keep `PAGE_ACCESS_PAGES` as the source for editable Firestore page policies.
4. Reuse the Admin route role registry in `proxy.ts` and `app/admin/layout.tsx`.
5. Normalize `/khatian`, `/survey-khatian`, `/map` and `/dap-map` to one-hop permanent redirects in Next config.
6. Classify `/porcha` and `/nid-copy` as logged-in minimum routes; enforce their sensitive data endpoints server-side.
7. On Firestore failure, preserve a known previous maintenance setting, instead of silently disabling an observed maintenance lock.
8. Remove noindex certificate editors and member-only pages from the public sitemap.
9. Add route-coverage, role matrix, redirect and member endpoint regression tests.

## Phase 2 — Structural route groups (next isolated PR)

Proposed directories retain current URL paths:

- `app/(public)/` — normal public chrome (header/footer)
- `app/(member)/` — member-specific workspaces and navigation
- `app/(immersive)/` — fullscreen GIS without standard site chrome
- `app/(control)/admin/` — Admin shell and nested staff routes
- `app/(system)/` — login, 403, maintenance

Move files one feature family at a time, ensuring relative imports and CSS PDF capture selectors continue to work. Replace `ConditionalShell` pathname conditions with route-group layouts only after tested parity.

## Phase 3 — Navigation & deep-link hardening

- Derive desktop, mobile, staff navigation, breadcrumbs, sitemap and search suggestions from route metadata.
- Test history and filter URL persistence; hard-refresh data/result views; legacy QR and verification URLs.
- Avoid navigation flashes on maintenance rewrites, expired sessions and slow Firebase startup.
- Add consistent not-found, forbidden and temporarily-unavailable pages.

## Phase 4 — API classification

- Inventory all 73 API paths as anonymous-read, authenticated-read, staff-only, mutation or operational.
- Authenticate and authorize in each handler, independently from Proxy.
- Add per-route limits, server-side cache policy and structured error responses.
- Treat personal information, QR verification and report endpoints as sensitive.

## Release gates

1. ESLint, TypeScript, Jest and production build pass.
2. Every non-system page is in the registry; new pages fail CI if unclassified.
3. Test anonymous, member, editor, admin and super admin.
4. Test maintenance on/off, cold Firestore, known stale lock, invalid token, revoked token.
5. Validate `/dlrms-khatian` and `/mouza-porcha-report` styling, PDF preview/download and orientation.
6. Validate geospatial map public basemaps and member-only tools.
7. Verify that production Vercel alias serves the merged main commit.

## Known unresolved work

- Make unknown dynamic pages and route aliases observable with structured metrics.
- Perform real authenticated browser smoke tests (GitHub CI alone cannot verify Firebase user-specific browser behavior).
- Completely move to grouped App Router layouts and remove the old conditional shell.
- Expand API authorization audit to every handler and minimize public/private data leakage.
- Resolve first-instance policy uncertainty during a Firestore outage through a durable, signed policy source rather than relying solely on in-memory stale state.
