# Nationwide cadastral RS/MS acquisition and self-hosting

## Survey model
LandBD must not claim that RS or MS exists uniformly in every modern district. The national target is:\n1. **RS** — resolve applicability for all 64 districts; acquire complete authorized coverage where an official RS survey applies, otherwise record `not-applicable` with official evidence.\n2. **MS** — DLRS identifies Mahanagar Survey as a Dhaka metropolitan survey; acquire it for its applicable Dhaka scope and record other districts `not-applicable` with official evidence.\n3. **DC/City Survey is not automatically MS.** Keep it separate until official survey metadata proves equivalence.\n4. **BS/BRS/BDS** — current/fallback official survey material where relevant; never silently relabelled as RS/MS.

Never fabricate a missing survey, infer legal parcel lines from satellite imagery, or present a raster scan as a verified vector boundary.

## Official registry
Machine-readable source/coverage state: `data/maps/national-cadastral/catalog.json`.
- https://map.settlement.gov.bd/
- https://map.land.gov.bd/
- https://settlement.gov.bd/Map/MapSearch
- https://masterplan.rajuk.gov.bd/ (RAJUK area only)
- https://nsdi.gov.bd/ (supporting data, not a DLRS cadastral substitute)\n- https://dlrs.gov.bd/pages/static-pages/6922e15c933eb65569e2bb33 (official survey-history/applicability reference)

Public viewing/search does not equal redistribution permission. Paid/authenticated/licensed files are stored or republished only when acquisition metadata records the applicable rights.

## Official DLRMS survey-applicability inventory
The public DLRMS administrative metadata can be scanned without requesting khatian/owner data:
```bash
npm run maps:cadastral:survey-inventory
```
The inventory records district/upazila survey availability only. The verified 2026-11-14 run covered 64 districts / 527 upazilas with 0 failed queries and observed RS metadata in 59 districts. The five non-observed districts are Bandarban, Gopalganj, Khagrachhari, Lalmonirhat and Rangamati; they remain unverified, never auto-marked not-applicable. The compact evidence snapshot is `data/maps/national-cadastral/dlrms-rs-survey-summary.json`.

## Candidate archive quarantine\nBefore official ingest, audit any copied/shared scan archive locally:\n```bash\nnpm run maps:cadastral:audit-candidate -- --root ./candidate-maps --out ./candidate-report.json\n```\nUse `--require-clean-provenance` when a pipeline must fail on third-party-branded files. The scanner inventories filenames, bytes, formats and survey hints only; it never uploads/publishes or claims legal authority. A folder named `City Survey` is reported separately and is not auto-converted to MS.\n\n## Intake contract
Keep acquired binaries outside Git. Each file needs a same-name `.meta.json` sidecar.

```text
incoming/cadastral/RS/26/rupganj/patira/sheet-1.tif
incoming/cadastral/RS/26/rupganj/patira/sheet-1.tif.meta.json
```

```json
{
  "survey": "RS",
  "districtBbsCode": "26",
  "upazilaBbsCode": "26",
  "mouza": "পাতিরা",
  "jlNumber": "110",
  "sheet": "1",
  "stage": "raw",
  "sourceId": "dlrs-map",
  "sourceUrl": "https://map.settlement.gov.bd/",
  "acquiredAt": "2026-11-14T00:00:00Z",
  "rightsBasis": "Official purchase/licence/authorization reference",
  "storageAuthorized": true,
  "redistributionAllowed": false
}
```

## Commands
Prepare explicit open official asset URLs in `data/maps/national-cadastral/intake.json`. The fetcher accepts only Bangladesh government HTTPS URLs, follows redirects only when the final host remains `.gov.bd`, rate-limits requests, and does not use cookies or bypass authentication/payments.

Plan fetches without network writes:
```bash
npm run maps:cadastral:fetch -- --root ./incoming/cadastral
```
Execute only after reviewing the source terms recorded in the manifest:
```bash
npm run maps:cadastral:fetch -- --root ./incoming/cadastral --execute --acknowledge-source-terms
```

Dry-run ingest:
```bash
npm run maps:cadastral:ingest -- --root ./incoming/cadastral
```
Write reviewed metadata:
```bash
npm run maps:cadastral:ingest -- --root ./incoming/cadastral --write
```
Validate current ledger:
```bash
npm run maps:cadastral:coverage
```
Strict 100% gate (intentionally fails until every required official asset/evidence is acquired):
```bash
npm run maps:cadastral:coverage -- --strict
```
Mark verified coverage:
```bash
npm run maps:cadastral:mark -- --district 26 --survey RS --state complete --evidence https://map.settlement.gov.bd/ --confirm-full-district --write
```
MS not applicable requires official evidence:
```bash
npm run maps:cadastral:mark -- --district <BBS> --survey MS --state not-applicable --evidence <official-gov-bd-url> --write
```

## Cloudflare R2
Existing target: `LANDBD_FILES` / `landbd-files`; namespace: `national-cadastral/v1/`.

Plan only:
```bash
npm run maps:cadastral:upload-r2 -- --root ./incoming/cadastral
```
Explicit execution:
```bash
npm run maps:cadastral:upload-r2 -- --root ./incoming/cadastral --execute --acknowledge-storage-costs
```
Do not execute until storage cost and legal storage/redistribution rights are approved.

## 100% definition
Nationwide acquisition is complete only when:
- 64 unique districts validate;
- all 64 RS declarations are resolved to either verified `complete` where applicable (with published self-hosted assets) or `not-applicable` with official evidence;\n- all 64 MS declarations are resolved similarly; DLRS evidence establishes Mahanagar Survey as Dhaka-metropolitan-only, while Dhaka still requires the authorized complete dataset;
- each asset has SHA-256, size, official source, acquisition date, rights basis and storage authorization;
- public-map assets explicitly allow redistribution;
- scans reach a map-usable published stage (georeferenced/vectorized as required);
- `npm run maps:cadastral:coverage -- --strict` succeeds;
- final map/browser QA passes against self-hosted data.

The catalog starts at zero self-hosted assets on purpose. A working pipeline or a public upstream viewer is not equivalent to legally acquiring the national cadastral dataset.
