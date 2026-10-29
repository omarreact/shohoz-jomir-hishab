# LandBD OpenNext: Cloudflare Workers Builds setup

This document addresses the Cloudflare build failure on 2026-10-29:

```
Executing user deploy command: npx wrangler deploy
ERROR Could not find compiled Open Next config, did you run the build command?
```

The failure occurs when Cloudflare runs the Wrangler deploy command **before** `opennextjs-cloudflare build` generates `.open-next/` artifacts.

## Settings on the Cloudflare Worker (Settings > Build)

Keep `main` as the production source, but **do not restart production deployments before runtime smoke tests**. For a dedicated isolated staging Worker, configure:

- Root directory: repository root.
- Build command: `npm run cf:build`.
- Deploy command: `npx wrangler deploy`.
- Build environment: `NODE_VERSION=22` (or use the repository `.nvmrc` with `22`).
- Do not use `npm run build` as the Cloudflare build command: that only builds Next.js and does not produce the OpenNext Worker artifacts.

Alternatively, if the dashboard only permits configuring one deploy command, use `npm run cf:deploy`, which runs the OpenNext build then Wrangler. **Do not configure both `npm run cf:build` and `npm run cf:deploy` simultaneously**, because that would build twice.

## Scope / safety

This PR adds the version pin and a manually selectable script, not Cloudflare deployment settings. Vercel continues using the existing `npm run build` path. No DNS changes, billing upgrades or production deployments are performed.

**Important:** This fixes the missing compiled OpenNext config build error only. Existing Firebase Admin / Firestore gRPC / protobufjs code generation cannot run as-is in Workers. After building successfully, Cloudflare Worker may still throw HTTP 500. Verify authentication and authorization thoroughly before any production cutover.

References:
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
