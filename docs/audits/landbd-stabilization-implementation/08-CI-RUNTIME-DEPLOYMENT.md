# 08 — CI, Runtime, Cloudflare, and Deployment Safety

## Node/runtime

Node 22 is the project runtime target and is pinned by package metadata/.nvmrc.

CI uses Node 22 and `npm ci`.

## Standard CI

Validated code SHA: `242b43977acc99be7c0fa4dfe45b0c9c1395fc83`  
CI run: 43134518453

Results:
- install: pass;
- lint: pass;
- typecheck: pass;
- land-record regression suite: pass;
- full Jest: pass;
- Next/Webpack production build: pass.

Next.js 16.3.8 compiled successfully.

## Cloudflare Compatibility

Run: 43134519095  
Result: success.

All build-time `next/font/google` dependencies in root, Warish and Warishsanad layouts were removed and replaced by the repository's local Nikosh Bengali asset plus system fallbacks. OpenNext reports `OpenNext build complete` and writes `.open-next/worker.js`.

Non-fatal upstream/tooling warnings remain:
- OpenNext labels Node.js middleware support experimental;
- nested `data-uri-to-buffer` copy messages are printed for firebase-admin/google-gax even though the bundle succeeds;
- generated dependency code reports duplicate-case/nullish-coalescing warnings.

The LandBD-owned duplicate `addressLine` bundle warning was fixed and is absent in the validated Cloudflare run.

## Production smoke design

The production smoke workflow polls `/api/health` until the exact pushed `main` commit SHA is served, instead of using normal pages that are intentionally challenged by Vercel Bot Protection.

This branch did not change DNS, deploy to production, or merge itself.

## Vercel policy

Owner-approved repository policy is preserved:
- `main: true` for auto-deploy;
- wildcard branches remain disabled;
- only the two pre-existing explicitly reviewed preview branches remain enabled.

Safety tests were updated to match this approved policy rather than the obsolete main-disabled assumption.
