# Cloudflare staging compatibility

Vercel remains the production path. This configuration adds a separately built staging Worker. No deployment or DNS change is part of this repair.

## Build and local preview

Use Node 22 and the committed npm lockfile:

```sh
npm ci --no-audit --no-fund
npm run cf:build
npm run cf:preview -- --port 8787
```

## Staging HTTP release gate

The GitHub Actions workflow **Cloudflare staging HTTP smoke** is a manual,
read-only check for the isolated `landbd-vinext-stage` Worker. Dispatch it with
that Worker’s HTTPS `workers.dev` URL. The workflow rejects other hosts and
checks the homepage, login, `/dap-map`, public health and maintenance endpoints,
anonymous admin denial, and a missing route. It honors the current maintenance
setting, so the expected maintenance `503` is not mistaken for an outage.

This smoke test does not log in, change Firestore, or prove authenticated
Firebase login, admin operations, Firestore reads/writes, PDFs, or RAJUK
functionality. Those remain separate acceptance gates requiring authorized
staging credentials and identities. A successful build or this anonymous HTTP
check alone is not approval for production cutover.

The existing `proxy.ts` remains authoritative for maintenance, Firebase sessions, admin roles, lockout, security headers and page rules. OpenNext 1.20.8's Node proxy support is **experimental**; its maintainers do not guarantee it. Validate protected routes in the local Workers runtime and staging before any production cutover. The obsolete draft's separate gateway must not be deployed alongside this configuration: it duplicates older access rules.

Next 16.3.8 and eslint-config-next are kept aligned with the adapter's minimum Next version. The trace includes in `next.config.ts` supply alternate ESM/browser files selected by the Workers bundler (`@opentelemetry/api`, `uncrypto`, and Firebase Admin's nested `jose`); suppressing unresolved imports or removing authorization would leave a broken runtime.

Firestore stays on the existing Firebase Admin SDK transport. PDF storage uses the R2 `LANDBD_FILES` binding only when `LAND_EXPORT_STORAGE_PROVIDER=cloudflare`; Vercel and Firebase providers retain their selection rules. Porcha reference data is bundled from the same JSON, avoiding a runtime filesystem read.

## Staging prerequisites

Review `wrangler.jsonc` resource bindings against the intended staging account. It uses the R2/D1 resources recorded in the migration draft. Provision isolated resources when staging must not share those cache/file stores. The configured Worker has no custom-domain route; Wrangler development previews use local state.

Configure approved Firebase credentials, the cookie/session configuration and provider variables with the deployment's secret manager. No credentials belong in the config or build logs. Bindings do not prove a remote resource exists or that credentials are valid. Apply OpenNext's D1 cache schema/migrations before a remote deployment. Live Firebase login, NID provider operations and production authorization require separate acceptance with approved identities and credentials.

The compatibility workflow builds only. It uses a frozen install and runs once rather than duplicating the same build in the main CI workflow. A Vercel account build quota cannot be repaired in application code; a fresh PR build shows whether that external limit still applies.

## Current runtime blockers

The Worker build passes, but local requests still fail. The experimental Node proxy loader wraps Next's asynchronous CommonJS export in a way that triggers `Promise.prototype.then called on incompatible receiver`. A diagnostic change to the generated loader reached a second blocker: Firestore's protobuf dependency generates code with `Function`, which workerd rejects (`Code generation from strings disallowed`). That diagnostic artifact change was reverted and is not part of the source repair. A diagnostic attempt with `preferRest` did not eliminate this eager dependency initialization; the source retains the existing Firestore transport.

Do not deploy or cut over this Worker until both blockers are resolved with a supported adapter/Firebase combination and protected-route runtime tests pass. The original gateway draft does not resolve the Firestore server dependency and loses current security policies. Removing authentication or replacing the authoritative Firebase database is not an acceptable workaround. Vercel remains the functioning deployment target.
