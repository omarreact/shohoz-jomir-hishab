import { renderToStaticMarkup } from "react-dom/server";
import MouzaPorchaDocument from "./MouzaPorchaDocument";
import type { KhatianIndex } from "../types";
import type { HalSabekReportState } from "../reports/mouza-porcha-report";

const source: KhatianIndex = {
  ID: 123,
  KHATIAN_NO: "349",
  OWNERS: "মালিক এক,মালিক দুই",
  GUARDIANS: "অভিভাবক এক",
  DAGS: "1944,1945",
  TOTAL_LAND: "0.36",
} as KhatianIndex;

describe("Mouza Porcha archive A4 result", () => {
  it("places a dedicated PDF cover before numbered source table pages", () => {
    const html = renderToStaticMarkup(
      <MouzaPorchaDocument rows={[source]}
        halSabek={{} as HalSabekReportState} includeHalSabek={false}
        expectedRecords={1} districtName="ঢাকা" upazilaName="গুলশান"
        surveyName="BRS" mouzaName="পাতিরা" jlNumber="5"
        reportMeta={null} pageOrientation="landscape" />,
    );
    expect(html).toContain('data-report-page="cover"');
    expect(html).toContain('data-report-page="content"');
    expect(html.indexOf('data-report-page="cover"')).toBeLessThan(html.indexOf('data-report-page="content"'));
    expect(html).toContain("Report ID");
    expect(html).toContain("মালিক এক");
    expect(html).toContain("১৯৪৪");
    expect(html).toContain("সরকারি প্রত্যয়িত পর্চা নয়");
    expect((html.match(/class="report-page /g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
