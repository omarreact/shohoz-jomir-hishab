import { buildDagRows, buildKhatianDisplayModel } from "./khatian-display";
import type { KhatianDetails } from "../types";

describe("Khatian structured source dag fidelity", () => {
  const publicRecord = {
    DAG_DETAILS: [
      { DAG_NUMBER: "1974", LAND_CLASS: "নাল", KHATIAN_AREA: "0.20" },
      { DAG_NUMBER: "1974", LAND_CLASS: "ভিটা", KHATIAN_AREA: "0.10" },
      { DAG_NUMBER: "1977", LAND_CLASS: "চালা", KHATIAN_AREA: "0.05" },
    ],
  };

  it("preserves separate land-class rows for one dag, including Bangla digit aliases", () => {
    const rows = buildDagRows(["১৯৭৪"], publicRecord);
    expect(rows).toHaveLength(3);
    expect(rows.filter((row) => row.dagNo === "1974").map((row) => row.landClass))
      .toEqual(["নাল", "ভিটা"]);
    expect(rows[2].dagNo).toBe("1977");
  });

  it("counts unique dag numbers, not duplicate class/area rows", () => {
    const record: KhatianDetails = {
      ID: 7940305, KHATIAN_NO: "349", JL_NUMBER_ID: 382911, MOUZA_ID: 71947,
      OWNERS: "দং মোহাম্মদ ইসলাম,...", DAGS: "১৯৭৪,...", GUARDIANS: "",
      IS_LOCKED: 0, TOTAL_LAND: "0.338", DIVISION_NAME: "ঢাকা", DISTRICT_NAME: "ঢাকা",
      UPAZILA_NAME: "গুলশান রাজস্ব সার্কেল", JL_NUMBER: "5", MOUZA_NAME: "পাতিরা",
      SURVEY_ID: 7, SURVEY_NAME: "বি আর এস", PUBLIC_RECORD: publicRecord,
    };
    const model = buildKhatianDisplayModel(record, "BRS");
    expect(model.dags).toHaveLength(3);
    expect(model.dagCount).toBe(2);
    expect(model.isPartial).toBe(true);
  });
});
