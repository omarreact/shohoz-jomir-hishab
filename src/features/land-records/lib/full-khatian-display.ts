import type { FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { normalizeKhatianRecord } from "../normalized-khatian";
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

function ownerRelation(owner: ReturnType<typeof normalizeKhatianRecord>["owners"][number]): string | undefined {
  const hasSeparatedRelation = Boolean(owner.father || owner.mother || owner.spouse);
  if (!hasSeparatedRelation && owner.relationRaw) return owner.relationRaw;
  const parts = [
    owner.father ? `পিতা: ${owner.father}` : "",
    owner.mother ? `মাতা: ${owner.mother}` : "",
    owner.spouse ? `স্বামী/স্ত্রী: ${owner.spouse}` : "",
    owner.guardian ? `অভিভাবক: ${owner.guardian}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

/**
 * Individual Khatian, Mouza Khatian Book and Mouza Dag Book all start from the
 * same normalized record model. Rich FullKhatian rows win when available;
 * compact index fields remain a source-preserving fallback.
 */
export function buildFullKhatianDisplayModel(
  khatian: KhatianDetails,
  full: FullKhatian | undefined,
  surveyKey?: string,
): KhatianDisplayModel {
  const base = buildKhatianDisplayModel(khatian, surveyKey);
  const normalized = normalizeKhatianRecord(khatian, full);

  const owners = normalized.owners.map((owner) => ({
    name: owner.name,
    share: owner.shareRaw,
    fatherOrHusband: ownerRelation(owner),
  }));

  const dags: ParsedDagRow[] = normalized.dags.map((dag) => ({
    dagNo: dag.dagNo,
    landClass: dag.landClass || dag.agriculturalType,
    area: area(dag.khatianAreaRaw),
    shareArea: area(dag.khatianAreaRaw),
    totalArea: area(dag.totalAreaRaw),
  }));

  const resolvedOwners = owners.length ? owners : base.owners;
  const resolvedDags = dags.length ? dags : base.dags;

  return {
    ...base,
    owners: resolvedOwners,
    dags: resolvedDags,
    ownerCount: resolvedOwners.length,
    dagCount: new Set(resolvedDags.map((row) => key(row.dagNo))).size,
    hasOwnerShares: resolvedOwners.some((row) => Boolean(row.share)),
    hasDagAreas: resolvedDags.some((row) => Boolean(row.area || row.shareArea || row.totalArea)),
    hasLandClass: resolvedDags.some((row) => Boolean(row.landClass)),
  };
}
