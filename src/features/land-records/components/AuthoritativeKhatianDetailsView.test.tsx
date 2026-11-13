import { renderToStaticMarkup } from "react-dom/server";
import AuthoritativeKhatianDetailsView from "./AuthoritativeKhatianDetailsView";
import type { KhatianDetails } from "../types";

const record: KhatianDetails = {
  ID: 7940021,
  KHATIAN_NO: "312",
  OWNERS: "দং আস্কর আলী",
  GUARDIANS: "পিং ছোমেদ খাঁন",
  DAGS: "1948",
  JL_NUMBER_ID: 382911,
  MOUZA_ID: 71947,
  TOTAL_LAND: "2.0412",
  IS_LOCKED: 0,
  DIVISION_NAME: "ঢাকা",
  DISTRICT_NAME: "ঢাকা",
  UPAZILA_NAME: "গুলশান",
  JL_NUMBER: "5",
  MOUZA_NAME: "পাতিরা",
  SURVEY_NAME: "বি আর এস",
  PUBLIC_RECORD: { ID: 7940021 },
};

function renderRecord(khatian: KhatianDetails): string {
  return renderToStaticMarkup(
    <AuthoritativeKhatianDetailsView
      khatian={khatian}
      surveyKey="BRS"
      pageOrientation="landscape"
    />,
  );
}

describe("AuthoritativeKhatianDetailsView", () => {
  it("renders the reference nine-column Bangladesh-form structure", () => {
    const html = renderRecord(record);

    expect(html).toContain("বাংলাদেশ ফরম নং ৫৪৬২");
    expect(html).toContain("খতিয়ান নং ৩১২");
    expect(html).toContain("মালিক, অকৃষি প্রজা বা");
    expect(html).toContain("দাগের মোট জমির পরিমাণ");
    expect(html).toContain("অংশানুযায়ী জমির পরিমাণ");
    expect(html).toContain("দং আস্কর আলী");
    expect(html).toContain("১৯৪৮");
    expect(html).toContain("২.০৪১২");
  });

  it("renders the second-page LandBD disclaimer without inventing unavailable values", () => {
    const html = renderRecord({ ...record, TOTAL_LAND: "" });

    expect(html).toContain("বিশেষ দ্রষ্টব্য:");
    expect(html).toContain("সরকারি প্রত্যয়িত খতিয়ান নয়");
    expect(html).toContain("উৎসে অনুপস্থিত");
    expect(html).toContain("landbd.pincodeit.com");
  });
});
