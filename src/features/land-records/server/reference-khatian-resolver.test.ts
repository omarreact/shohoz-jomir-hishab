import { isPartialPublicRecord } from "../lib/khatian-display";
import type { KhatianDetails, KhatianIndex } from "../types";
import {
  enrichKhatianDetailsWithReferenceDatasets,
  enrichKhatianWithReferenceDatasets,
  getReferenceDatasetInventory,
  type LandBdReferenceDataset,
} from "./reference-khatian-resolver";

describe("generic LandBD khatian reference resolver", () => {
  const original = process.env.LANDBD_REFERENCE_DATA_ENABLED;

  beforeEach(() => {
    process.env.LANDBD_REFERENCE_DATA_ENABLED = "true";
  });

  afterAll(() => {
    if (original === undefined) delete process.env.LANDBD_REFERENCE_DATA_ENABLED;
    else process.env.LANDBD_REFERENCE_DATA_ENABLED = original;
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

  it("registers the existing 1089-row Patira BRS dataset through the generic registry", () => {
    expect(getReferenceDatasetInventory()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "legacy-patira-brs-porcha-v1",
        surveyKeys: ["BRS"],
        jlNumberIds: [382911],
        mouzaIds: [71947],
        recordCount: 1089,
      }),
    ]));
  });

  it("restores the existing BRS 349 owner, guardian, dag and total-land display", () => {
    const result = enrichKhatianWithReferenceDatasets(partial349, "BRS");
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
      source: "LANDBD_BUNDLED_REFERENCE",
      datasetId: "legacy-patira-brs-porcha-v1",
      surveyKey: "BRS",
      jlNumberId: 382911,
      mouzaId: 71947,
      displayComplete: true,
    });
  });

  it.each(["BRS", "RS", "SA", "CS", "BS", "DIARA", "PETY", "BDS", "MUTATION"])(
    "uses the same resolver for %s when a scoped dataset exists",
    (surveyKey) => {
      const row: KhatianIndex = {
        ID: 10,
        KHATIAN_NO: "12",
        OWNERS: "মালিক এক,...",
        GUARDIANS: "",
        DAGS: "১০০,...",
        JL_NUMBER_ID: 500,
        MOUZA_ID: 700,
        TOTAL_LAND: "0.50",
      };
      const dataset: LandBdReferenceDataset = {
        id: `test-${surveyKey.toLowerCase()}-mouza`,
        path: `test/${surveyKey}.json`,
        surveyKeys: [surveyKey],
        jlNumberIds: [500],
        mouzaIds: [700],
        label: "test dataset",
        rows: [{
          khatianNo: "12",
          owners: "মালিক এক, মালিক দুই",
          guardians: "পিং অভিভাবক এক, জং অভিভাবক দুই",
          dags: "100, 101",
          totalLand: "0.50",
        }],
      };

      const result = enrichKhatianWithReferenceDatasets(row, surveyKey, [dataset]);
      expect(result?.record.OWNERS).toBe("মালিক এক, মালিক দুই");
      expect(result?.record.GUARDIANS).toBe("পিং অভিভাবক এক, জং অভিভাবক দুই");
      expect(result?.record.DAGS).toBe("100, 101");
      expect(result?.enrichment.surveyKey).toBe(surveyKey);
      expect(result?.enrichment.displayComplete).toBe(true);
    },
  );

  it("requires exact survey, JL and mouza scope", () => {
    expect(enrichKhatianWithReferenceDatasets(partial349, "RS")).toBeNull();
    expect(enrichKhatianWithReferenceDatasets(
      { ...partial349, JL_NUMBER_ID: 382912 },
      "BRS",
    )).toBeNull();
    expect(enrichKhatianWithReferenceDatasets(
      { ...partial349, MOUZA_ID: 70000 },
      "BRS",
    )).toBeNull();
  });

  it("rejects a bundled row that contradicts current official owner/dag identity", () => {
    const current: KhatianIndex = {
      ...partial349,
      OWNERS: "নতুন সরকারি মালিক",
      GUARDIANS: "নতুন সরকারি অভিভাবক",
      DAGS: "9999",
    };
    expect(enrichKhatianWithReferenceDatasets(current, "BRS")).toBeNull();
  });

  it("stores generic reference provenance in detail records and enables complete display", () => {
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

    const result = enrichKhatianDetailsWithReferenceDatasets(details, "BRS");
    expect(result?.record.PUBLIC_RECORD?.LANDBD_REFERENCE_ENRICHMENT).toMatchObject({
      source: "LANDBD_BUNDLED_REFERENCE",
      datasetId: "legacy-patira-brs-porcha-v1",
      displayComplete: true,
    });
    expect(isPartialPublicRecord(result?.record)).toBe(false);
  });
});
