import { reconstructKhatian } from "./khatian-reconstruction";
import type { KhatianDetails, KhatianIndex } from "../types";

const base: KhatianDetails = {
  ID: 786385,
  KHATIAN_NO: "1",
  OWNERS: "প্রকাশিত মালিক",
  DAGS: "",
  GUARDIANS: "",
  JL_NUMBER_ID: 127902,
  MOUZA_ID: 1130,
  TOTAL_LAND: "",
  KHATIAN_ENTRY_ID: 3749556,
  IS_LOCKED: 0,
  DIVISION_NAME: "ঢাকা",
  DISTRICT_NAME: "ঢাকা",
  UPAZILA_NAME: "সাভার",
  JL_NUMBER: "662",
  MOUZA_NAME: "সাভার",
  SURVEY_ID: 1,
  SURVEY_NAME: "সি এস",
  PUBLIC_RECORD: { ID: 786385, KHATIAN_NO: "1" },
};

describe("khatian reconstruction", () => {
  it("merges all returned variants for the same khatian and preserves verified hidden search evidence", () => {
    const rows: KhatianIndex[] = [
      {
        ID: 786385,
        KHATIAN_NO: "1",
        OWNERS: "প্রকাশিত মালিক, দ্বিতীয় মালিক",
        DAGS: "117, 118",
        GUARDIANS: "পিতা: রহিম",
        JL_NUMBER_ID: 127902,
        MOUZA_ID: 1130,
        TOTAL_LAND: "1.25",
      },
      {
        ID: 999999,
        KHATIAN_NO: "99",
        OWNERS: "অন্য খতিয়ানের মালিক",
        DAGS: "900",
        GUARDIANS: "",
        JL_NUMBER_ID: 127902,
        MOUZA_ID: 1130,
      },
    ];

    const result = reconstructKhatian(base, rows, {
      owner: "গোপন মালিক",
      dagNumber: "119",
      ownerVerified: true,
      dagVerified: true,
    });

    expect(result.OWNERS).toContain("প্রকাশিত মালিক");
    expect(result.OWNERS).toContain("দ্বিতীয় মালিক");
    expect(result.DAGS).toBe("117, 118");
    expect(result.GUARDIANS).toBe("পিতা: রহিম");
    expect(result.TOTAL_LAND).toBe("1.25");
    expect(result.OWNERS).not.toContain("অন্য খতিয়ানের মালিক");

    const reconstruction = result.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as Record<string, unknown>;
    expect(reconstruction.SEARCH_VERIFIED).toEqual({
      OWNER_QUERY: "গোপন মালিক",
      DAG_NUMBER_QUERY: "119",
    });
    expect(reconstruction.MATCHED_ROWS).toBe(1);
  });

  it("does not present an unverified search fragment as khatian data", () => {
    const result = reconstructKhatian(base, [], {
      owner: "অসম্পূর্ণ নাম",
      ownerVerified: false,
    });

    expect(result.OWNERS).toBe("প্রকাশিত মালিক");
    const reconstruction = result.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as Record<string, unknown>;
    expect(reconstruction.SEARCH_VERIFIED).toEqual({});
  });
});
