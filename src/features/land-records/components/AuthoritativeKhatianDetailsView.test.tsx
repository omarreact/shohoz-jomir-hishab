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
  it("shows total land in its own row using the source value", () => {
    const html = renderRecord(record);

    expect(html).toContain("প্রাপ্ত দাগ");
    expect(html).not.toContain("প্রাপ্ত দাগ / মোট জমি");
    expect(html).toContain("মোট জমি");
    expect(html).toContain("২.০৪১২ একর");
  });

  it("keeps the total-land row visible when the source has no value", () => {
    const html = renderRecord({ ...record, TOTAL_LAND: "" });

    expect(html).toContain("মোট জমি");
    expect(html).toContain("উৎসে নেই");
  });
});
