import type { KhatianIndex } from "../types";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const TRAILING_PARTIAL = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;

export type MouzaDagReportRow = {
  dagNo: string;
  khatianNos: string[];
  sourceIds: number[];
};

export function normalizeDagToken(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(AR_DIGITS.indexOf(digit)))
    .replace(/\s+/g, "")
    .trim();
}

export function splitDagList(value: string | undefined): string[] {
  const text = String(value ?? "")
    .normalize("NFC")
    .replace(TRAILING_PARTIAL, "")
    .replace(/[,،;]+$/u, "")
    .trim();
  if (!text) return [];
  return text
    .split(/[,،;]+/u)
    .map((item) => normalizeDagToken(item))
    .filter(Boolean);
}

function compareNatural(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

export function buildMouzaDagRows(rows: KhatianIndex[]): MouzaDagReportRow[] {
  const grouped = new Map<string, { khatians: Set<string>; sourceIds: Set<number> }>();

  for (const row of rows) {
    const khatianNo = normalizeDagToken(row.KHATIAN_NO);
    if (!khatianNo) continue;

    for (const dagNo of splitDagList(row.DAGS)) {
      const current = grouped.get(dagNo) ?? {
        khatians: new Set<string>(),
        sourceIds: new Set<number>(),
      };
      current.khatians.add(khatianNo);
      current.sourceIds.add(row.ID);
      grouped.set(dagNo, current);
    }
  }

  return [...grouped.entries()]
    .map(([dagNo, group]) => ({
      dagNo,
      khatianNos: [...group.khatians].sort(compareNatural),
      sourceIds: [...group.sourceIds].sort((a, b) => a - b),
    }))
    .sort((a, b) => compareNatural(a.dagNo, b.dagNo));
}

export function paginateMouzaDagRows(
  rows: MouzaDagReportRow[],
  perPage = 32,
): MouzaDagReportRow[][] {
  const pages: MouzaDagReportRow[][] = [];
  for (let index = 0; index < rows.length; index += perPage) {
    pages.push(rows.slice(index, index + perPage));
  }
  return pages;
}
