import type { HalSabekEntry } from "../full-khatian";
import type { KhatianIndex } from "../types";

export type HalSabekReportEntry = {
  khatianNo: string;
  mappings: HalSabekEntry[];
  unavailable?: boolean;
};

export type HalSabekReportState = Record<string, HalSabekReportEntry>;

export type MouzaReportRow = {
  sourceId: number;
  khatianNo: string;
  owners: string[];
  guardians: string[];
  dags: string[];
  totalLandAcre: string;
  history: Array<{ previousDag: string; currentDag: string }>;
};

/**
 * Kept as a report-row view model for compatibility with the document layer.
 * A Khatian is now always represented by exactly one row: there are no
 * continuation/"চলমান" fragments.
 */
export type MouzaReportRowSegment = MouzaReportRow & {
  segmentKey: string;
  segmentIndex: 0;
  segmentCount: 1;
  continuation: false;
};

export type KhatianGapSummary = {
  count: number;
  samples: string[];
};

/**
 * Preserve source text while giving Chromium one stable Unicode form.
 * NFC is deliberate: do not use NFKC on legal/source record text.
 */
export function normalizeReportText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .normalize("NFC")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitReportList(value: unknown): string[] {
  const normalized = normalizeReportText(value);
  if (!normalized) return [];

  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of normalized.split(/[\n,،;]+/u)) {
    const item = normalizeReportText(part);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    items.push(item);
  }
  return items;
}

function cleanHistory(mappings: HalSabekEntry[] | undefined) {
  if (!mappings?.length) return [];
  const seen = new Set<string>();
  const result: Array<{ previousDag: string; currentDag: string }> = [];

  for (const mapping of mappings) {
    const previousDag = normalizeReportText(mapping.previousDag);
    const currentDag = normalizeReportText(mapping.currentDag);
    if (!previousDag && !currentDag) continue;
    const key = `${previousDag}\u0000${currentDag}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ previousDag, currentDag });
  }

  return result;
}

export function buildMouzaReportRows(
  rows: KhatianIndex[],
  halSabek: HalSabekReportState,
): MouzaReportRow[] {
  return rows.map((row) => ({
    sourceId: row.ID,
    khatianNo: normalizeReportText(row.KHATIAN_NO),
    owners: splitReportList(row.OWNERS),
    guardians: splitReportList(row.GUARDIANS),
    dags: splitReportList(row.DAGS),
    totalLandAcre: normalizeReportText(row.TOTAL_LAND),
    history: cleanHistory(halSabek[row.KHATIAN_NO]?.mappings),
  }));
}

/**
 * One Khatian must stay one table row. Long owner/guardian/Dag values are
 * wrapped inline by CSS instead of being split into synthetic continuation
 * records. This keeps the visual record faithful to the source Khatian.
 */
export function segmentMouzaReportRows(rows: MouzaReportRow[]): MouzaReportRowSegment[] {
  return rows.map((row) => ({
    ...row,
    segmentKey: String(row.sourceId),
    segmentIndex: 0,
    segmentCount: 1,
    continuation: false,
  }));
}

function inlineLineEstimate(values: string[], charsPerLine: number): number {
  if (!values.length) return 1;
  return Math.max(1, Math.ceil(values.join(", ").length / charsPerLine));
}

export function estimateReportSegmentUnits(row: MouzaReportRowSegment): number {
  const historyValues = row.history.map(
    (entry) => `সাবেক ${entry.previousDag || "—"} → হাল ${entry.currentDag || "—"}`,
  );

  // Cells are rendered as inline wrapping text, so estimate visual lines from
  // the full cell text instead of counting every item as its own block line.
  return Math.max(
    2,
    inlineLineEstimate(row.owners, 42),
    inlineLineEstimate(row.guardians, 38),
    inlineLineEstimate(row.dags, 54),
    inlineLineEstimate(historyValues, 40),
  );
}

/**
 * Produces dense A4-landscape logical pages for direct PDF download. Each
 * Khatian stays in one row. The first page reserves room for report metadata;
 * later pages use most of the available table area instead of leaving a large
 * unused lower half.
 */
export function paginateMouzaReportRows(
  segments: MouzaReportRowSegment[],
  firstPageBudget = 28,
  laterPageBudget = 64,
): MouzaReportRowSegment[][] {
  if (!segments.length) return [];

  const pages: MouzaReportRowSegment[][] = [];
  let current: MouzaReportRowSegment[] = [];
  let used = 0;
  let budget = firstPageBudget;

  for (const segment of segments) {
    const estimatedUnits = estimateReportSegmentUnits(segment) + 1;
    const units = Math.min(estimatedUnits, laterPageBudget);

    if (current.length > 0 && used + units > budget) {
      pages.push(current);
      current = [];
      used = 0;
      budget = laterPageBudget;
    }

    current.push(segment);
    used += units;

    // A genuinely huge Khatian is still kept as one row on its own logical
    // page. The PDF renderer scales that one page rather than clipping data.
    if (estimatedUnits >= budget && current.length === 1) {
      pages.push(current);
      current = [];
      used = 0;
      budget = laterPageBudget;
    }
  }

  if (current.length) pages.push(current);
  return pages;
}

/**
 * Numeric sequence gaps are only a display hint. They are never treated as
 * proof that a government Khatian is missing, because non-numeric/fractional
 * Khatian numbers and intentional numbering gaps can exist.
 */
export function summarizeNumericKhatianGaps(khatianNumbers: string[], sampleLimit = 20): KhatianGapSummary {
  const values = [...new Set(
    khatianNumbers
      .map(normalizeReportText)
      .filter((value) => /^\d+$/.test(value))
      .map(Number)
      .filter((value) => Number.isSafeInteger(value) && value >= 0),
  )].sort((a, b) => a - b);

  let count = 0;
  const samples: string[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    if (current - previous <= 1) continue;
    const gapCount = current - previous - 1;
    count += gapCount;
    for (let missing = previous + 1; missing < current && samples.length < sampleLimit; missing += 1) {
      samples.push(String(missing));
    }
  }

  return { count, samples };
}

export function stableReportPayload(rows: MouzaReportRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      khatianNo: row.khatianNo,
      owners: row.owners,
      guardians: row.guardians,
      dags: row.dags,
      totalLandAcre: row.totalLandAcre,
      history: row.history,
    })),
  );
}
