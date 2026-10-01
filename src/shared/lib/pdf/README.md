# LandBD PDF and print standard

All **LandBD-generated** printable documents and PDF downloads must follow the same document system.

## Paper sizes

- Result, khatian, calculation, certificate and ordinary document outputs: **A4 portrait — 210 × 297 mm**.
- Map and intentionally wide tabular publication outputs: **A4 landscape — 297 × 210 mm**.
- Do not generate A3, Letter, Legal or arbitrary custom page sizes.

## Branding

Every LandBD-generated PDF must include:

- LandBD masthead / brand mark.
- Document title and optional subtitle.
- LandBD green brand rule.
- Source or provenance label when available.
- `landbd.pincodeit.com`.
- Page number / total pages.
- Official-record verification disclaimer.
- PDF metadata with LandBD as author/creator.

The canonical jsPDF implementation is `src/shared/lib/pdf/branding.ts`.

## Export paths

- DOM/result documents use `generate-result-pdf.ts` through `useGeneratePDF`.
- Khatian exports use `khatian-pdf-export.ts`, which reserves the same branded A4 header/footer.
- Pre-paginated reports use `generate-paged-report-pdf.ts`; their page DOM must already contain the LandBD document header/footer.
- RAJUK/mouza vector publications use A4 landscape and `drawLandBdPdfChrome`.
- Browser print output is governed by the A4 rules in `app/globals.css` or a more specific A4 certificate stylesheet.

UI components should not import `html2canvas`, `jsPDF` or `html2pdf.js` directly for ordinary result PDFs. Route new output through the shared PDF layer.

## Source-document exception

A PDF supplied directly by an upstream/provider or government source is preserved **unchanged** so LandBD does not alter or falsely re-brand the original document. The LandBD A4 branding rule applies to files generated or repackaged by LandBD.
