import type { FullKhatian, FullKhatianDag, FullKhatianOwner, LandRecordSource, SourceEvidence } from "./full-khatian";
import type { KhatianIndex } from "./types";

export type NormalizedCompleteness = "complete" | "partial" | "enriched";

export type NormalizedOwnerRow = {
  occurrence: number;
  name: string;
  father?: string;
  mother?: string;
  spouse?: string;
  guardian?: string;
  /** Source wording for the relationship column, when available. */
  relationRaw?: string;
  address?: string;
  shareRaw?: string;
  source: LandRecordSource | "COMPACT_INDEX";
};

export type NormalizedDagRow = {
  dagNo: string;
  landClass?: string;
  agriculturalType?: string;
  totalAreaRaw?: string;
  khatianAreaRaw?: string;
  remarks?: string;
  source: LandRecordSource | "COMPACT_INDEX";
};

export type NormalizedKhatianRecord = {
  sourceId: number;
  khatianNo: string;
  owners: NormalizedOwnerRow[];
  /** Source guardian/relation rows, preserved even when they cannot be safely linked to one owner. */
  guardians: string[];
  dags: NormalizedDagRow[];
  totalLandRaw: string;
  evidence: SourceEvidence[];
  completeness: NormalizedCompleteness;
  missingFields: Array<"owners" | "guardians" | "dags" | "totalLand">;
  provenanceLabel: string;
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeRecordText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .normalize("NFC")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function normalizeRecordNumber(value: unknown): string {
  return normalizeRecordText(value)
    .replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(AR_DIGITS.indexOf(digit)));
}

export function splitRecordList(value: unknown): string[] {
  const text = normalizeRecordText(value);
  if (!text) return [];
  return text
    .split(/[\n,،;]+/u)
    .map(normalizeRecordText)
    .filter((item) => item && !/^(?:\.{3,}|…+)$/.test(item));
}

function relationParts(value: string | undefined): Pick<NormalizedOwnerRow, "father" | "mother" | "spouse" | "guardian"> {
  const text = normalizeRecordText(value);
  if (!text) return {};
  const result: Pick<NormalizedOwnerRow, "father" | "mother" | "spouse" | "guardian"> = {};
  const parts = text.split(/[|;\n]+/u).map((item) => item.trim()).filter(Boolean);
  for (const part of parts.length ? parts : [text]) {
    const stripped = part.replace(/^\s*(?:পিতা|পিং|father)\s*[:：-]?\s*/iu, "").trim();
    if (/^\s*(?:পিতা|পিং|father)\b/iu.test(part)) result.father = stripped;
    else if (/^\s*(?:মাতা|মাতার নাম|mother)\b/iu.test(part)) result.mother = part.replace(/^\s*(?:মাতা|মাতার নাম|mother)\s*[:：-]?\s*/iu, "").trim();
    else if (/^\s*(?:স্বামী|স্ত্রী|spouse|husband|wife)\b/iu.test(part)) result.spouse = part.replace(/^\s*(?:স্বামী|স্ত্রী|spouse|husband|wife)\s*[:：-]?\s*/iu, "").trim();
    else result.guardian = result.guardian ? `${result.guardian}; ${part}` : part;
  }
  return result;
}

function fromStructuredOwner(owner: FullKhatianOwner, occurrence: number): NormalizedOwnerRow {
  const legacyRelation = relationParts(owner.fatherOrHusband);
  return {
    occurrence,
    name: normalizeRecordText(owner.name),
    father: normalizeRecordText(owner.father) || legacyRelation.father || undefined,
    mother: normalizeRecordText(owner.mother) || legacyRelation.mother || undefined,
    spouse: normalizeRecordText(owner.spouse) || legacyRelation.spouse || undefined,
    guardian: normalizeRecordText(owner.guardian) || legacyRelation.guardian || undefined,
    relationRaw: normalizeRecordText(owner.fatherOrHusband || owner.father || owner.mother || owner.spouse || owner.guardian) || undefined,
    address: normalizeRecordText(owner.address) || undefined,
    shareRaw: normalizeRecordText(owner.shareRaw) || undefined,
    source: owner.source,
  };
}

