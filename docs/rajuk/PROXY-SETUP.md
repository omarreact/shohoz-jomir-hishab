# RAJUK FeatureServer Proxy

## Authentication

The RAJUK deployment uses two ArcGIS credentials:

1. `RAJUK_PORTAL_TOKEN` — Portal Token 1. This is the credential accepted by `/portal/sharing/rest/generateToken`.
2. The response from that exchange is the federated Server Token 2. It is cached server-side and is never returned to the browser.

Do **not** put Token 2 in Vercel environment variables unless you deliberately need a fixed emergency credential. The application refreshes Token 2 from Token 1.

`RAJUK_API_KEY` is retained only as a legacy alias for `RAJUK_PORTAL_TOKEN`.

## Vercel variables

Set these as Production environment variables:

```text
RAJUK_PORTAL_TOKEN=<authorized Portal Token 1>
UPSTASH_REDIS_REST_URL=<Upstash REST URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash REST token>
```

If `RAJUK_PORTAL_TOKEN` is absent, the code falls back to `RAJUK_API_KEY` for existing deployments.

## Proxy

```text
GET /api/rajuk/1?where=1%3D1&outFields=*&resultRecordCount=500
```

The route forces `f=geojson`, strips unsupported query parameters, tries the layer anonymously first, and only requests a federated Server Token after an ArcGIS 498/499 (or HTTP 401/403) response. A token-invalid retry invalidates the Redis entry and exchanges a fresh Token 2 once.

## Plot/District API

The existing `/api/rajuk/query` route uses the same authentication service. Districts are layer 10, Upazilas layer 9, Mouzas layer 1, and RS plots layer 0.

## Export

```bash
npm run rajuk:export
```

The exporter requests pages using `resultOffset` and `resultRecordCount` and streams each feature directly to the output file so it does not retain the entire FeatureCollection in memory.

## Diagnostic

```text
GET /api/rajuk/auth/diagnose
```

This endpoint never returns the token. It reports whether the configured credential can generate a server-scoped token and whether Upstash is configured.
