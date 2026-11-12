# 09 — Test and Validation Evidence

Validated code SHA: `242b43977acc99be7c0fa4dfe45b0c9c1395fc83`

## GitHub Actions

### CI
Run ID: 43134518453  
Conclusion: success.

Focused land-record regression:
- Test Suites: 5 passed / 5 total
- Tests: 36 passed / 36 total

Full Jest:
- Test Suites: 103 passed / 103 total
- Tests: 574 passed / 574 total

Lint:
- 0 errors
- 118 warnings

TypeScript:
- pass

Production Webpack build:
- pass

### Cloudflare Compatibility
Run ID: 43134519095  
Conclusion: success.

- Node 22 install: pass
- Typecheck: pass
- OpenNext build: pass
- worker bundle generated
- no build-time Google Font dependency remains

### DLRMS read-only smoke
Run ID: 43134518500  
Conclusion: success.

401/403 from anonymous government discovery endpoints is accepted as an access-policy response, while network/server/invalid-JSON behavior remains a failure.

## Regression areas represented in the passing suite

- server auth and privileged roles;
- proxy/site access;
- route/API registry coverage;
- paid-service guards;
- DLRMS session/provider/reconstruction/provenance;
- duplicate owners and dag fidelity;
- PDF/A4/report geometry;
- GIS/map utilities and source rules;
- Vercel deployment routing policy.

## Not claimed

No authenticated end-user browser session, payment transaction, Firebase mutation, citizen print transaction, or branch visual deployment was executed as part of this branch validation.