function fromStructuredDag(dag: FullKhatianDag): NormalizedDagRow {
  return {
    dagNo: normalizeRecordNumber(dag.dagNo),
    landClass: normalizeRecordText(dag.landType) || undefined,
    agriculturalType: normalizeRecordText(dag.agriculturalType) || undefined,
    totalAreaRaw: normalizeRecordText(dag.totalAreaRaw) || undefined,
    khatianAreaRaw: normalizeRecordText(dag.khatianAreaRaw) || undefined,
    remarks: normalizeRecordText(dag.remarks) || undefined,
    source: dag.source,
  };
}

function sourceLooksPartial(value: unknown): boolean {
  return /(?:\.{3,}|…+)\s*$/u.test(normalizeRecordText(value));
}

function compactOwners(index: KhatianIndex): NormalizedOwnerRow[] {
  const owners = splitRecordList(index.OWNERS);
  const guardians = splitRecordList(index.GUARDIANS);
  return owners.map((name, indexNo) => {
    const relation = owners.length === guardians.length
      ? guardians[indexNo]
      : owners.length === 1
        ? guardians[0]
        : undefined;
    return {
      occurrence: indexNo + 1,
      name,
      ...relationParts(relation),
      relationRaw: normalizeRecordText(relation) || undefined,
      source: "COMPACT_INDEX" as const,
    };
  });
}

function compactDags(index: KhatianIndex): NormalizedDagRow[] {
  return splitRecordList(index.DAGS).map((dagNo) => ({
    dagNo: normalizeRecordNumber(dagNo),
    source: "COMPACT_INDEX" as const,
  }));
}

function dagIdentity(row: NormalizedDagRow): string {
  return [
    row.dagNo, row.landClass, row.agriculturalType, row.totalAreaRaw, row.khatianAreaRaw, row.remarks,
  ].map((value) => normalizeRecordText(value).toLocaleLowerCase("bn-BD")).join("|");
}

function dedupeOwners(rows: NormalizedOwnerRow[]): NormalizedOwnerRow[] {
  // Do not collapse identical names. In land records the second occurrence can
  // be a distinct legal owner even when compact public fields omit the details
  // that distinguish them. Upstream structured parsers may dedupe exact source
  // duplicates where that is proven; this presentation model preserves rows.
  return rows
    .filter((row) => Boolean(normalizeRecordText(row.name)))
    .map((row, index) => ({ ...row, occurrence: index + 1 }));
}

function dedupeDags(rows: NormalizedDagRow[]): NormalizedDagRow[] {
  const seen = new Set<string>();
  const output: NormalizedDagRow[] = [];
  for (const row of rows) {
    const key = dagIdentity(row);
    if (!row.dagNo || seen.has(key)) continue;
    seen.add(key);
    output.push(row);
  }
  return output;
}

function normalizedName(value: string): string {
  return normalizeRecordText(value).toLocaleLowerCase("bn-BD");
}

