# RAJUK PDF/JSON validation — admin-only workspace

Route: /admin/rajuk-validation (Firebase Admin/Super Admin only; the proxy's administrative RBAC applies).
Branch: feat/rajuk-local-validation-page-20261111.

## Source contract and privacy

The original data files are not committed to the public repository:

- rajuk1.pdf (86,332,194 bytes)
- rajuk1_full_object_oriented.json (26,609,039 bytes)
- rajuk1_qa_report.json (114,270 bytes)

The admin opens the page after login and selects each file in the browser. Parsing and review are client-only; there is no API upload, Firestore write or network import endpoint. Data and review edits exist only in browser memory until a reviewer explicitly exports a JSON review file. The exported file can later be imported after loading the **matching** source JSON. Do not store original extracted names/deed data in the public repository.

Expected source fingerprint: SHA-256
974d7a0883b6fbf7a2567bac6f582576c0cc6667dbf6234748bfe4a0dc4239aa

The page offers opt-in SHA-256 verification for the original PDF. The large PDF is read into browser memory only when the reviewer starts that check. PDF page jumps depend on the browser's own PDF viewer.

## Reusable views

1. Overview — counts and source fingerprint. Before upload the figures are labeled reference values, not inspected session data.
2. Source pages — select a PDF page, including exceptional pages 328 and 401, and compare extracted rows to the original document.
3. Records — search by plot/record/name/mouza/RS dag, select a row, flag fields unreadable/ambiguous/manual/verified, and export a single draft staging mapping.
4. Relationships — browse mouza → RS dag → plot relationships from the original indexes. Region/map-sheet/geometry fields remain null.
5. Schema — display source hierarchy and the tentative LandBD staging structure, including explicit missing values.
6. Import readiness — source structural checks, original PDF fingerprint, unverified GIS join, and missing real importer contract. Import is **always disabled**.
7. Issues — source anomaly summary and optional full 31-issue QA report import. Update review statuses and export them.
8. Acceptance & QA — manual checklists for source coverage, structure, permissions and desktop/tablet/mobile; export/reimport review progress.

## Known data-quality boundaries

Independent local evidence check (2026-11-11):

- 634 PDF pages, 633 schedule pages, one intentionally blank page 328
- 28 sectors, 1,635 sector-road groups, 24,727 unique plots, 38,203 source records
- 38,174 linked records + 29 unresolved plot identifier records
- 58 recovered nonstandard identifiers account for difference between source direct extraction and final rows
- No duplicate record IDs or orphan mouza/RS dag index plot links detected
- Source PDF page 401 / table row 46: 43 RS dag values and 22 mouza values, not safe to zip by position
- 14,013 missing Bengali names, 1,267 missing English names, 10,796 missing katha values and 1,473 missing raw RS dag fields

The document is a plot schedule transcription, not an authoritative ownership register or GIS parcel geometry. Never infer legal ownership or fill region ID, map sheet ID or geometry without independent evidence.

## Local QA before review

From the project root:

- npm run typecheck
- npm run lint
- npm test -- --runTestsByPath src/features/rajuk-validation/source.test.ts
- npm run build

Manual review (Firebase Admin test account; staging only):

1. Verify anonymous /admin/rajuk-validation redirects to /login and non-admin user receives 403.
2. Verify admin navigation contains RAJUK JSON validation.
3. Upload JSON and confirm counts, record search and source-page provenance.
4. Upload PDF and confirm SHA-256 and page navigation; check pages 2, 328, 401 and 634.
5. Upload QA report and confirm 31 source issue cards plus the summary issue list.
6. Verify row flags, import/export of matching review JSON, and mismatch rejection.
7. Check 1440px desktop, 768px tablet and 390px mobile, keyboard navigation, long text and table overflow.
8. Verify absolutely no network writes, Firestore changes, auto-deploys, merges or external transmissions.

This is a development-only change. No merge, PR auto-deployment, DNS change, production deployment or destructive operation is authorized. Firebase remains the source of truth for LandBD authentication and application data.
