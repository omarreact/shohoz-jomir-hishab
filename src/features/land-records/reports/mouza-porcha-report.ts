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

export type MouzaReportRowSegment = MouzaReportRow & {
  segmentKey: string;
  segmentIndex: number;
  segmentCount: number;
  continuation: boolean;
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

function chunkArray<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output.length ? output : [[]];
}

/**
 * Very large Khatian rows are split into explicit continuation segments.
 * This prevents one giant owner/Dag cell from overflowing an A4 page while
 * preserving every source value in the PDF.
 */
export function segmentMouzaReportRows(rows: MouzaReportRow[]): MouzaReportRowSegment[] {
  const segments: MouzaReportRowSegment[] = [];

  for (const row of rows) {
    const ownerChunks = chunkArray(row.owners, 6);
    const guardianChunks = chunkArray(row.guardians, 6);
    const dagChunks = chunkArray(row.dags, 12);
    const historyChunks = chunkArray(row.history, 6);
    const segmentCount = Math.max(
      ownerChunks.length,
      guardianChunks.length,
      dagChunks.length,
      historyChunks.length,
    );

    for (let index = 0; index < segmentCount; index += 1) {
      segments.push({
        ...row,
        owners: ownerChunks[index] ?? [],
        guardians: guardianChunks[index] ?? [],
        dags: dagChunks[index] ?? [],
        history: historyChunks[index] ?? [],
        totalLandAcre: index === 0 ? row.totalLandAcre : "",
        segmentKey: `${row.sourceId}-${index}`,
        segmentIndex: index,
        segmentCount,
        continuation: index > 0,
      });
    }
  }

  return segments;
}

function listLineEstimate(values: string[], charsPerLine: number): number {
  if (!values.length) return 1;
  return values.reduce(
    (total, value) => total + Math.max(1, Math.ceil(value.length / charsPerLine)),
    0,
  );
}

export function estimateReportSegmentUnits(row: MouzaReportRowSegment): number {
  const historyValues = row.history.map(
    (entry) => `সাবেক ${entry.previousDag || "—"} → হাল ${entry.currentDag || "—"}`,
  );
  return Math.max(
    2,
    listLineEstimate(row.owners, 32),
    listLineEstimate(row.guardians, 28),
    listLineEstimate(row.dags, 22),
    listLineEstimate(historyValues, 26),
  );
}

/**
 * Produces deterministic A4-friendly logical pages so each page can render its
 * own table header and footer (including Page X of Y) before window.print().
 */
export function paginateMouzaReportRows(
  segments: MouzaReportRowSegment[],
  firstPageBudget = 24,
  laterPageBudget = 44,
): MouzaReportRowSegment[][] {
  if (!segments.length) return [];

  const pages: MouzaReportRowSegment[][] = [];
  let current: MouzaReportRowSegment[] = [];
  let used = 0;
  let budget = firstPageBudget;

  for (const segment of segments) {
    const units = Math.min(estimateReportSegmentUnits(segment) + 1, laterPageBudget);
    if (current.length > 0 && used + units > budget) {
      pages.push(current);
      current = [];
      used = 0;
      budget = laterPageBudget;
    }
    current.push(segment);
    used += units;
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
