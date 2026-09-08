# Shared result PDF

`generate-result-pdf.ts` is the single client-side A4 portrait renderer for result documents. UI components should use `useGeneratePDF` and `ResultDownloadButton` rather than importing `html2canvas`, `jsPDF` or `html2pdf.js` directly.

Result DOM should use `ResultDocument` or `ResultWatermarkPortal` so the Bangladesh-flag-inspired LandBD watermark is visible in the web result and captured by the same PDF clone.
