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
    expect(builder).toContain('{ value: "book", label: "নতুন" }');
    expect(builder).toContain('{ value: "legacy", label: "রঙিন" }');
    expect(builder).toContain('{ value: "monochrome", label: "সাদা-কালো" }');
    expect(table).toContain("উৎস অবস্থা");
    expect(table).toContain('row.completeness === "complete"');
  });

  it("integrates mutation-only QR/DCR verification on the dedicated Namjari page", () => {
    const page = source("app/(public)/namjari-khatian/page.tsx");
    expect(page).toContain('<SurveyKhatianSearch variant="mutation" />');
    expect(page).toContain('<KhatianVerificationLookup mode="mutation" />');
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
