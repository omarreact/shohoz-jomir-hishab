import fs from "node:fs";
import path from "node:path";

function source(file: string): string {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("ePorcha-inspired LandBD product parity", () => {
  it("uses one search box for Khatian, Dag, owner and guardian after Mouza selection", () => {
    const ui = source("src/features/land-records/components/SurveyKhatianSearch.tsx");
    expect(ui).toContain("খতিয়ান / দাগ / মালিক / অভিভাবক");
    expect(ui).toContain("query: query.trim() || undefined");
    expect(ui).not.toContain('type SearchMode =');
  });

  it("keeps three Khatian Book templates and row-level source status", () => {
    const builder = source("src/features/land-records/components/MouzaPorchaReportBuilder.tsx");
    const table = source("src/features/land-records/components/mouza-report/ReportTable.tsx");
    expect(builder).toContain('name="pdf-variant"');
    expect(builder).toContain('value="book"');
    expect(builder).toContain('value="legacy"');
    expect(builder).toContain('value="monochrome"');
    expect(builder).toContain("পূর্ণ মৌজা PDF ডাউনলোড");
    expect(builder).toContain("পুরনো");
    expect(builder).toContain("autoDownloadRef.current = true");
    expect(builder).not.toContain('label="PDF-এর ধরন"');
    expect(builder).not.toContain('label="প্রিন্ট পেজ"');
    expect(table).toContain("পিতা/স্বামী/অভিভাবক");
    expect(table).toContain("মোট জমি (একর)");
    expect(table).toContain("report-source-badge");
    expect(table).toContain('row.completeness === "complete"');
  });

  it("uses the dark five-column ePorcha-style browser for survey and book pages", () => {
    const survey = source("src/features/land-records/components/SurveyKhatianSearch.tsx");
    const book = source("src/features/land-records/components/MouzaPorchaReportBuilder.tsx");
    const selector = source("src/features/land-records/components/LandRecordSelectionColumn.tsx");
    for (const label of ["বিভাগ", "জেলা", "উপজেলা / থানা", "খতিয়ানের ধরন", "মৌজা (JL নম্বর)"]) {
      expect(survey).toContain(label);
      expect(book).toContain(label);
    }
    expect(selector).toContain("bg-[#101813]");
    expect(survey).toContain("bg-[#0a110d]");
    expect(book).toContain("bg-[#0a110d]");
  });

  it("matches the uploaded Mouza Khatian Book cover and compact record-table structure", () => {
    const document = source("src/features/land-records/components/MouzaPorchaDocument.tsx");
    const css = source("src/features/land-records/components/mouza-report/report-document.css");
    expect(document).toContain("LAND RECORDS / MOUZA COLLECTION");
    expect(document).toContain("মৌজা ভিত্তিক");
    expect(document).toContain("report-cover-stats");
    expect(document).toContain("report-book-header");
    expect(css).toContain("ePorcha reference-book overrides");
  });

  it("implements Division to District to Upazila to Survey to Map list to Preview/PDF", () => {
    const ui = source("src/features/geospatial-map/components/VisitorMouzaShareDownload.tsx");
    for (const label of ["০১ · বিভাগ", "০২ · জেলা", "০৩ · উপজেলা / থানা", "০৪ · সার্ভে", "০৫ · ম্যাপ তালিকা"]) {
      expect(ui).toContain(label);
    }
    expect(ui).toContain("downloadPdf");
    expect(ui).toContain('import("jspdf")');
    expect(ui).toContain("প্রিভিউ");
  });

  it("keeps the existing validated html2canvas/jsPDF A4 report engine", () => {
    const pdf = source("src/shared/lib/pdf/generate-paged-report-pdf.ts");
    expect(pdf).toContain('import("html2canvas")');
    expect(pdf).toContain('import("jspdf")');
    expect(pdf).toContain("inspectA4PageGeometry");
  });
});
