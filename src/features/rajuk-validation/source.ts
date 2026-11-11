/**
 * Client-only RAJUK schedule adapter. No writes, no network calls, no inferred
 * cadastral geometry, map sheets, current ownership, or region mapping.
 */
export type SourcePointer = {
  pdf_page?: number | null;
  schedule_page?: number | null;
  table_row?: number | null;
};

export type ScheduleRecord = {
  record_id: string;
  source?: SourcePointer;
  listed_name?: { english?: string | null; bangla?: string | null };
  deed_number?: string | null;
  land_katha?: number | null;
  land_katha_source?: string | null;
  rs_dag_numbers_source?: string | null;
  mouza_names_source?: string | null;
  rs_dag_references?: Array<{ mouza_name?: string | null; rs_dag_number?: string | null }>;
};

export type SchedulePlot = {
  plot_id: string;
  sector?: string;
  road?: string;
  plot_number?: string | null;
  records: ScheduleRecord[];
  rs_dag_references?: ScheduleRecord["rs_dag_references"];
};

export type ScheduleData = {
  metadata: {
    title?: string;
    schema_version?: string;
    pdf_sha256?: string;
    source_filename?: string;
    pdf_page_count?: number;
    sector_count?: number;
    road_count?: number;
    unique_plot_count?: number;
    source_record_count?: number;
    unresolved_identifier_record_count?: number;
  };
  sectors: Record<string, { sector_number?: string; roads: Record<string, { road_name?: string; plots: Record<string, SchedulePlot> }> }>;
  indexes: {
    mouza_to_plot_ids: Record<string, string[]>;
    mouza_rs_dag_to_plot_ids: Record<string, Record<string, string[]>>;
  };
  unresolved_records: Array<{
    status?: string;
    source_identifiers?: { plot_id?: string | null; sector?: string; road?: string; plot_number?: string | null };
    record: ScheduleRecord;
  }>;
};

export type ReviewStatus = "unreadable" | "ambiguous" | "manual" | "verified";
export type ReviewEntry = { key: string; status: ReviewStatus; note: string; updatedAt: string };
export type IssueStatus = "open" | "investigating" | "resolved";
export type ReviewIssue = { id: string; title: string; severity: "high" | "medium" | "low"; status: IssueStatus; detail: string };

export type FlatRecord = {
  record: ScheduleRecord;
  recordId: string;
  plotId: string | null;
  sector: string | null;
  road: string | null;
  plotNumber: string | null;
  unresolved: boolean;
};

export type DatasetProfile = {
  rows: FlatRecord[];
  plotIds: Set<string>;
  sectors: number;
  roads: number;
  plots: number;
  records: number;
  duplicateRecordIds: number;
  missingSourcePages: number;
  badScheduleReferences: number;
  hierarchyMismatches: number;
  orphanIndexPlotIds: number;
  indexEdges: number;
  unresolved: number;
  checks: Array<{ name: string; pass: boolean; detail: string }>;
};

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArrayIndex(value: unknown): value is Record<string, string[]> {
  return object(value) && Object.values(value).every(
    (item) => Array.isArray(item) && item.every((id) => typeof id === "string"),
  );
}

export function parseSchedule(value: unknown): ScheduleData {
  if (!object(value) || !object(value.metadata) || !object(value.sectors) || !object(value.indexes) ||
      !Array.isArray(value.unresolved_records)) {
    throw new Error("This is not a RAJUK object-oriented JSON file. Expected metadata, sectors, indexes, and unresolved_records.");
  }
  if (!stringArrayIndex(value.indexes.mouza_to_plot_ids) || !object(value.indexes.mouza_rs_dag_to_plot_ids) ||
      !Object.values(value.indexes.mouza_rs_dag_to_plot_ids).every(stringArrayIndex)) {
    throw new Error("RAJUK relationship indexes are missing or malformed.");
  }
  for (const sector of Object.values(value.sectors)) {
    if (!object(sector) || !object(sector.roads)) throw new Error("Malformed sector/roads object.");
    for (const road of Object.values(sector.roads)) {
      if (!object(road) || !object(road.plots)) throw new Error("Malformed road/plots object.");
      for (const plot of Object.values(road.plots)) {
        if (!object(plot) || typeof plot.plot_id !== "string" || !Array.isArray(plot.records)) {
          throw new Error("Malformed plot or missing records array.");
        }
        for (const row of plot.records) {
          if (!object(row) || typeof row.record_id !== "string") throw new Error("Malformed record identifier.");
        }
      }
    }
  }
  for (const item of value.unresolved_records) {
    if (!object(item) || !object(item.record) || typeof item.record.record_id !== "string") {
      throw new Error("Malformed unresolved record.");
    }
  }
  return value as unknown as ScheduleData;
}

