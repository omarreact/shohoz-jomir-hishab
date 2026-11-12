# FINAL — LandBD 27-Section Stabilization Implementation Report

Date: 2026-11-12  
Repository: `omarreact/shohoz-jomir-hishab`  
Branch: `fix/landbd-full-stabilization-27-20261112`  
PR: #164  
Base: `de70cf0db299598db20f708bcd90cf1da8337bca`  
Validated code SHA: `9cb22d508f598ea0e8c3e0b5bd93a8b49271c688`

## Overall status

**DONE ON BRANCH — NOT MERGED / NOT DEPLOYED**

The requested 27-section stabilization implementation is complete on PR #164. All executable GitHub code gates pass on the validated code SHA. The PR intentionally remains draft pending owner merge authorization.

## 27-section matrix

| # | Section | Status | Evidence / result |
|---:|---|---|---|
| 1 | Current GitHub source-of-truth baseline | DONE | Branch created from current main; no ZIP overwrite |
| 2 | Secret/env safety | DONE | Only .env.example tracked; env/service-account/capture ignores preserved |
| 3 | Node runtime alignment | DONE | Node 22 target/pin and CI Node 22 |
| 4 | Deterministic dependency/build install | DONE | npm ci passes |
| 5 | Privileged server auth | DONE | Role-authoritative Firebase Admin checks preserved |
| 6 | General full-access elevation removal | DONE | Obsolete server helper removed; Admin-export bypass removed; regression tests |
| 7 | Site-access transient failure strategy | DONE | Last-known-good + cold fail-safe behavior |
| 8 | Public-access override semantics | DONE | LANDBD_PUBLIC_ACCESS explicit opt-in; default false |
| 9 | Central page route registry | VERIFIED | Existing registry preserved |
| 10 | Legacy/canonical route redirects | DONE | /dap-map documented as alias; other aliases preserved |
| 11 | API route/method security registry | VERIFIED | Existing exact method classifications and coverage pass |
| 12 | Admin minimum-role enforcement | VERIFIED | Proxy uses privileged user + route minimum role |
| 13 | Service/payment/usage separation | VERIFIED | Non-consuming browse vs billable enforcement; usage transaction guard |
| 14 | DLRMS official app-session model | DONE | Evidence labeled public-session; anonymous smoke semantics corrected |
| 15 | Mirror opt-in policy | DONE | Disabled by default; explicit enable + URL required |
| 16 | Mirror field-level provenance | DONE | Official/enriched values carried through API schema |
| 17 | Cross-record identity protection | VERIFIED | ID/khatian/JL matching; mismatches rejected |
| 18 | Owner/guardian/dag fidelity | VERIFIED | Duplicate owners preserved; no guardian guessing; dag variants preserved |
| 19 | BRS recovery and total-land fidelity | VERIFIED | Bounded recovery, aliases, dedicated total row/tests |
| 20 | Canonical GIS architecture | DONE | MapLibre /geospatial-map; /dap-map alias; specialized pages independent |
| 21 | GIS coverage/source truthfulness | VERIFIED | No nationwide RAJUK claim; map area not certified ownership |
| 22 | Map UI isolation | DONE | Global AI widget suppressed on all GIS workspaces |
| 23 | Map hooks/accessibility/quality | DONE | Cascade/effect/dependency/stale-state fixes; command combobox semantics |
| 24 | PDF/A4/report fidelity | VERIFIED | Existing report tests pass; source semantics preserved |
| 25 | Root font/layout/runtime quality | DONE | Cloudflare-breaking Noto loader removed; Bengali fallback preserved |
| 26 | CI/Cloudflare/deployment gates | DONE | CI + 574 tests + Webpack + OpenNext + DLRMS smoke all green |
| 27 | Documentation/release evidence | DONE | Architecture docs refreshed; this evidence package added |

## Validation summary

CI run 43133555671:
- lint: 0 errors / 118 warnings;
- typecheck: pass;
- land-record regression: 36/36 tests;
- full Jest: 574/574 tests across 103/103 suites;
- production Webpack build: pass.

Cloudflare Compatibility run 43133555816:
- typecheck: pass;
- OpenNext build: pass;
- prior next/font failure resolved.

DLRMS smoke run 43133555766:
- pass.

Lint improved from the historical 136-warning baseline to 118 warnings without broad eslint suppression.

## Production and safety statement

During this stabilization branch:
- no production deployment was initiated;
- PR #164 was not merged;
- no DNS changes were made;
- no Firebase/Firestore production writes were made;
- no user/account mutations were made;
- no credentials were rotated or exposed;
- no payment transaction was initiated;
- no government citizen token/HAR was replayed.

The repository already has owner-approved Vercel main auto-deploy enabled; this branch preserves that policy but does not trigger it until a future authorized merge to main.

## Known limitations / next release-stage QA

1. Visual browser QA of the unmerged branch is not claimed because no branch preview deployment was authorized.
2. 118 lint warnings remain as incremental technical debt; lint has zero errors.
3. OpenNext emits non-fatal dependency/tooling warnings despite successful worker generation.
4. Cloudflare Node middleware support is marked experimental by OpenNext.
5. External government data availability/completeness remains upstream-dependent; passing mocks/tests never prove all government records are complete.

## Release recommendation

The branch is technically ready for review/merge based on automated validation. Before or immediately after an explicitly authorized release, run authenticated desktop/mobile browser QA for the high-value flows: login/admin role boundaries, /dlrms-khatian representative records, PDF print preview, /geospatial-map, /mouza-map, /rajuk-test, and payment-entitlement behavior without executing a real paid transaction unless separately authorized.
