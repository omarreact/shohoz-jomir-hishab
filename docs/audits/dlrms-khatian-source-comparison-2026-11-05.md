# LandBD — DLRMS khatian source-comparison audit

## 2026-11-05 authenticated HAR follow-up

An additional, user-provided **citizen-session HAR** was analyzed after the earlier homepage-only audit. This is a different evidence set from the 93-request homepage urlscan noted below. The raw HAR remains private and is **not** committed because it includes citizen data and authentication credentials.

- This capture records public-index BRS lookup, official checkout/payment, invoice and authenticated print-khatian for one record. The authenticated print payload has `data.khatian.OWNERS[]`, `DAGS[]`, nested `MOUZA`, and `MOUZA_JL_NUMBER`; it **does not include** `khatianPages[]`.
- Public index `ID` and authenticated print `khatian.ID` are separate values. Identity matching must rely on survey, khatian number, JL/mouza and authorized application context; never join on a shared numeric index ID.
- An additive print normalizer now supports both structured rows and prior `khatianPages[]` responses. It excludes NID, mobile, birth registration and other citizen identifiers from normalized output, while retaining the row-linked name, father, guardian/address and dag/area fields for the authorized user.
- Its exact-decimal area total is a sum of captured raw dag areas, **not** a declaration of certified acreage or independently proven area units.
- The new redacted test fixture uses fictional names/IDs; mock test passing does not establish current live entitlement, government API approval or production deployment status.
- No user credentials, auth headers, payment transaction IDs or raw HAR responses are stored in this repository. Live authenticated API calls require the citizen's current government login and permitted access. Payment requests must never be replayed from a HAR.

Checked 2026-11-05. Status: **QA-only**, not a certified government record.

## Evidence categories

- **First-party, previously verified (2026-10-09 audit):** DLRMS public API returned HTTP 200 for Patira BRS-349 search and detail, record ID `7940305`. Owners and dags ended in ellipses; there was no guardian field, structured owner/guardian linkage, owner share, or per-dag land class/area. The earlier audit was performed on a different date and is not a November 5 live response.
- **User-supplied PDF mock/sample:** `LandBD-BRS-পাতিরা-349-A4-Landscape-Fixed-Sample*.pdf` visually displays eight owner names, four guardian entries and four dag numbers, along with total land 0.338 acres. The document says to verify against government records before legal use. It is a design/data sample, NOT proof that the DLRMS API currently publishes these values. Never copy these sample entries into live production records.
- **Historical authenticated print analysis:** Past discussion analyzed successful Patira RS-35 and RS-37 `print-khatian` responses. The original HAR bytes are not currently available here; details remain historical analysis notes, not a fresh authenticated query. No RS→BRS cross-record merge is permissible.
- **Historical RS-41 public analysis:** A previously analyzed search reportedly contained 28 owners and 20 dags. This does not establish a certified print or completeness, and cannot be assigned to BRS-349.
- **Third-party mirror:** Code uses `eporcha.tech/api/dlrms` by default. A matching record ID/JL is an identity check, not source certification. The code must separate `DLRMS_MIRROR` from first-party `DLRMS_PUBLIC`.
- **Authorized LISF:** May contain additional structured data only if the service is actually authorized, configured, returns a matching record and passes field validation. The environment flag alone does not prove any fields were returned.
- **Jest/mock fixtures:** Artificial source payloads prove software behaviour, not real owner/dag counts. For example, a mock BRS-312 case has three owners and nine distinct dags, with two land-class rows under dag 1948.

## Comparison matrix

