# Administrative NID verification

Canonical UI: `/admin/nid-verification`. The draft's `/nid_dob` URL redirects there. Both the request proxy and the API require Firebase administrator access; client visibility is for presentation only. The API is registered with admin access and returns no-store responses.

The Porichoy integration defaults to disabled. Enable only with approved provider credentials and authorization for the intended use: `PORICHOY_ENABLED=1`, `PORICHOY_API_KEY`, optional `PORICHOY_TIMEOUT_MS` (3000–30000). The official HTTPS endpoint is the default. Custom HTTPS hosts require the explicit `PORICHOY_ALLOW_CUSTOM_HOST=1` setting and `PORICHOY_BASE_URL`; `PORICHOY_NID_PATH` overrides only the path. No real identity fixture or provider key belongs in this repository.

GET `/api/nid-dob/verify` exposes availability to administrators without provider calls. POST requires consent, a valid NID/date, matching provider identity, and rate limiting. Returned identity data stays in component memory; the page provides no persistent storage or export. Synthetic tests cover authorization, unavailable provider state, normalization and mismatched identities.
