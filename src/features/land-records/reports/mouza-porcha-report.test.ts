import {
  buildMouzaReportRows,
  normalizeReportText,
  paginateMouzaReportRows,
  segmentMouzaReportRows,
  summarizeNumericKhatianGaps,
} from "./mouza-porcha-report";

const baseRow = {
  ID: 41,
  KHATIAN_NO: "41",
  OWNERS: "মোঃ আব্দুর রহমান, রহিমা খাতুন",
  GUARDIANS: "পিং মোঃ করিম, জং মোঃ সালাম",
  DAGS: "1252, 1260, 1265/1209",
  JL_NUMBER_ID: 5,
  MOUZA_ID: 10,
  TOTAL_LAND: "10.8616",
};

describe("mouza porcha report helpers", () => {
  it("normalizes Bengali source text to NFC without compatibility rewriting", () => {
    const decomposed = "খতিয়া\u09bcন";
    const normalized = normalizeReportText(decomposed);
    expect(normalized).toBe(decomposed.normalize("NFC"));
    expect(normalizeReportText("পর্চা")).toBe("পর্চা");
    expect(normalizeReportText("পিং")).toBe("পিং");
    expect(normalizeReportText("জং")).toBe("জং");
  });

  it("preserves complete owner, guardian, dag and Acre source values", () => {
    const [row] = buildMouzaReportRows([baseRow], {});
    expect(row.khatianNo).toBe("41");
    expect(row.owners).toEqual(["মোঃ আব্দুর রহমান", "রহিমা খাতুন"]);
    expect(row.guardians).toEqual(["পিং মোঃ করিম", "জং মোঃ সালাম"]);
    expect(row.dags).toEqual(["1252", "1260", "1265/1209"]);
    expect(row.totalLandAcre).toBe("10.8616");
  });

  it("only exposes Hal/Sabek history supplied by the mapping source", () => {
    const [row] = buildMouzaReportRows([baseRow], {
      "41": {
        khatianNo: "41",
        mappings: [
          { previousDag: "1209", currentDag: "1265", source: "DLRMS_HAL_SABEK" },
          { previousDag: "1209", currentDag: "1265", source: "DLRMS_HAL_SABEK" },
        ],
      },
    });
    expect(row.history).toEqual([{ previousDag: "1209", currentDag: "1265" }]);
  });

  it("keeps a very large Khatian as one row without continuation fragments", () => {
    const large = {
      ...baseRow,
      OWNERS: Array.from({ length: 20 }, (_, index) => `মালিক ${index + 1}`).join(", "),
      GUARDIANS: Array.from({ length: 20 }, (_, index) => `অভিভাবক ${index + 1}`).join(", "),
      DAGS: Array.from({ length: 35 }, (_, index) => String(1000 + index)).join(", "),
    };
    const rows = buildMouzaReportRows([large], {});
    const segments = segmentMouzaReportRows(rows);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.continuation).toBe(false);
    expect(segments[0]?.segmentCount).toBe(1);
    expect(segments[0]?.owners).toHaveLength(20);
    expect(segments[0]?.guardians).toHaveLength(20);
    expect(segments[0]?.dags).toHaveLength(35);
    expect(segments[0]?.totalLandAcre).toBe("10.8616");
    expect(paginateMouzaReportRows(segments)).toHaveLength(1);
  });

  it("never splits one Khatian between logical pages", () => {
    const rows = buildMouzaReportRows(
      [
        baseRow,
        { ...baseRow, ID: 42, KHATIAN_NO: "42" },
      ],
      {},
    );
    const segments = segmentMouzaReportRows(rows);
    const pages = paginateMouzaReportRows(segments, 2, 2);

    expect(pages.flat()).toHaveLength(2);
    expect(new Set(pages.flat().map((row) => row.khatianNo))).toEqual(new Set(["41", "42"]));
    expect(pages.flat().every((row) => row.continuation === false)).toBe(true);
  });

  it("labels numeric sequence gaps as a hint rather than treating fractional records as missing", () => {
    const summary = summarizeNumericKhatianGaps(["1", "2", "4", "4/1", "7/2"]);
    expect(summary.count).toBe(1);
    expect(summary.samples).toEqual(["3"]);
  });
});
