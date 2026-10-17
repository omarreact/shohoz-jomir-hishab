import { renderToStaticMarkup } from "react-dom/server";
import ReportTable from "./ReportTable";
import type { MouzaReportRowSegment } from "../../reports/mouza-porcha-report";

const row: MouzaReportRowSegment = {
  sourceId: 123,
  khatianNo: "৩৪৯",
  owners: ["আবদুল রহমান", "রহিমা বেগম"],
  guardians: [],
  dags: ["১৯৪৪", "১৯৪৫"],
  totalLandAcre: "০.৩৬",
  history: [],
  segmentKey: "123",
  segmentIndex: 0,
  segmentCount: 1,
  continuation: false,
};

describe("Mouza Porcha report table", () => {
  it("renders record values without inventing unavailable columns", () => {
    const html = renderToStaticMarkup(
      <ReportTable
        rows={[row]}
        showHistory={false}
        showOwners={true}
        showGuardians={false}
        showDags={true}
        showLandArea={true}
        startIndex={0}
      />,
    );
    expect(html).toContain("আবদুল রহমান");
    expect(html).toContain("রহিমা বেগম");
    expect(html).toContain("১৯৪৪");
    expect(html).toContain("০.৩৬ একর");
    expect(html).not.toContain("অভিভাবক / সম্পর্ক");
    expect(html).not.toContain("দাগ পরিবর্তন");
    expect(html).toContain("<table");
  });

  it("prints multiple source records in their original order", () => {
    const html = renderToStaticMarkup(
      <ReportTable
        rows={[row, { ...row, sourceId: 124, segmentKey: "124", khatianNo: "৩৫০" }]}
        showHistory={false}
        showOwners={false}
        showGuardians={false}
        showDags={false}
        showLandArea={false}
        startIndex={20}
      />,
    );
    expect(html.indexOf("৩৪৯")).toBeLessThan(html.indexOf("৩৫০"));
    expect(html).toContain(">21</td>");
    expect(html).toContain(">22</td>");
  });
});
