import fs from "node:fs";
import path from "node:path";

describe("LandBD khatian service UI identity", () => {
  const files = [
    "src/features/land-records/components/SurveyKhatianSearch.tsx",
    "src/features/land-records/components/MouzaPorchaReportBuilder.tsx",
    "src/features/land-records/components/LandRecordSelectionColumn.tsx",
    "src/features/land-records/components/KhatianDetailsView.tsx",
  ];
  const forbidden = ["#0a110d", "#0c1510", "#111a15", "#101813", "#1fa775", "#2bc18a", "#203129", "#24382e", "#26372f"];

  it.each(files)("%s does not restore the reference-site screen palette", (file) => {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    for (const color of forbidden) expect(source).not.toContain(color);
  });

  it("uses the canonical LandBD UI font on both service screens", () => {
    const survey = fs.readFileSync(path.join(process.cwd(), files[0]), "utf8");
    const book = fs.readFileSync(path.join(process.cwd(), files[1]), "utf8");
    expect(survey).toContain("font-mixed");
    expect(book).toContain("font-mixed");
  });

  it("keeps report/PDF document styling outside the screen UI migration", () => {
    const reportCss = fs.readFileSync(
      path.join(process.cwd(), "src/features/land-records/components/mouza-report/report-document.css"),
      "utf8",
    );
    expect(reportCss).toContain("Kalpurush");
    expect(reportCss).toContain("var(--font-report)");
  });
});