| Source / record | Identity | Data available | Missing or not verified | Grade |
|---|---|---|---|---|
| DLRMS public BRS-349 | Survey BRS, ID 7940305, JL_NUMBER_ID 382911, Mouza ID 71947, JL 5 | Khatian number, truncated owner and dag compact strings, total land, district/upazila/mouza IDs/names | All owners, guardian relationships, owner share, per-dag area/class | Verified 2026-10-09; historical |
| LandBD BRS-349 PDF sample | BRS, Patira, khatian 349 | Eight owners, four listed guardians, four dags (1974, 1977, 1990, 2006), 0.338 acres | Whether sample names are complete government data; individual guardian mappings | Mock/sample only |
| DLRMS RS-35 / RS-37 | Patira RS; IDs 43017609 / 43014956 in earlier analysis | Authenticated print output reported historically | Raw HAR presently unavailable; current API access unverified | Historical notes only |
| DLRMS RS-41 | Patira RS, prior public search | Reported 28 owners, 20 dags | Current API response/official certified copy | Historical notes only |
| Homepage urlscan | DLRMS home | 93 HTTP transactions; gateway divisions, surveys, upazilas, statistics | **No completed khatian search or print request** | Captured 2026-11-05 |

## Verified gateway request shapes from the earlier audit

First-party base: `https://gateway.dlrms.land.gov.bd/core-api/api/public`

- `GET /index-khatian/BRS?SURVEY=BRS&JL_NUMBER_ID=382911&KHATIAN_NO=349&PAGE_NO=1&PAGE_SIZE=10`
- `GET /index-khatian/BRS/7940305`

LandBD additionally implements `OWNER` and `DAG_NUMBER` parameters for advanced search; those request variants were *not captured* by the November 5 homepage-only urlscan. A matching owner name alone does not prove identity. Verify survey, record ID, JL number, khatian number and mouza; canonicalize Bengali/Latin numerals, account for pagination and truncation.

## Implementation audit and changes

1. **Fixed in QA branch:** Original `full-khatian-service.ts` tagged mirror structured owners/dags as `DLRMS_PUBLIC`, despite `official:false` evidence. Added `DLRMS_MIRROR`, readable source label and explicit warning. New compact owner/dag names introduced after mirror fetch are tagged as mirror-derived.
2. **Fixed in QA branch:** `buildDagRows` used `Map<dagNo, row>`, overwriting distinct class/area rows for the same dag ID. Preserve every sourced variant and structured-only dag IDs; distinct dag count excludes repeated class rows.
3. **Already in PR #148:** Duplicate-name owner handling, source-linked guardian display, partial-cache retry, incomplete-PDF guard, citizen print checks and tests. These improve rendering, but do not create missing official source data.
4. **Follow-up risk:** DLRMS provider can merge third-party mirror data into the exact-index list *before* the full service receives it. This earlier stage still needs field-level source provenance through the API/Zod schema; do not infer all list-enriched fields are first-party official just because `DLRMS_PUBLIC` remains the base.
5. **Follow-up risk:** A third-party list that lacks an ellipsis may look complete, but that does not independently certify completeness. Use visible warnings and do not call such data a legally certified record.
6. **Authorized government print:** Keep paid/authenticated citizen print behind its existing authorization and payment gates. An earlier HAR's tokens/cookies must never be committed, reused, or sent to another origin.

## QA and release gates

- GitHub lint, TypeScript, land-record regressions, full Jest suite and Webpack production build pass.
- Official ID/JL/mouza checks and source tags prevent cross-record matching or third-party content being called government-issued.
- UI displays any verified father/guardian relationship only when linked by a structured record, never paired by separate list order.
- One dag with several class/area variants renders multiple detail rows but counts as one distinct dag.
- When official source fields are partial, the UI says so; no sample/mock data is injected.
- **No production release authorized by this audit.** Verify Vercel protected browser flows and actual sanctioned government data before deployment.

### Sources reviewed

- `LandBD-DLRMS-Data-Audit.md` — historical first-party public API audit, 2026-10-09.
- `LandBD-BRS-পাতিরা-349-A4-Landscape-Fixed-Sample*.pdf` — visual PDF sample.
- `download(1).json` and `dlrms.land.gov.bd - urlscan.io.pdf` — 2026-11-05 homepage capture (no record detail).
- Earlier conversation's authenticated RS HAR **analysis notes** — raw authenticated responses not available for this audit.
- Repository `omarreact/shohoz-jomir-hishab` PR #148 and this QA branch.