export function profileSchedule(data: ScheduleData): DatasetProfile {
  const rows: FlatRecord[] = [];
  const plotIds = new Set<string>();
  const recordIds = new Set<string>();
  let roads = 0;
  let duplicateRecordIds = 0;
  let missingSourcePages = 0;
  let badScheduleReferences = 0;
  let hierarchyMismatches = 0;
  let plots = 0;

  function add(record: ScheduleRecord, plotId: string | null, sector: string | null,
      road: string | null, plotNumber: string | null, unresolved: boolean) {
    if (recordIds.has(record.record_id)) duplicateRecordIds++;
    recordIds.add(record.record_id);
    if (!Number.isInteger(record.source?.pdf_page ?? NaN) || (record.source?.pdf_page ?? 0) < 1 ||
        (record.source?.pdf_page ?? 0) > (data.metadata.pdf_page_count ?? Infinity)) missingSourcePages++;
    if (!Number.isInteger(record.source?.schedule_page ?? NaN) || (record.source?.schedule_page ?? 0) < 1 ||
        !Number.isInteger(record.source?.table_row ?? NaN) || (record.source?.table_row ?? 0) < 1) badScheduleReferences++;
    rows.push({ record, recordId: record.record_id, plotId, sector, road, plotNumber, unresolved });
  }

  for (const [sectorId, sector] of Object.entries(data.sectors)) {
    for (const [roadId, road] of Object.entries(sector.roads)) {
      roads++;
      for (const [key, plot] of Object.entries(road.plots)) {
        plots++;
        if (key !== plot.plot_id || (plot.sector != null && plot.sector !== sectorId) ||
            (plot.road != null && plot.road !== roadId)) hierarchyMismatches++;
        plotIds.add(plot.plot_id || key);
        for (const record of plot.records) add(record, plot.plot_id || key, sectorId, roadId, plot.plot_number ?? null, false);
      }
    }
  }
  for (const item of data.unresolved_records) {
    const source = item.source_identifiers;
    add(item.record, null, source?.sector ?? null, source?.road ?? null, null, true);
  }

  let orphanIndexPlotIds = 0;
  let indexEdges = 0;
  for (const plotList of Object.values(data.indexes.mouza_to_plot_ids)) {
    for (const plotId of plotList) {
      indexEdges++;
      if (!plotIds.has(plotId)) orphanIndexPlotIds++;
    }
  }
  for (const byDag of Object.values(data.indexes.mouza_rs_dag_to_plot_ids)) {
    for (const plotList of Object.values(byDag)) {
      for (const plotId of plotList) {
        indexEdges++;
        if (!plotIds.has(plotId)) orphanIndexPlotIds++;
      }
    }
  }

  const records = rows.length;
  const checks = [
    { name: "Unique source record IDs", pass: duplicateRecordIds === 0, detail: String(duplicateRecordIds) + " duplicate IDs" },
    { name: "Source page provenance", pass: missingSourcePages === 0, detail: String(missingSourcePages) + " invalid/missing page references" },
    { name: "Printed schedule/table row references", pass: badScheduleReferences === 0, detail: String(badScheduleReferences) + " missing/invalid references" },
    { name: "Sector/road/plot hierarchy", pass: hierarchyMismatches === 0, detail: String(hierarchyMismatches) + " mismatched identifiers" },
    { name: "Relationship index references", pass: orphanIndexPlotIds === 0, detail: String(orphanIndexPlotIds) + " unmatched plot references" },
    { name: "Record count matches metadata", pass: data.metadata.source_record_count === records,
      detail: String(records) + " actual / " + String(data.metadata.source_record_count ?? "unknown") + " declared" },
    { name: "Plot count matches metadata", pass: data.metadata.unique_plot_count === plots,
      detail: String(plots) + " actual / " + String(data.metadata.unique_plot_count ?? "unknown") + " declared" },
    { name: "All plot IDs resolved", pass: data.unresolved_records.length === 0,
      detail: String(data.unresolved_records.length) + " source rows need plot ID verification" },
  ];
  return { rows, plotIds, sectors: Object.keys(data.sectors).length, roads, plots, records,
    duplicateRecordIds, missingSourcePages, badScheduleReferences, hierarchyMismatches, orphanIndexPlotIds, indexEdges,
    unresolved: data.unresolved_records.length, checks };
}

