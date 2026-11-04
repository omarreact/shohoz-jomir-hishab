import type { FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { acreFromDlrmsValue, formatAcre } from "@/src/modules/land/jsonArea";
import { buildKhatianDisplayModel, type KhatianDisplayModel, type ParsedDagRow } from "./khatian-display";

function key(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
}

function area(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const number = acreFromDlrmsValue(value, "acre");
  return number === null ? undefined : formatAcre(number);
}

/** The paper record and the export must both use verified FullKhatian rows.
 * The legacy header-only table ignored full.owners and full.dags even when
 * the server had successfully reconstructed the full record.
 */
export function buildFullKhatianDisplayModel(
  khatian: KhatianDetails,
  full: FullKhatian | undefined,
  surveyKey?: string,
): KhatianDisplayModel {
  const model = buildKhatianDisplayModel(khatian, surveyKey);
  if (!full) return model;

  const authoritativeOwners = full.owners.filter(
    (row) => row.source !== "LISF_MOCK" && row.name.trim(),
  );
  const ownersByName = new Map<string, typeof authoritativeOwners>();
  for (const owner of authoritativeOwners) {
    const normalized = key(owner.name);
    ownersByName.set(normalized, [...(ownersByName.get(normalized) ?? []), owner]);
  }
  const fromFull = authoritativeOwners.map((row) => ({
    name: row.name,
    share: row.shareRaw,
    fatherOrHusband: row.fatherOrHusband,
  }));

  // A full source list may be longer than a compact string. Never replace an
  // existing longer list with a shorter deduplicated or provisional one.
  const owners = fromFull.length > model.owners.length
    ? fromFull
    : model.owners.map((row) => {
        const candidates = ownersByName.get(key(row.name)) ?? [];
        // The compact list and structured list may have different ordering.
        // Without the same unique owner identity, never guess which guardian
        // belongs to a duplicate name. Fully structured rows remain paired.
        const verified = candidates.length === 1 ? candidates[0] : undefined;
        return {
          ...row,
          share: row.share || verified?.shareRaw,
          fatherOrHusband: verified?.fatherOrHusband,
        };
      });

  const sourceDags = full.dags.filter((row) => row.source !== "LISF_MOCK" && row.dagNo.trim());
  const detailedDags = new Map<string, typeof sourceDags>();
  for (const row of sourceDags) {
    const number = key(row.dagNo);
    detailedDags.set(number, [...(detailedDags.get(number) ?? []), row]);
  }
  const converted = (
    row: (typeof sourceDags)[number],
    previous?: ParsedDagRow,
  ): ParsedDagRow => ({
    dagNo: previous?.dagNo || row.dagNo,
    landClass: row.landType || row.agriculturalType || previous?.landClass,
    area: area(row.khatianAreaRaw) || previous?.area,
    shareArea: area(row.khatianAreaRaw) || previous?.shareArea,
    totalArea: area(row.totalAreaRaw) || previous?.totalArea,
    khatianShare: previous?.khatianShare,
  });
  const dags: ParsedDagRow[] = [];
  const seen = new Set<string>();
  for (const row of model.dags) {
    const number = key(row.dagNo);
    if (seen.has(number)) continue;
    seen.add(number);
    const variants = detailedDags.get(number);
    if (!variants?.length) {
      dags.push(row);
      continue;
    }
    // Keep each explicitly sourced land-class/area variant as a separate row.
    variants.forEach((variant, index) => {
      dags.push(converted(variant, index === 0 ? row : undefined));
    });
  }
  for (const [number, variants] of detailedDags) {
    if (seen.has(number)) continue;
    seen.add(number);
    variants.forEach((variant) => dags.push(converted(variant)));
  }

  return {
    ...model,
    owners,
    dags,
    ownerCount: owners.length,
    dagCount: new Set(dags.map((row) => key(row.dagNo))).size,
    hasOwnerShares: owners.some((row) => Boolean(row.share)),
    hasDagAreas: dags.some((row) => Boolean(row.area || row.shareArea || row.totalArea)),
    hasLandClass: dags.some((row) => Boolean(row.landClass)),
  };
}
