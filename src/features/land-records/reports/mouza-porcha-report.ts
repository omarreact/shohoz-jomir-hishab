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

export type MouzaReportOrientation = "portrait" | "landscape";

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

const banglaGraphemeSegmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("bn-BD", { granularity: "grapheme" })
    : null;

function visibleTextLength(value: string): number {
  if (!value) return 0;
  if (banglaGraphemeSegmenter) {
    return Array.from(banglaGraphemeSegmenter.segment(value)).length;
  }
  return Array.from(value).length;
}

function inlineLineEstimate(values: string[], charsPerLine: number): number {
  if (!values.length) return 1;
  return Math.max(1, Math.ceil(visibleTextLength(values.join(", ")) / charsPerLine));
}

export function estimateReportSegmentUnits(
  row: MouzaReportRowSegment,
  orientation: MouzaReportOrientation = "portrait",
): number {
  const historyValues = row.history.map(
    (entry) => `সাবেক ${entry.previousDag || "—"} → হাল ${entry.currentDag || "—"}`,
  );

  // Use grapheme clusters instead of JavaScript string.length. Bangla vowel
  // signs and combining marks otherwise make rows look much longer than they
  // visually are, which caused very sparse PDF pages.
  const lineWidths =
    orientation === "landscape"
      ? { owners: 34, guardians: 30, dags: 45, history: 32 }
      : { owners: 23, guardians: 20, dags: 30, history: 23 };

  return Math.max(
    2,
    inlineLineEstimate(row.owners, lineWidths.owners),
    inlineLineEstimate(row.guardians, lineWidths.guardians),
    inlineLineEstimate(row.dags, lineWidths.dags),
    inlineLineEstimate(historyValues, lineWidths.history),
  );
}

/**
 * Produces dense A4-portrait logical pages for inline preview, print and PDF.
 * Each Khatian stays in one row. The first page reserves room for report
 * metadata; later pages use the taller portrait table area. Line estimates are
 * intentionally narrower than the old landscape layout so long Bangla owner,
 * guardian and Dag values paginate before they can be clipped.
 */
export function paginateMouzaReportRows(
  segments: MouzaReportRowSegment[],
  firstPageBudget?: number,
  laterPageBudget?: number,
  orientation: MouzaReportOrientation = "portrait",
): MouzaReportRowSegment[][] {
  if (!segments.length) return [];

  // Portrait has more vertical room; landscape has more horizontal room and
  // therefore fewer wrapped lines. These budgets are tuned to keep the table
  // visually dense while still reserving the first-page metadata and footer.
  const resolvedFirstBudget =
    firstPageBudget ?? (orientation === "landscape" ? 30 : 42);
  const resolvedLaterBudget =
    laterPageBudget ?? (orientation === "landscape" ? 54 : 78);

  const pages: MouzaReportRowSegment[][] = [];
  let current: MouzaReportRowSegment[] = [];
  let used = 0;
  let budget = resolvedFirstBudget;

  for (const segment of segments) {
    const estimatedUnits = estimateReportSegmentUnits(segment, orientation) + 1;
    const units = Math.min(estimatedUnits, resolvedLaterBudget);

    if (current.length > 0 && used + units > budget) {
      pages.push(current);
      current = [];
      used = 0;
      budget = resolvedLaterBudget;
    }

    current.push(segment);
    used += units;

    // A genuinely huge Khatian is still kept as one row on its own logical
    // page. It is never split into synthetic continuation records.
    if (estimatedUnits >= budget && current.length === 1) {
      pages.push(current);
      current = [];
      used = 0;
      budget = resolvedLaterBudget;
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
