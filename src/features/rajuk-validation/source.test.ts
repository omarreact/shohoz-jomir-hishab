import { parseSchedule, profileSchedule, toDraftLandBDRecord } from "./source";

function fixture() {
  return {
    metadata: {
      title: "Test schedule",
      schema_version: "2.0.0",
      pdf_sha256: "test",
      pdf_page_count: 4,
      sector_count: 1,
      road_count: 1,
      unique_plot_count: 1,
      source_record_count: 3,
      unresolved_identifier_record_count: 1,
    },
    sectors: {
      "1": {
        roads: {
          "102": {
            plots: {
              "1-102-32": {
                plot_id: "1-102-32",
                sector: "1",
                road: "102",
                plot_number: "32",
                records: [
                  { record_id: "p0002-r002", source: { pdf_page: 2, schedule_page: 1, table_row: 2 },
                    listed_name: { english: "TEST", bangla: null }, rs_dag_references: [
                      { mouza_name: "Bholanathpur", rs_dag_number: "624" },
                    ] },
                  { record_id: "p0002-r003", source: { pdf_page: 2, schedule_page: 1, table_row: 3 } },
                ],
              },
            },
          },
        },
      },
    },
    indexes: {
      mouza_to_plot_ids: { Bholanathpur: ["1-102-32"] },
      mouza_rs_dag_to_plot_ids: { Bholanathpur: { "624": ["1-102-32"] } },
    },
    unresolved_records: [
      { status: "missing_plot_number", source_identifiers: { sector: "1", road: "102", plot_number: null },
        record: { record_id: "p0003-r001", source: { pdf_page: 3, schedule_page: 2, table_row: 1 } } },
    ],
  };
}

describe("RAJUK local conversion adapter", () => {
  it("preserves source pages, original plot identifiers and unresolved records", () => {
    const data = parseSchedule(fixture());
    const profile = profileSchedule(data);
    expect(profile.sectors).toBe(1);
    expect(profile.roads).toBe(1);
    expect(profile.plots).toBe(1);
    expect(profile.records).toBe(3);
    expect(profile.unresolved).toBe(1);
    expect(profile.duplicateRecordIds).toBe(0);
    expect(profile.orphanIndexPlotIds).toBe(0);
    expect(profile.missingSourcePages).toBe(0);
    expect(profile.rows.find((row) => row.unresolved)?.plotId).toBeNull();
    expect(profile.rows.find((row) => row.recordId === "p0002-r002")?.record.source?.table_row).toBe(2);
  });

  it("does not infer region, map sheet, geometry or verified ownership", () => {
    const row = profileSchedule(parseSchedule(fixture())).rows[0];
    const draft = toDraftLandBDRecord(row);
    expect(draft.regionId).toBeNull();
    expect(draft.mapSheetId).toBeNull();
    expect(draft.geometry).toBeNull();
    expect(draft.currentOwnershipVerified).toBe(false);
    expect(draft.source.pdfPage).toBe(2);
    expect(draft.rsDagReferences).toEqual([{ mouza_name: "Bholanathpur", rs_dag_number: "624" }]);
  });

  it("rejects malformed indexes instead of silently generating relationships", () => {
    const malformed = fixture();
    (malformed.indexes.mouza_to_plot_ids as unknown) = { Bholanathpur: "1-102-32" };
    expect(() => parseSchedule(malformed)).toThrow("relationship indexes");
  });

  it("flags duplicate identifiers, broken source pages and orphan index links", () => {
    const value = fixture();
    value.sectors["1"].roads["102"].plots["1-102-32"].records[1].record_id = "p0002-r002";
    value.indexes.mouza_to_plot_ids.Bholanathpur = ["nonexistent-plot"];
    value.unresolved_records[0].record.source.pdf_page = 999;
    const profile = profileSchedule(parseSchedule(value));
    expect(profile.duplicateRecordIds).toBe(1);
    expect(profile.missingSourcePages).toBe(1);
    expect(profile.orphanIndexPlotIds).toBe(1);
    expect(profile.checks.find((item) => item.name === "Unique source record IDs")?.pass).toBe(false);
  });
});
