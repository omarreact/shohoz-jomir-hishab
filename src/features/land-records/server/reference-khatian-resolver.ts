import porchaData from "@/src/modules/porcha/data/porcha.json";
import type { KhatianDetails, KhatianIndex, KhatianReferenceEnrichment } from "../types";

export type LandBdReferenceRow = {
  khatianNo: string | number;
  owners?: string;
  guardians?: string;
  dags?: string | number;
  totalLand?: string | number;
};

export type LandBdReferenceDataset = {
  id: string;
  path: string;
  surveyKeys: string[];
  jlNumberIds: number[];
  mouzaIds?: number[];
  label: string;
  rows: LandBdReferenceRow[];
};

export type LandBdReferenceMatch = {
  record: KhatianIndex;
  enrichment: KhatianReferenceEnrichment;
};

const TRAILING_PARTIAL = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const BUILTIN_REFERENCE_DATASETS: LandBdReferenceDataset[] = [
  {
    id: "legacy-patira-brs-porcha-v1",
    path: "src/modules/porcha/data/porcha.json",
    surveyKeys: ["BRS"],
    jlNumberIds: [382911],
    mouzaIds: [71947],
    label: "LandBD legacy Patira BRS Porcha dataset",
    rows: (porchaData as Array<{
      JOMIHUB: string | number;
      Column2?: string;
      Column3?: string;
      Column4?: string | number;
      Column5?: string | number;
    }>).map((row) => ({
      khatianNo: row.JOMIHUB,
      owners: row.Column2,
      guardians: row.Column3,
      dags: row.Column4,
      totalLand: row.Column5,
    })),
  },
];

function referenceEnabled(): boolean {
  const configured = process.env.LANDBD_REFERENCE_DATA_ENABLED?.trim().toLowerCase();
  if (configured === "false" || configured === "0" || configured === "off") return false;
  // Unit fixtures remain isolated unless a test explicitly enables references.
  if (process.env.NODE_ENV === "test") {
    return configured === "true" || configured === "1" || configured === "on";
  }
  return true;
}

