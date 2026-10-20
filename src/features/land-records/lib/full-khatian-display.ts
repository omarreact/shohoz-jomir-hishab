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
  const ownersByName = new Map(authoritativeOwners.map((row) => [key(row.name), row]));
  const fromFull = authoritativeOwners.map((row) => ({
    name: row.name,
    share: row.shareRaw,
  }));

  // A full source list may be longer than a compact string. Never replace an
  // existing longer list with a shorter deduplicated or provisional one.
  const owners = fromFull.length > model.owners.length
    ? fromFull
    : model.owners.map((row) => ({
        ...row,
        share: row.share || ownersByName.get(key(row.name))?.shareRaw,
      }));

  const sourceDags = full.dags.filter((row) => row.source !== "LISF_MOCK" && row.dagNo.trim());
  const fullDags = new Map(sourceDags.map((row) => [key(row.dagNo), row]));
  const converted = (dagNo: string, previous?: ParsedDagRow): ParsedDagRow => {
    const row = fullDags.get(key(dagNo));
    if (!row) return previous ?? { dagNo };
    return {
      dagNo: previous?.dagNo || row.dagNo,
      landClass: previous?.landClass || row.landType || row.agriculturalType,
      area: previous?.area || area(row.khatianAreaRaw),
      shareArea: previous?.shareArea || area(row.khatianAreaRaw),
      totalArea: previous?.totalArea || area(row.totalAreaRaw),
      khatianShare: previous?.khatianShare,
    };
  };

  const dags = model.dags.map((row) => converted(row.dagNo, row));
  const seen = new Set(dags.map((dag) => key(dag.dagNo)));
  for (const row of sourceDags) {
    if (!seen.has(key(row.dagNo))) {
      dags.push(converted(row.dagNo));
      seen.add(key(row.dagNo));
    }
  }

  return {
    ...model,
    owners,
    dags,
    ownerCount: owners.length,
    dagCount: dags.length,
    hasOwnerShares: owners.some((row) => Boolean(row.share)),
    hasDagAreas: dags.some((row) => Boolean(row.area || row.shareArea || row.totalArea)),
    hasLandClass: dags.some((row) => Boolean(row.landClass)),
  };
}
