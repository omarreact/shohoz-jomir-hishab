# LandBD Production Routing QA — Phase 5

## Automated / anonymous verification

Run `SMOKE_BASE_URL=https://landbd.pincodeit.com node scripts/qa/live-routing-smoke.mjs` on a trusted machine or an approved CI worker.

Checks:
- Public page status and content reachability in normal mode
- Maintenance OFF/ON branch and login escape
- One-hop canonical redirect mappings with correct target and query-preserving behavior
- Admin login return path and anonymous API denial
- Explicit API inventory coverage and endpoint-local authorization checks in Jest

The smoke script uses **GET only**, no cookies, no writes or credentials. Never use real personal data in public CI logs.

## Authenticated browser verification (must use authorized test identities)

Carry out in a real browser/Playwright context with **test accounts**, not user secrets in prompts or PR logs. Test each matrix cell independently, with a fresh isolated session for each role.

| Workflow | Guest | Basic User | Editor | Admin | Super Admin |
|---|---|---|---|---|---|
| Homepage, calculators, basic GIS | public (maintenance OFF) | yes | yes | yes | yes |
| /porcha & /nid-copy member data | login | yes | yes | yes | yes |
| Admin dashboard /admin | login | 403 | yes | yes | yes |
| /admin/blog, /admin/custom-pages | login | 403 | yes | yes | yes |
| /admin/users, /admin/settings | login | 403 | 403 | yes | yes |
| /admin/page-access, /admin/audit-log | login | 403 | 403 | 403 | yes |
| QA map /rajuk-test | login | 403 | 403 | yes | yes |

For each session, test:
1. Direct URL, refresh, back, forward, nested deep link and query-string persistence.
2. Login with `?from=` and no `?from=`, logout, token refresh and expired token.
3. Navbar, mobile tab menu, Footer, Admin sidebar, command search and active-state highlighting.
4. `/dlrms-khatian`: division → district → mouza → khatian → details → QR → PDF preview/download, verify survey orientation and typography.
5. `/mouza-porcha-report`: selection → data → result → QR → PDF preview/download.
6. `/geospatial-map`: anonymous basemap, search, identify; authenticated RS/MS advanced layers and opacity.
7. A blocked API GET and mutation for each account tier (status, body shape and no data disclosure).
8. Maintenance ON anonymous 503, authenticated route access and OFF restoration.
9. Firebase Admin unavailable/Firestore degraded: fails closed for privileged routes and logs policy degradation.
10. Network and Vercel error logs; ensure no secret-bearing responses.

## Release gates

- CI: ESLint, TypeScript, regression Jest, production build
- Vercel preview READY at exactly the tested SHA
- Main branch CI success
- Production deployment READY with `landbd.pincodeit.com` alias at merged SHA
- Anonymous smoke and authorized interactive browser matrix pass separately; do not claim E2E coverage on CI alone

## Known limits

Public records fetched from external land services may be intermittently unavailable. Distinguish provider errors from internal route errors. A test must never assert a third-party response succeeded without checking it. Browser sessions with authorized test Firebase users are necessary for full authenticated QA.