function normalizeNumberText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/[০-৯]/g, (digit) => String(BN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(AR_DIGITS.indexOf(digit)))
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
  return normalizeNumberText(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("bn-BD");
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

function referenceListCompatible(official: string, reference: string): boolean {
  const officialItems = split(official);
  const referenceItems = split(reference);
  if (!officialItems.length || !referenceItems.length) return true;
  return multisetCovers(referenceItems, officialItems);
}

function preferReferenceList(official: string, reference: string): {
  value: string;
  changed: boolean;
} {
  const officialItems = split(official);
  const referenceItems = split(reference);
  if (!referenceItems.length) return { value: official, changed: false };
  if (!officialItems.length) return { value: referenceItems.join(", "), changed: true };

  if (
    multisetCovers(referenceItems, officialItems) &&
    (TRAILING_PARTIAL.test(official) || referenceItems.length > officialItems.length)
  ) {
    return { value: referenceItems.join(", "), changed: true };
  }

  return { value: official, changed: false };
}

function datasetMatches(
  dataset: LandBdReferenceDataset,
  row: KhatianIndex,
  surveyKey: string,
): boolean {
  const normalizedSurvey = surveyKey.trim().toUpperCase();
  if (!dataset.surveyKeys.some((key) => key.trim().toUpperCase() === normalizedSurvey)) return false;
  if (!dataset.jlNumberIds.includes(row.JL_NUMBER_ID)) return false;
  if (dataset.mouzaIds?.length && row.MOUZA_ID && !dataset.mouzaIds.includes(row.MOUZA_ID)) return false;
  return true;
}

function findReferenceRow(dataset: LandBdReferenceDataset, khatianNo: string): LandBdReferenceRow | null {
  const wanted = normalizeNumberText(khatianNo);
  if (!wanted) return null;
  return dataset.rows.find((row) => normalizeNumberText(row.khatianNo) === wanted) ?? null;
}

function enrichFromDataset(
  row: KhatianIndex,
  surveyKey: string,
  dataset: LandBdReferenceDataset,
): LandBdReferenceMatch | null {
  if (!datasetMatches(dataset, row, surveyKey)) return null;
  const source = findReferenceRow(dataset, row.KHATIAN_NO);
  if (!source) return null;

  const official = {
    OWNERS: row.OWNERS ?? "",
    GUARDIANS: row.GUARDIANS ?? "",
    DAGS: row.DAGS ?? "",
    TOTAL_LAND: row.TOTAL_LAND ?? "",
  };
  const reference = {
    OWNERS: clean(source.owners),
    GUARDIANS: clean(source.guardians),
    DAGS: clean(source.dags),
    TOTAL_LAND: clean(source.totalLand),
  };

  // A current official value must never be overwritten by a contradictory
  // bundled dataset. References may only extend the exact visible identity.
  if (
    !referenceListCompatible(official.OWNERS, reference.OWNERS) ||
    !referenceListCompatible(official.GUARDIANS, reference.GUARDIANS) ||
    !referenceListCompatible(official.DAGS, reference.DAGS)
  ) return null;

  const ownerResult = preferReferenceList(official.OWNERS, reference.OWNERS);
  const guardianResult = preferReferenceList(official.GUARDIANS, reference.GUARDIANS);
  const dagResult = preferReferenceList(official.DAGS, reference.DAGS);
  const totalChanged = !clean(official.TOTAL_LAND) && Boolean(reference.TOTAL_LAND);

  const changedFields = [
    ownerResult.changed ? "OWNERS" : null,
    guardianResult.changed ? "GUARDIANS" : null,
    dagResult.changed ? "DAGS" : null,
    totalChanged ? "TOTAL_LAND" : null,
  ].filter((field): field is "OWNERS" | "GUARDIANS" | "DAGS" | "TOTAL_LAND" => Boolean(field));

  if (!changedFields.length) return null;

  const mergedOwners = ownerResult.value;
  const mergedGuardians = guardianResult.value;
  const mergedDags = dagResult.value;
  const mergedTotalLand = totalChanged ? reference.TOTAL_LAND : row.TOTAL_LAND;
  const displayComplete = Boolean(
    clean(mergedOwners) &&
    clean(mergedDags) &&
    clean(mergedTotalLand) &&
    !TRAILING_PARTIAL.test(mergedOwners) &&
    !TRAILING_PARTIAL.test(mergedGuardians) &&
    !TRAILING_PARTIAL.test(mergedDags),
  );

  const enrichment: KhatianReferenceEnrichment = {
    source: "LANDBD_BUNDLED_REFERENCE",
    datasetId: dataset.id,
    datasetPath: dataset.path,
    surveyKey: surveyKey.trim().toUpperCase(),
    jlNumberId: row.JL_NUMBER_ID,
    mouzaId: row.MOUZA_ID,
    changedFields,
    displayComplete,
  };

  return {
    record: {
      ...row,
      OWNERS: mergedOwners,
      GUARDIANS: mergedGuardians,
      DAGS: mergedDags,
      TOTAL_LAND: mergedTotalLand,
      LANDBD_REFERENCE_ENRICHMENT: enrichment,
    },
    enrichment,
  };
}

export function enrichKhatianWithReferenceDatasets(
  row: KhatianIndex,
  surveyKey: string,
  datasets: LandBdReferenceDataset[] = BUILTIN_REFERENCE_DATASETS,
): LandBdReferenceMatch | null {
  if (!referenceEnabled()) return null;

  for (const dataset of datasets) {
    const match = enrichFromDataset(row, surveyKey, dataset);
    if (match) return match;
  }
  return null;
}

export function enrichKhatianDetailsWithReferenceDatasets(
  base: KhatianDetails,
  surveyKey: string,
  datasets: LandBdReferenceDataset[] = BUILTIN_REFERENCE_DATASETS,
): { record: KhatianDetails; enrichment: KhatianReferenceEnrichment } | null {
  const enriched = enrichKhatianWithReferenceDatasets(base, surveyKey, datasets);
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

export function getReferenceDatasetInventory() {
  return BUILTIN_REFERENCE_DATASETS.map((dataset) => ({
    id: dataset.id,
    path: dataset.path,
    label: dataset.label,
    surveyKeys: [...dataset.surveyKeys],
    jlNumberIds: [...dataset.jlNumberIds],
    mouzaIds: dataset.mouzaIds ? [...dataset.mouzaIds] : [],
    recordCount: dataset.rows.length,
  }));
}
