import type { KhatianIndex } from "./types";
import { normalizeKhatianRecord, normalizedRecordMatches } from "./normalized-khatian";

function row(overrides: Partial<KhatianIndex> = {}): KhatianIndex {
  return {
    ID: 7,
    KHATIAN_NO: "৪১",
    OWNERS: "রহিম, রহিম",
    GUARDIANS: "পিতা: করিম, মাতা: সালমা",
    DAGS: "২০২, ২০৫",
    JL_NUMBER_ID: 10,
    MOUZA_ID: 20,
    TOTAL_LAND: "1.25",
    ...overrides,
  };
}

describe("normalized khatian record", () => {
  it("preserves duplicate owner occurrences as structured rows", () => {
    const record = normalizeKhatianRecord(row());
    expect(record.khatianNo).toBe("41");
    expect(record.owners).toHaveLength(2);
    expect(record.owners.map((owner) => owner.occurrence)).toEqual([1, 2]);
    expect(record.owners.map((owner) => owner.name)).toEqual(["রহিম", "রহিম"]);
  });

  it("normalizes dag digits and exposes a common structured model", () => {
    const record = normalizeKhatianRecord(row());
    expect(record.dags.map((dag) => dag.dagNo)).toEqual(["202", "205"]);
    expect(record.totalLandRaw).toBe("1.25");
  });

  it("marks truncated compact fields as partial instead of pretending completeness", () => {
    const record = normalizeKhatianRecord(row({ OWNERS: "রহিম, ...", DAGS: "২০২, …" }));
    expect(record.completeness).toBe("partial");
    expect(record.missingFields).toContain("owners");
    expect(record.missingFields).toContain("dags");
  });

  it("matches the unified query across khatian, dag, owner and guardian", () => {
    const record = normalizeKhatianRecord(row());
    expect(normalizedRecordMatches(record, "৪১")).toBe(true);
    expect(normalizedRecordMatches(record, "205")).toBe(true);
    expect(normalizedRecordMatches(record, "রহিম")).toBe(true);
    expect(normalizedRecordMatches(record, "সালমা")).toBe(true);
    expect(normalizedRecordMatches(record, "অনুপস্থিত")).toBe(false);
  });
});
