# 04 — DLRMS Data Flow, Fidelity, and Provenance

## Official gateway session

The DLRMS provider obtains a public application session from the official DLRMS site and sends the issued token to the official gateway. Evidence is therefore labeled `public-session`, not anonymous public.

The read-only external smoke now distinguishes:
- 200 JSON: anonymously readable discovery;
- 401/403: gateway reachable but authentication required;
- network/server/invalid JSON: actual smoke failure.

## Third-party mirror

Mirror enrichment is disabled by default.

It runs only when both:
- `DLRMS_ENRICH_ENABLED` is explicitly enabled; and
- `DLRMS_ENRICH_BASE_URL` is explicitly configured.

Mirror failures are non-authoritative and never replace the availability of the official provider.

## Field-level provenance

Provider-level list enrichment now stores, per changed field:
- exact official compact value;
- mirror-enriched value.

The provenance travels through the Khatian API schema as `LANDBD_MIRROR_ENRICHMENT`.

Full-khatian reconstruction restores provider-enriched rows to their first-party official values before reconstruction, then re-applies verified mirror records only through the explicit `DLRMS_MIRROR` path. This prevents mirror-added owners or dags from being relabeled as official.

A dedicated regression test covers the provider-pre-enrichment case.

## Identity and completeness guards

Mirror use requires matching record ID plus khatian/JL identity constraints. Cross-khatian mirror rows are rejected.

Existing safeguards preserved:
- bounded public mouza-index recovery;
- time/page/concurrency limits;
- duplicate owner-row preservation;
- same-name owners remain separate rows;
- owner/guardian linkage is never guessed by list order;
- repeated dag number with distinct class/area variants remains multiple detail rows;
- total-land aliases are normalized;
- no sample/mock values are injected into official records;
- incomplete upstream lists remain visibly partial.

## Source presentation

UI source labels distinguish:
- DLRMS Public;
- DLRMS public app-session;
- Third-party mirror (not official);
- Authorized LISF;
- mock/development sources.

The November 5 audit note was corrected so it no longer claims the mirror is enabled by default.

## Status

DONE; focused land-record suite 36/36 and full Jest 574/574 passed.
