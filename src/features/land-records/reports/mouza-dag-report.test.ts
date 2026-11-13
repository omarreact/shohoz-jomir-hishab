import type { KhatianIndex } from "../types";
import { buildMouzaDagRows, normalizeDagToken, splitDagList } from "./mouza-dag-report";

const row = (id: number, khatian: string, dags: string): KhatianIndex => ({
  ID: id,
  KHATIAN_NO: khatian,
  OWNERS: "",
  GUARDIANS: "",
  DAGS: dags,
  JL_NUMBER_ID: 1,
  MOUZA_ID: 1,
  TOTAL_LAND: "",
});

describe("mouza dag report", () => {
  it("normalizes Bengali and Arabic numerals", () => {
    expect(normalizeDagToken(" ১২৩ ")).toBe("123");
    expect(normalizeDagToken("١٢٣")).toBe("123");
  });

  it("removes trailing public ellipsis without inventing dags", () => {
    expect(splitDagList("১২৫, ১৩০,...")).toEqual(["125", "130"]);
  });

  it("builds unique dag to khatian mappings", () => {
    const result = buildMouzaDagRows([
      row(1, "৪১", "২০২, ২০৫"),
      row(2, "62", "২০২, 210"),
      row(3, "৪১", "২০২"),
    ]);

    expect(result).toEqual([
      { dagNo: "202", khatianNos: ["41", "62"], sourceIds: [1, 2, 3] },
      { dagNo: "205", khatianNos: ["41"], sourceIds: [1] },
      { dagNo: "210", khatianNos: ["62"], sourceIds: [2] },
    ]);
  });

  it("keeps compound dag identifiers intact", () => {
    expect(buildMouzaDagRows([row(1, "1", "1265/1209")])[0]?.dagNo).toBe("1265/1209");
  });
});
