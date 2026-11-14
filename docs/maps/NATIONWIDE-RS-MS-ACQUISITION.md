# Nationwide cadastral RS/MS acquisition and self-hosting

## Survey model
LandBD must not claim that MS exists nationwide. MS is **Mahanagar Survey**. The national target is:
1. **RS** — verified coverage for every one of the 64 districts.
2. **MS** — complete where an official Mahanagar Survey applies, otherwise `not-applicable` with official evidence.
3. **BS/BRS/BDS** — current/fallback official survey material where relevant; never silently substituted for RS.

Never fabricate a missing survey, infer legal parcel lines from satellite imagery, or present a raster scan as a verified vector boundary.

## Official registry
Machine-readable source/coverage state: `data/maps/national-cadastral/catalog.json`.
- https://map.settlement.gov.bd/
- https://map.land.gov.bd/
- https://settlement.gov.bd/Map/MapSearch
- https://masterplan.rajuk.gov.bd/ (RAJUK area only)
- https://nsdi.gov.bd/ (supporting data, not a DLRS cadastral substitute)

Public viewing/search does not equal redistribution permission. Paid/authenticated/licensed files are stored or republished only when acquisition metadata records the applicable rights.

## Intake contract
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
npm run maps:cadastral:mark -- --district 26 --survey RS --state complete --evidence https://map.settlement.gov.bd/ --write
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
- all 64 RS declarations are `complete`, with official evidence and published self-hosted assets;
- every MS declaration is either verified `complete` where applicable or `not-applicable` with official evidence;
- each asset has SHA-256, size, official source, acquisition date, rights basis and storage authorization;
- public-map assets explicitly allow redistribution;
- scans reach a map-usable published stage (georeferenced/vectorized as required);
- `npm run maps:cadastral:coverage -- --strict` succeeds;
- final map/browser QA passes against self-hosted data.

The catalog starts at zero self-hosted assets on purpose. A working pipeline or a public upstream viewer is not equivalent to legally acquiring the national cadastral dataset.
