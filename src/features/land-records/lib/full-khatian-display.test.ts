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
    expect(model.totalLand).toBe("২.০৪১২ একর");
    expect(model.isPartial).toBe(true);
  });

  it("does not guess duplicate-owner guardian relationships from compact row order", () => {
    const model = buildFullKhatianDisplayModel({
      ...preview, OWNERS: "সিরাজদ্দিন,সিরাজদ্দিন,অন্য মালিক", DAGS: "1948",
    }, {
      owners: [
        { name: "সিরাজদ্দিন", fatherOrHusband: "আলম উদ্দিন", shareRaw: "১/২", source: "DLRMS_PUBLIC" },
        { name: "সিরাজদ্দিন", fatherOrHusband: "মহিউদ্দিন", shareRaw: "১/৪", source: "DLRMS_PUBLIC" },
      ],
      dags: [],
    } as unknown as FullKhatian, "BRS");
    // Only two structured owners exist for three compact source owners.
    // Do not assume the first two compact rows match the structured order.
    expect(model.owners).toEqual([
      { name: "সিরাজদ্দিন", share: undefined, fatherOrHusband: undefined },
      { name: "সিরাজদ্দিন", share: undefined, fatherOrHusband: undefined },
      { name: "অন্য মালিক", share: undefined, fatherOrHusband: undefined },
    ]);
    const structured = buildFullKhatianDisplayModel({
      ...preview, OWNERS: "সিরাজদ্দিন", DAGS: "1948",
    }, {
      owners: [
        { name: "সিরাজদ্দিন", fatherOrHusband: "আলম উদ্দিন", shareRaw: "১/২", source: "DLRMS_PUBLIC" },
        { name: "সিরাজদ্দিন", fatherOrHusband: "মহিউদ্দিন", shareRaw: "১/৪", source: "DLRMS_PUBLIC" },
      ],
      dags: [],
    } as unknown as FullKhatian, "BRS");
    expect(structured.owners.map((owner) => owner.fatherOrHusband))
      .toEqual(["আলম উদ্দিন", "মহিউদ্দিন"]);

    const exact = buildFullKhatianDisplayModel({
      ...preview, OWNERS: "সিরাজদ্দিন,সিরাজদ্দিন", DAGS: "1948",
    }, {
      owners: [
        { name: "সিরাজদ্দিন", fatherOrHusband: "আলম উদ্দিন", source: "DLRMS_PUBLIC" },
        { name: "সিরাজদ্দিন", fatherOrHusband: "মহিউদ্দিন", source: "DLRMS_PUBLIC" },
      ],
      dags: [],
    } as unknown as FullKhatian, "BRS");
    expect(exact.owners.map((owner) => owner.fatherOrHusband))
      .toEqual(["আলম উদ্দিন", "মহিউদ্দিন"]);
  });

  it("does not assign one verified guardian to two unrelated same-name compact entries", () => {
    const model = buildFullKhatianDisplayModel({
      ...preview, OWNERS: "সিরাজদ্দিন,সিরাজদ্দিন", DAGS: "1948",
    }, {
      owners: [{ name: "সিরাজদ্দিন", fatherOrHusband: "আলম উদ্দিন", shareRaw: "১/২", source: "DLRMS_PUBLIC" }],
      dags: [],
    } as unknown as FullKhatian, "BRS");
    expect(model.owners).toHaveLength(2);
    expect(model.owners.map((owner) => owner.fatherOrHusband)).toEqual([undefined, undefined]);
    expect(model.owners.map((owner) => owner.share)).toEqual([undefined, undefined]);
  });

  it("never drops compact-only owners when additional structured rows are returned", () => {
    const model = buildFullKhatianDisplayModel({
      ...preview, OWNERS: "মালিক ক,মালিক খ", DAGS: "1948",
    }, {
      owners: [
        { name: "মালিক ক", source: "DLRMS_PUBLIC" },
        { name: "মালিক গ", fatherOrHusband: "পিতা গ", source: "DLRMS_PUBLIC" },
        { name: "মালিক ঘ", source: "DLRMS_PUBLIC" },
      ],
      dags: [],
    } as unknown as FullKhatian, "BRS");
    expect(model.owners.map((owner) => owner.name))
      .toEqual(["মালিক ক", "মালিক গ", "মালিক ঘ", "মালিক খ"]);
    expect(model.owners[1].fatherOrHusband).toBe("পিতা গ");
    expect(model.owners[3].fatherOrHusband).toBeUndefined();
  });

  it("keeps separate sourced land-class rows under one dag without double-counting the plot", () => {
    const model = buildFullKhatianDisplayModel({
      ...preview, DAGS: "1974", OWNERS: "মালিক ১",
    }, {
      owners: [{ name: "মালিক ১", source: "DLRMS_PUBLIC" }],
      dags: [
        { dagNo: "1974", landType: "নাল", khatianAreaRaw: "0.20", source: "DLRMS_PUBLIC" },
        { dagNo: "1974", landType: "ভিটা", khatianAreaRaw: "0.10", source: "DLRMS_PUBLIC" },
      ],
    } as unknown as FullKhatian, "BRS");

    expect(model.dags).toHaveLength(2);
    expect(model.dags.map((row) => row.dagNo)).toEqual(["1974", "1974"]);
    expect(model.dags.map((row) => row.landClass)).toEqual(["নাল", "ভিটা"]);
    expect(model.dags[0].shareArea).not.toEqual(model.dags[1].shareArea);
    expect(model.dagCount).toBe(1);
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