function nameCounts(rows: NormalizedOwnerRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = normalizedName(row.name);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

/**
 * Merge structured and compact owner evidence without guessing duplicate-name
 * relationships. If structured evidence is incomplete, compact rows remain the
 * authoritative presentation fallback. If structured evidence is equal or
 * fuller, keep all structured rows and append only compact occurrences that
 * have no structured counterpart.
 */
function mergeOwnerEvidence(
  compact: NormalizedOwnerRow[],
  structured: NormalizedOwnerRow[],
): NormalizedOwnerRow[] {
  if (!structured.length) return dedupeOwners(compact);
  if (!compact.length) return dedupeOwners(structured);

  const compactCounts = nameCounts(compact);
  const structuredCounts = nameCounts(structured);
  const exactMultiplicity =
    compact.length === structured.length &&
    [...compactCounts.entries()].every(([name, count]) => structuredCounts.get(name) === count);

  if (exactMultiplicity) return dedupeOwners(structured);

  // A smaller structured set is not enough to safely link guardians/shares to
  // repeated compact names. Preserve all compact occurrences rather than guess.
  if (structured.length < compact.length) return dedupeOwners(compact);

  const remainingCompact = new Map(compactCounts);
  for (const row of structured) {
    const name = normalizedName(row.name);
    const left = remainingCompact.get(name) ?? 0;
    if (left > 0) remainingCompact.set(name, left - 1);
  }

  const consumed = new Map<string, number>();
  const compactOnly = compact.filter((row) => {
    const name = normalizedName(row.name);
    const occurrence = (consumed.get(name) ?? 0) + 1;
    consumed.set(name, occurrence);
    const missing = remainingCompact.get(name) ?? 0;
    const total = compactCounts.get(name) ?? 0;
    return occurrence > total - missing;
  });

  return dedupeOwners([...structured, ...compactOnly]);
}

function mergeDagEvidence(
  compact: NormalizedDagRow[],
  structured: NormalizedDagRow[],
): NormalizedDagRow[] {
  if (!structured.length) return dedupeDags(compact);
  if (!compact.length) return dedupeDags(structured);

  const represented = new Set(structured.map((row) => normalizeRecordNumber(row.dagNo)));
  const compactOnly = compact.filter((row) => !represented.has(normalizeRecordNumber(row.dagNo)));
  return dedupeDags([...structured, ...compactOnly]);
}

export function normalizeKhatianRecord(index: KhatianIndex, full?: FullKhatian): NormalizedKhatianRecord {
  const compactOwnerRows = compactOwners(index);
  const compactGuardians = splitRecordList(index.GUARDIANS);
  const compactDagRows = compactDags(index);
  const structuredOwners = (full?.owners ?? [])
    .filter((owner) => owner.source !== "LISF_MOCK")
    .map((owner, indexNo) => fromStructuredOwner(owner, indexNo + 1));
  const structuredDags = (full?.dags ?? [])
    .filter((dag) => dag.source !== "LISF_MOCK")
    .map(fromStructuredDag);
  const owners = mergeOwnerEvidence(compactOwnerRows, structuredOwners);
  const dags = mergeDagEvidence(compactDagRows, structuredDags);
  const totalLandRaw = normalizeRecordText(full?.base?.TOTAL_LAND || index.TOTAL_LAND);
  const guardianRows = compactGuardians.length
    ? compactGuardians
    : owners
        .map((owner) => owner.relationRaw || [
          owner.father ? `পিতা: ${owner.father}` : "",
          owner.mother ? `মাতা: ${owner.mother}` : "",
          owner.spouse ? `স্বামী/স্ত্রী: ${owner.spouse}` : "",
          owner.guardian ? `অভিভাবক: ${owner.guardian}` : "",
        ].filter(Boolean).join(" · "))
        .filter(Boolean);
  const missingFields: NormalizedKhatianRecord["missingFields"] = [];
  if (!owners.length || sourceLooksPartial(index.OWNERS)) missingFields.push("owners");
  if (
    (!owners.some((owner) => owner.father || owner.mother || owner.spouse || owner.guardian) && !compactGuardians.length) ||
    sourceLooksPartial(index.GUARDIANS)
  ) missingFields.push("guardians");
  if (!dags.length || sourceLooksPartial(index.DAGS)) missingFields.push("dags");
  if (!totalLandRaw) missingFields.push("totalLand");

  const hasEnrichment = Boolean(
    index.LANDBD_MIRROR_ENRICHMENT ||
    index.LANDBD_REFERENCE_ENRICHMENT ||
    full?.evidence?.some((item) => !item.official),
  );
  const completeness: NormalizedCompleteness =
    missingFields.length ? "partial" : hasEnrichment ? "enriched" : "complete";

  return {
    sourceId: index.ID,
    khatianNo: normalizeRecordNumber(index.KHATIAN_NO),
    owners,
    guardians: guardianRows,
    dags,
    totalLandRaw,
    evidence: full?.evidence ?? [],
    completeness,
    missingFields,
    provenanceLabel: hasEnrichment
      ? "সরকারি রেকর্ড + যাচাইকৃত সম্পূরক উৎস"
      : "DLRMS / সরকারি ভূমি রেকর্ড উৎস",
  };
}

export function normalizedRecordMatches(record: NormalizedKhatianRecord, query: string): boolean {
  const needle = normalizeRecordNumber(query).toLocaleLowerCase("bn-BD");
  if (!needle) return true;
  const haystack = [
    record.khatianNo,
    record.totalLandRaw,
    ...record.owners.flatMap((owner) => [
      owner.name, owner.father, owner.mother, owner.spouse, owner.guardian, owner.relationRaw, owner.address,
    ]),
    ...record.guardians,
    ...record.dags.flatMap((dag) => [
      dag.dagNo, dag.landClass, dag.agriculturalType, dag.totalAreaRaw, dag.khatianAreaRaw,
    ]),
  ]
    .filter(Boolean)
    .map((value) => normalizeRecordNumber(value).toLocaleLowerCase("bn-BD"));
  return haystack.some((value) => value.includes(needle));
}
