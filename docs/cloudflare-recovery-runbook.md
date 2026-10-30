# LandBD Cloudflare recovery and production release gate (2026-10-30)

## Confirmed incidents
- `shohoz-jomir-hishab` currently stores a placeholder `Hello world` Worker, not the compiled Next.js app. Its original Workers Builds trigger had an empty build command and attempted Wrangler OpenNext deployment before compiling.
- `landbd-app` OpenNext runtime failed with `Error in routingHandler` from middleware.
- `landbd-vinext-stage` previously returned HTTP 500 due to `Code generation from strings disallowed for this context` from the Firestore/protobuf dependency path.
- The placeholder Worker had sensitive names configured as `plain_text` bindings, including `FIREBASE_PRIVATE_KEY`, `RAJUK_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `LANDBD_LOCKOUT_SECRET` and `VERCEL_OIDC_TOKEN`. **Treat those values as exposed to anyone with configuration-view access.**

## Safety actions
- The public `landbd.pincodeit.com` hostname has been restored to a verified `CNAME` pointing to Vercel, DNS-only, while the placeholder Worker binding was detached.
- Keep the Vercel production deployment available as a rollback.
- The compiled Vinext app may only deploy to `landbd-vinext-stage.farukkhanone.workers.dev` until the runtime and access gates pass.

## Required credential remediation (Cloudflare dashboard)
1. In Workers & Pages, select `shohoz-jomir-hishab`, open Settings > Variables and Secrets.
2. For each sensitive plaintext variable, use Edit and change Type to **Secret**, never copy values into GitHub, screenshots, build logs or chat.
3. Rotate the Firebase service-account private key through its owner console and update only authorized server backends; review use of RAJUK and blob tokens for rotation. Do not reuse old exposed secrets.
4. Do **not** migrate build-only `VERCEL_*` variables indiscriminately. Do not treat a Firebase web API key as a privileged admin credential.
5. Configure required secrets on **each** isolated Worker separately; Cloudflare secrets are not automatically shared across Workers.
6. Verify that Auth refuses invalid/revoked tokens, blocked accounts and non-admin claims; validate maintenance mode and Firestore authorization before production.

## Workers acceptance gate
- GitHub CI: typecheck, regression tests, Vinext compile, secure anonymous route restrictions.
- Live isolated stage: `/api/health` must identify LandBD/Cloudflare/staging; public pages respond without 500; `/api/public/maintenance` is correct; anonymous `/admin` and `/api/admin/health` are denied; 404 and redirects stay on the stage origin.
- Authenticated tests using approved test identities: Firebase token verification and revocation, Firestore reads/writes, maintenance policy, protected admin routes, RAJUK provider requests, R2/PDF generation, user-session and rate-limit behavior.
- No workaround may replace protobuf encoder/decoder methods with no-op functions or bypass privileged authorization.
- Do not attach `landbd.pincodeit.com` to any Worker until **every** relevant check passes and a rollback has been confirmed.

## Runtime build
- Use the Vinext staging branch and `npm run build:vinext`, never just `wrangler deploy` against the main OpenNext project without compiling it.
- `FIRESTORE_PREFER_REST=true` favors Firestore HTTP transport but is *not* proof that the Node Firebase Admin SDK is fully compatible with Workers. Verify all Firebase Admin operations under the actual Worker runtime.

This plan intentionally keeps Cloudflare staging and the public production service separate.
