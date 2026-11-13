import porchaData from "@/src/modules/porcha/data/porcha.json";
import type { KhatianDetails, KhatianIndex, KhatianReferenceEnrichment } from "../types";

const PATIRA_BRS_SCOPE = {
  surveyKey: "BRS",
  jlNumberId: 382911,
  mouzaId: 71947,
  jlNumber: "5",
  mouzaName: "পাতিরা",
} as const;

type RawReferenceRecord = {
  JOMIHUB: number | string;
  Column2?: string;
  Column3?: string;
  Column4?: number | string;
  Column5?: number | string;
};

export type LandBdReferenceMatch = {
  record: KhatianIndex;
  enrichment: KhatianReferenceEnrichment;
};

const TRAILING_PARTIAL = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

function normalizeNumberText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)))
    .replace(/\s+/g, "")
    .trim();
}

function clean(value: unknown): string {
  return String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

function split(value: unknown): string[] {
  const text = clean(value).replace(TRAILING_PARTIAL, "").replace(/,\s*$/u, "").trim();
  if (!text) return [];
  return text
    .split(/[,،;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function token(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
}

function multisetCovers(container: string[], subset: string[]): boolean {
  const counts = new Map<string, number>();
  for (const value of container) {
    const key = token(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const value of subset) {
    const key = token(value);
    const remaining = counts.get(key) ?? 0;
    if (remaining <= 0) return false;
    counts.set(key, remaining - 1);
  }
  return true;
}

function preferReferenceList(official: string, reference: string): {
  value: string;
  changed: boolean;
} {
  const officialItems = split(official);
  const referenceItems = split(reference);
  if (!referenceItems.length) return { value: official, changed: false };
  if (!officialItems.length) return { value: referenceItems.join(", "), changed: true };

  const officialIsPartial = TRAILING_PARTIAL.test(official);
  const referenceCoversOfficial = multisetCovers(referenceItems, officialItems);
  if (
    referenceCoversOfficial &&
    (officialIsPartial || referenceItems.length > officialItems.length)
  ) {
    return { value: referenceItems.join(", "), changed: true };
  }

  return { value: official, changed: false };
}

function referenceRows(): RawReferenceRecord[] {
  return porchaData as RawReferenceRecord[];
}

function findReference(khatianNo: string): RawReferenceRecord | null {
  const wanted = normalizeNumberText(khatianNo);
  if (!wanted) return null;
  return referenceRows().find((row) => normalizeNumberText(row.JOMIHUB) === wanted) ?? null;
}

export function isPatiraBrsReferenceScope(input: {
  surveyKey: string;
  jlNumberId: number;
  mouzaId?: number;
}): boolean {
  return input.surveyKey.toUpperCase() === PATIRA_BRS_SCOPE.surveyKey &&
    input.jlNumberId === PATIRA_BRS_SCOPE.jlNumberId &&
    (!input.mouzaId || input.mouzaId === PATIRA_BRS_SCOPE.mouzaId);
}

export function enrichPatiraBrsWithLandBdReference(
  row: KhatianIndex,
  surveyKey: string,
): LandBdReferenceMatch | null {
  if (!isPatiraBrsReferenceScope({
    surveyKey,
    jlNumberId: row.JL_NUMBER_ID,
    mouzaId: row.MOUZA_ID || undefined,
  })) return null;

  const source = findReference(row.KHATIAN_NO);
  if (!source) return null;

  const official = {
    OWNERS: row.OWNERS ?? "",
    GUARDIANS: row.GUARDIANS ?? "",
    DAGS: row.DAGS ?? "",
    TOTAL_LAND: row.TOTAL_LAND ?? "",
  };

  const ownerResult = preferReferenceList(official.OWNERS, clean(source.Column2));
  const guardianResult = preferReferenceList(official.GUARDIANS, clean(source.Column3));
  const dagResult = preferReferenceList(official.DAGS, clean(source.Column4));

  const referenceTotal = clean(source.Column5);
  const totalChanged = !clean(official.TOTAL_LAND) && Boolean(referenceTotal);
  const changedFields = [
    ownerResult.changed ? "OWNERS" : null,
    guardianResult.changed ? "GUARDIANS" : null,
    dagResult.changed ? "DAGS" : null,
    totalChanged ? "TOTAL_LAND" : null,
  ].filter((field): field is "OWNERS" | "GUARDIANS" | "DAGS" | "TOTAL_LAND" => Boolean(field));

  if (!changedFields.length) return null;

  const enrichment: KhatianReferenceEnrichment = {
    source: "LANDBD_BUNDLED_PATIRA_REFERENCE",
    dataset: "src/modules/porcha/data/porcha.json",
    surveyKey: PATIRA_BRS_SCOPE.surveyKey,
    jlNumberId: PATIRA_BRS_SCOPE.jlNumberId,
    mouzaId: PATIRA_BRS_SCOPE.mouzaId,
    changedFields,
    displayComplete: true,
  };

  return {
    record: {
      ...row,
      OWNERS: ownerResult.value,
      GUARDIANS: guardianResult.value,
      DAGS: dagResult.value,
      TOTAL_LAND: totalChanged ? referenceTotal : row.TOTAL_LAND,
      LANDBD_REFERENCE_ENRICHMENT: enrichment,
    },
    enrichment,
  };
}

export function enrichPatiraBrsDetailsWithLandBdReference(
  base: KhatianDetails,
  surveyKey: string,
): { record: KhatianDetails; enrichment: KhatianReferenceEnrichment } | null {
  const enriched = enrichPatiraBrsWithLandBdReference(base, surveyKey);
  if (!enriched) return null;
  return {
    enrichment: enriched.enrichment,
    record: {
      ...base,
      ...enriched.record,
      PUBLIC_RECORD: {
        ...(base.PUBLIC_RECORD ?? {}),
        LANDBD_REFERENCE_ENRICHMENT: enriched.enrichment,
      },
    },
  };
}

export function patiraReferenceRecordCount(): number {
  return referenceRows().length;
}

export function patiraReferenceScope() {
  return { ...PATIRA_BRS_SCOPE };
}