/** Draft shape for review only; this is NOT the verified LandBD importer contract. */
export function toDraftLandBDRecord(row: FlatRecord) {
  return {
    source: { document: "rajuk1.pdf", recordId: row.recordId,
      pdfPage: row.record.source?.pdf_page ?? null,
      schedulePage: row.record.source?.schedule_page ?? null,
      tableRow: row.record.source?.table_row ?? null },
    scheme: "RAJUK_Purbachol_RS_schedule",
    sector: row.sector,
    road: row.road,
    plotId: row.plotId,
    plotNumber: row.plotNumber,
    listedName: { english: row.record.listed_name?.english ?? null,
      bangla: row.record.listed_name?.bangla ?? null },
    deedNumber: row.record.deed_number ?? null,
    landKatha: row.record.land_katha ?? null,
    rsDagReferences: row.record.rs_dag_references ?? [],
    regionId: null, mapSheetId: null, geometry: null,
    currentOwnershipVerified: false,
    importStatus: "blocked_manual_validation",
  };
}

export const SOURCE_ISSUES: ReviewIssue[] = [
  { id: "RJ-001", severity: "high", status: "open", title: "29 missing plot identifiers",
    detail: "Unresolved source rows must remain unlinked; verify against original PDF before any mapping." },
  { id: "RJ-002", severity: "high", status: "open", title: "Page 401 RS dag/mouza mismatch",
    detail: "Source table row 46 has 43 RS dag values versus 22 mouza values. Do not pair by position." },
  { id: "RJ-003", severity: "medium", status: "open", title: "Page 328 is intentionally blank",
    detail: "Keep the blank source page accounted for; do not invent rows." },
  { id: "RJ-004", severity: "high", status: "open", title: "Extracted Bengali names need review",
    detail: "Missing or malformed Bengali glyphs must be verified visually against source pages." },
  { id: "RJ-005", severity: "high", status: "open", title: "Unverified LandBD import contract",
    detail: "No authoritative region/map sheet/geometry or production API mapping has been validated." },
];

export const ACCEPTANCE_CRITERIA = [
  "All 634 PDF pages are traceable, including the intentionally blank page 328.",
  "Every record retains its source PDF page, printed schedule page and table row.",
  "Sector → road → plot → record relationships retain their original source identifiers.",
  "Mouza and RS dag relationships preserve original many-to-many context.",
  "29 unresolved plot identifiers are verified or explicitly retained as exceptions.",
  "Page 401 dag/mouza mismatch is reviewed without guessed assignments.",
  "Ambiguous Bengali, deed and area values remain tentative until source verification.",
  "Region, map sheet and geometry are null until authoritative mapping is supplied.",
  "Independent row/count/key/index checks pass on corrected export.",
  "LandBD importer schema, access rules, duplicate handling and rollback are approved.",
] as const;

export const QA_CHECKS = [
  "Desktop 1440px: search, filters, tabs, long strings, source comparison",
  "Tablet 768px: navigation, horizontal tables and PDF viewer",
  "Mobile 390px: upload, search, record detail, zoom and scroll",
  "Import 26 MB RAJUK JSON locally without browser errors",
  "Open original PDF and jump to source page 2, 328, 401 and 634",
  "Check missing/ambiguous field review and export/import review JSON",
  "Confirm unresolved rows never receive fabricated plot numbers",
  "Confirm 43/22 mismatch on page 401 is not auto-paired",
  "Review relationship index links and detect orphan references",
  "Confirm no uploads, API writes, GitHub commits or production changes occur",
] as const;
