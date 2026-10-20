import type { FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildFullKhatianDisplayModel } from "./full-khatian-display";

const preview: KhatianDetails = {
  ID: 7940021,
  KHATIAN_NO: "312",
  OWNERS: "দং আস্কর আলী,...",
  GUARDIANS: "পিং ছোমেদ খাঁন,...",
  DAGS: "1948,...",
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

describe("authoritative Khatian document uses full data rather than a truncated preview", () => {
  it("restores all Patira BRS 312 owners and dag numbers and keeps the khatian-wide land total", () => {
    const full = {
      owners: ["দং আস্কর আলী", "খোদেজা খাতুন", "হাজাতুন নেছা"].map((name) => ({
        name, source: "DLRMS_PUBLIC" as const,
      })),
      dags: ["1948", "1972", "1987", "2003", "2009", "2010", "2116", "3128", "3918"].map((dagNo) => ({
        dagNo, source: "DLRMS_PUBLIC" as const,
      })),
    } as FullKhatian;

    const model = buildFullKhatianDisplayModel(preview, full, "BRS");
    expect(model.owners.map((owner) => owner.name)).toEqual([
      "দং আস্কর আলী", "খোদেজা খাতুন", "হাজাতুন নেছা",
    ]);
    expect(model.dags.map((dag) => dag.dagNo)).toEqual([
      "1948", "1972", "1987", "2003", "2009", "2010", "2116", "3128", "3918",
    ]);
    expect(model.guardians).toEqual(["পিং ছোমেদ খাঁন"]);
    expect(model.totalLand).toBe("2.0412");
    expect(model.isPartial).toBe(true);
  });

  it("does not introduce mock owners or replace longer public lists with deduplicated rows", () => {
    const model = buildFullKhatianDisplayModel({
      ...preview,
      OWNERS: "সিরাজদ্দিন,সিরাজদ্দিন,অন্য মালিক",
      DAGS: "1948,1972",
    }, {
      owners: [{ name: "মক মালিক", source: "LISF_MOCK" }],
      dags: [{ dagNo: "999", source: "LISF_MOCK" }],
    } as FullKhatian, "BRS");
    expect(model.owners.map((owner) => owner.name)).toEqual([
      "সিরাজদ্দিন", "সিরাজদ্দিন", "অন্য মালিক",
    ]);
    expect(model.dags.map((dag) => dag.dagNo)).toEqual(["1948", "1972"]);
  });
});
