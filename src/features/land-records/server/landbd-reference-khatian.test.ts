import type { KhatianDetails, KhatianIndex } from "../types";
import { isPartialPublicRecord } from "../lib/khatian-display";
import {
  enrichPatiraBrsDetailsWithLandBdReference,
  enrichPatiraBrsWithLandBdReference,
  patiraReferenceRecordCount,
} from "./landbd-reference-khatian";

describe("LandBD Patira BRS bundled reference fallback", () => {
  const original = process.env.LANDBD_PATIRA_REFERENCE_ENABLED;

  beforeEach(() => {
    process.env.LANDBD_PATIRA_REFERENCE_ENABLED = "true";
  });

  afterAll(() => {
    if (original === undefined) delete process.env.LANDBD_PATIRA_REFERENCE_ENABLED;
    else process.env.LANDBD_PATIRA_REFERENCE_ENABLED = original;
  });

  const partial349: KhatianIndex = {
    ID: 7940305,
    KHATIAN_NO: "349",
    OWNERS: "দং মোহাম্মদ ইসলাম,...",
    GUARDIANS: "",
    DAGS: "১৯৭৪,...",
    JL_NUMBER_ID: 382911,
    MOUZA_ID: 71947,
    TOTAL_LAND: "0.338",
  };

  it("contains the existing 1089-row LandBD Patira reference dataset", () => {
    expect(patiraReferenceRecordCount()).toBe(1089);
  });

  it("restores the previous BRS 349 owner, guardian, dag and total-land display", () => {
    const result = enrichPatiraBrsWithLandBdReference(partial349, "BRS");
    expect(result).not.toBeNull();

    expect(result?.record.OWNERS.split(",").map((value) => value.trim())).toHaveLength(8);
    expect(result?.record.GUARDIANS.split(",").map((value) => value.trim())).toHaveLength(4);
    expect(result?.record.DAGS.split(",").map((value) => value.trim())).toEqual([
      "1974",
      "1977",
      "1990",
      "2006",
    ]);
    expect(result?.record.TOTAL_LAND).toBe("0.338");
    expect(result?.enrichment).toMatchObject({
      source: "LANDBD_BUNDLED_PATIRA_REFERENCE",
      surveyKey: "BRS",
      jlNumberId: 382911,
      mouzaId: 71947,
      displayComplete: true,
    });
    expect(result?.enrichment.changedFields).toEqual(
      expect.arrayContaining(["OWNERS", "GUARDIANS", "DAGS"]),
    );
  });

  it("never applies the Patira reference outside the exact survey/JL/mouza scope", () => {
    expect(enrichPatiraBrsWithLandBdReference(partial349, "RS")).toBeNull();
    expect(enrichPatiraBrsWithLandBdReference(
      { ...partial349, JL_NUMBER_ID: 382912 },
      "BRS",
    )).toBeNull();
    expect(enrichPatiraBrsWithLandBdReference(
      { ...partial349, MOUZA_ID: 70000 },
      "BRS",
    )).toBeNull();
  });

  it("does not replace a non-partial official list that contradicts the reference", () => {
    const current: KhatianIndex = {
      ...partial349,
      OWNERS: "নতুন সরকারি মালিক",
      GUARDIANS: "নতুন সরকারি অভিভাবক",
      DAGS: "9999",
    };
    const result = enrichPatiraBrsWithLandBdReference(current, "BRS");
    expect(result).toBeNull();
  });

  it("stores the fallback provenance inside detail PUBLIC_RECORD", () => {
    const details: KhatianDetails = {
      ...partial349,
      KHATIAN_ENTRY_ID: 3197289,
      IS_LOCKED: 0,
      DIVISION_NAME: "ঢাকা",
      DISTRICT_NAME: "ঢাকা",
      UPAZILA_NAME: "গুলশান রাজস্ব সার্কেল",
      JL_NUMBER: "5",
      MOUZA_NAME: "পাতিরা",
      SURVEY_ID: 7,
      SURVEY_NAME: "বি আর এস",
      TOTAL_LAND: "0.338",
      PUBLIC_RECORD: {
        LANDBD_RECONSTRUCTION: { UPSTREAM_TRUNCATION_REMAINS: true },
      },
    };

    const result = enrichPatiraBrsDetailsWithLandBdReference(details, "BRS");
    expect(result?.record.PUBLIC_RECORD?.LANDBD_REFERENCE_ENRICHMENT).toMatchObject({
      source: "LANDBD_BUNDLED_PATIRA_REFERENCE",
      displayComplete: true,
    });
    expect(isPartialPublicRecord(result?.record)).toBe(false);
  });
});
