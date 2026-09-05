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

    expect(result.OWNERS).toBe("প্রকাশিত মালিক, দ্বিতীয় মালিক");
    expect(result.DAGS).toBe("117, 118, 119");
    expect(result.GUARDIANS).toBe("পিতা: রহিম");
    expect(result.TOTAL_LAND).toBe("1.25");
    expect(result.OWNERS).not.toContain("অন্য খতিয়ানের মালিক");
    expect(result.PUBLIC_RECORD?.["সার্চে_মিল_পাওয়া_মালিক_নাম_বা_অংশ"]).toBe("গোপন মালিক");
    expect(result.PUBLIC_RECORD?.["সার্চে_মিল_পাওয়া_দাগ"]).toBe("119");

    const reconstruction = result.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as Record<string, unknown>;
    expect(reconstruction.SEARCH_VERIFIED).toEqual({
      OWNER_QUERY: "গোপন মালিক",
      DAG_NUMBER_QUERY: "119",
    });
    expect(reconstruction.MATCHED_ROWS).toBe(1);
    expect(reconstruction.UPSTREAM_TRUNCATION_REMAINS).toBe(false);
  });

  it("does not present an unverified search fragment as khatian data", () => {
    const result = reconstructKhatian(base, [], {
      owner: "অসম্পূর্ণ নাম",
      ownerVerified: false,
    });

    expect(result.OWNERS).toBe("প্রকাশিত মালিক");
    expect(result.PUBLIC_RECORD?.["সার্চে_মিল_পাওয়া_মালিক_নাম_বা_অংশ"]).toBeUndefined();
    const reconstruction = result.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as Record<string, unknown>;
    expect(reconstruction.SEARCH_VERIFIED).toEqual({});
  });

  it("promotes a fuller official public variant over a truncated compact variant", () => {
    const truncatedBase: KhatianDetails = {
      ...base,
      ID: 7940021,
      KHATIAN_NO: "312",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      OWNERS: "দং আস্কর আলী,...",
      GUARDIANS: "পিং ছোমেদ খাঁন,...",
      DAGS: "1948,...",
      TOTAL_LAND: "2.0412",
    };

    const fullerRow: KhatianIndex = {
      ID: 7940021,
      KHATIAN_NO: "312",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      OWNERS: "দং আস্কর আলী,খোদেজা খাতুন,হাজাতুন নেছা",
      GUARDIANS: "পিং ছোমেদ খাঁন,জং ওয়াকিল উদ্দিন ভুঞা",
      DAGS: "1948,1972,1987,2003,2009,2010,2116,3128,3918",
      TOTAL_LAND: "2.0412",
    };

    const result = reconstructKhatian(truncatedBase, [fullerRow]);

    expect(result.OWNERS).toBe("দং আস্কর আলী, খোদেজা খাতুন, হাজাতুন নেছা");
    expect(result.GUARDIANS).toBe("পিং ছোমেদ খাঁন, জং ওয়াকিল উদ্দিন ভুঞা");
    expect(result.DAGS).toBe("1948, 1972, 1987, 2003, 2009, 2010, 2116, 3128, 3918");
    expect(result.OWNERS).not.toMatch(/\.{3}|…/u);
    expect(result.DAGS).not.toMatch(/\.{3}|…/u);

    const reconstruction = result.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as Record<string, unknown>;
    expect(reconstruction.UPSTREAM_TRUNCATION_REMAINS).toBe(false);
    expect(reconstruction.MERGED_TOTAL_LAND).toBe("2.0412");
  });

  it("keeps an explicit partial marker when every official variant is truncated", () => {
    const truncatedBase: KhatianDetails = {
      ...base,
      ID: 7940036,
      KHATIAN_NO: "314",
      JL_NUMBER_ID: 382911,
      MOUZA_ID: 71947,
      OWNERS: "দং আস্কর আলী,...",
      DAGS: "3922,...",
      TOTAL_LAND: "0.26",
    };

    const result = reconstructKhatian(truncatedBase, [
      {
        ID: 7940036,
        KHATIAN_NO: "314",
        JL_NUMBER_ID: 382911,
        MOUZA_ID: 71947,
        OWNERS: "দং আস্কর আলী,...",
        DAGS: "3922,...",
        GUARDIANS: "",
        TOTAL_LAND: "0.26",
      },
    ]);

    expect(result.OWNERS).toBe("দং আস্কর আলী, …");
    expect(result.DAGS).toBe("3922, …");
    const reconstruction = result.PUBLIC_RECORD?.LANDBD_RECONSTRUCTION as Record<string, unknown>;
    expect(reconstruction.UPSTREAM_TRUNCATION_REMAINS).toBe(true);
  });

  it("rejects same-number rows from a different JL boundary", () => {
    const result = reconstructKhatian(base, [
      {
        ID: 999001,
        KHATIAN_NO: "1",
        OWNERS: "ভুল মৌজার মালিক",
        DAGS: "999",
        GUARDIANS: "",
        JL_NUMBER_ID: 999999,
        MOUZA_ID: 999,
        TOTAL_LAND: "9.99",
      },
    ]);

    expect(result.OWNERS).toBe("প্রকাশিত মালিক");
    expect(result.DAGS).toBe("");
    expect(result.TOTAL_LAND).toBe("");
  });
});
