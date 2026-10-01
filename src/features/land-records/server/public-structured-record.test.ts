import { extractStructuredPublicRecord } from "./public-structured-record";

describe("direct public structured khatian record parser", () => {
  it("extracts structured owner and dag details from the official detail payload", () => {
    const result = extractStructuredPublicRecord({
      OWNER_DETAILS: [
        {
          NAME: "আবদুল করিম",
          FATHER_NAME: "রহিম উদ্দিন",
          ADDRESS: "সাভার, ঢাকা",
          SHARE: "৮ আনা",
        },
      ],
      DAG_DETAILS: [
        {
          DAG_NUMBER: "117",
          LAND_CLASS: "বসত",
          TOTAL_AREA: "0.50",
          KHATIAN_AREA: "0.25",
          IS_ROAD: 0,
        },
      ],
    });

    expect(result.owners).toEqual([
      expect.objectContaining({
        name: "আবদুল করিম",
        fatherOrHusband: "রহিম উদ্দিন",
        address: "সাভার, ঢাকা",
        shareRaw: "৮ আনা",
        source: "DLRMS_PUBLIC",
      }),
    ]);
    expect(result.dags).toEqual([
      expect.objectContaining({
        dagNo: "117",
        landType: "বসত",
        totalAreaRaw: "0.50",
        khatianAreaRaw: "0.25",
        isRoad: false,
        source: "DLRMS_PUBLIC",
      }),
    ]);
  });

  it("does not traverse structured data placed under a sensitive token field", () => {
    const result = extractStructuredPublicRecord({
      access_token: {
        OWNER_DETAILS: [{ NAME: "গোপন নাম" }],
        DAG_DETAILS: [{ DAG_NUMBER: "999" }],
      },
    });

    expect(result.owners).toEqual([]);
    expect(result.dags).toEqual([]);
  });
});
