import { renderToStaticMarkup } from "react-dom/server";
import ArchiveKhatianResult from "./ArchiveKhatianResult";
import type { KhatianDetails } from "../types";
import type { FullKhatian } from "../full-khatian";

const preview: KhatianDetails = {
  ID: 7940021,
  KHATIAN_NO: "312",
  OWNERS: "সিরাজদ্দিন,সিরাজদ্দিন,অন্য মালিক",
  GUARDIANS: "অভিভাবক এক,অভিভাবক দুই",
  DAGS: "1974,1976",
  JL_NUMBER_ID: 382911,
  MOUZA_ID: 71947,
  TOTAL_LAND: "0.56",
  IS_LOCKED: 0,
  DIVISION_NAME: "ঢাকা",
  DISTRICT_NAME: "ঢাকা",
  UPAZILA_NAME: "গুলশান",
  JL_NUMBER: "5",
  MOUZA_NAME: "পাতিরা",
  SURVEY_NAME: "বি আর এস",
  PUBLIC_RECORD: { ID: 7940021 },
};

describe("archive-style source-driven DLRMS document", () => {
  it("renders centered khatian, verified names and original dag rows without omitting duplicates", () => {
    const full = {
      owners: [
        { name: "সিরাজদ্দিন", source: "DLRMS_PUBLIC" },
        { name: "সিরাজদ্দিন", source: "DLRMS_PUBLIC" },
        { name: "অন্য মালিক", source: "DLRMS_PUBLIC" },
      ],
      dags: [
        { dagNo: "1974", landType: "ভিটা", khatianAreaRaw: "0.20", source: "DLRMS_PUBLIC" },
        { dagNo: "1976", landType: "নাল", khatianAreaRaw: "0.36", source: "DLRMS_PUBLIC" },
      ],
    } as FullKhatian;
    const html = renderToStaticMarkup(
      <ArchiveKhatianResult khatian={preview} fullKhatian={full}
        surveyKey="BRS" pageOrientation="landscape" />,
    );
    expect(html).toContain('data-print-document="khatian"');
    expect(html).toContain('data-page-orientation="landscape"');
    expect(html).toContain("খতিয়ান নং ৩১২");
    expect((html.match(/সিরাজদ্দিন/g) ?? []).length).toBe(2);
    expect(html).toContain("১৯৭৪");
    expect(html).toContain("১৯৭৬");
    expect(html).toContain("অভিভাবক এক");
    expect(html).toContain("অভিভাবক দুই");
    expect(html).toContain("নির্দিষ্ট মালিকের সঙ্গে সম্পর্ক প্রমাণিত নয়");
    expect(html).toContain("সরকারি প্রত্যয়িত খতিয়ান নয়");
  });

  it("does not create fictitious dag or owner rows when the source is missing", () => {
    const html = renderToStaticMarkup(
      <ArchiveKhatianResult
        khatian={{ ...preview, OWNERS: "", GUARDIANS: "", DAGS: "", TOTAL_LAND: "" }}
        surveyKey="RS" pageOrientation="portrait" />,
    );
    expect(html).toContain('data-page-orientation="portrait"');
    expect(html).toContain("উৎসে প্রকাশিত হয়নি");
    expect(html).toContain("উৎসে নেই");
    expect(html).not.toContain("১৯৭৪");
  });
});
