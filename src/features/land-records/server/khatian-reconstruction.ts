import type { KhatianDetails, KhatianIndex } from "../types";

export interface KhatianSearchEvidence {
  owner?: string;
  dagNumber?: string;
  ownerVerified?: boolean;
  dagVerified?: boolean;
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function mergeTextValues(values: Array<string | undefined>): string {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const raw of values) {
    const value = clean(raw);
    if (!value) continue;
    const normalized = value.replace(/\s+/g, " ").toLocaleLowerCase("bn-BD");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(value);
  }

  return output.join(", ");
}

function sameKhatian(base: KhatianDetails, row: KhatianIndex): boolean {
  return row.ID === base.ID || clean(row.KHATIAN_NO) === clean(base.KHATIAN_NO);
}

/**
 * DLRMS can match owners/dags that are not echoed in the compact khatian row.
 * Reconstruct the best public record LandBD can truthfully show by combining:
 * - the detail endpoint,
 * - an exact khatian-number lookup,
 * - rows returned by the active owner/dag searches,
 * - search evidence only when DLRMS confirmed the target khatian matched it.
 *
 * Owner search text is kept as search evidence because users can enter a
 * partial name. An exact dag-number query can safely be merged into the dag
 * list after DLRMS confirms that the same khatian matched it.
 */
export function reconstructKhatian(
  base: KhatianDetails,
  candidateRows: KhatianIndex[],
  evidence: KhatianSearchEvidence = {},
): KhatianDetails {
  const rows = candidateRows.filter((row) => sameKhatian(base, row));
  const verifiedOwner = evidence.ownerVerified ? clean(evidence.owner) : "";
  const verifiedDag = evidence.dagVerified ? clean(evidence.dagNumber) : "";
  const owners = mergeTextValues([base.OWNERS, ...rows.map((row) => row.OWNERS)]);
  const dags = mergeTextValues([base.DAGS, ...rows.map((row) => row.DAGS), verifiedDag]);
  const guardians = mergeTextValues([base.GUARDIANS, ...rows.map((row) => row.GUARDIANS)]);
  const totalLand = clean(base.TOTAL_LAND) || rows.map((row) => clean(row.TOTAL_LAND)).find(Boolean) || "";

  const searchVerified: Record<string, string> = {};
  if (verifiedOwner) searchVerified.OWNER_QUERY = verifiedOwner;
  if (verifiedDag) searchVerified.DAG_NUMBER_QUERY = verifiedDag;

  const reconstruction = {
    METHOD: "detail + exact khatian lookup + verified search-hit merge",
    MATCHED_ROWS: rows.length,
    SEARCH_VERIFIED: searchVerified,
    MERGED_OWNERS: owners,
    MERGED_DAGS: dags,
    MERGED_GUARDIANS: guardians,
    MERGED_TOTAL_LAND: totalLand,
    RETURNED_VARIANTS: rows.map((row) => ({
      ID: row.ID,
      KHATIAN_NO: row.KHATIAN_NO,
      OWNERS: row.OWNERS,
      DAGS: row.DAGS,
      GUARDIANS: row.GUARDIANS,
      TOTAL_LAND: row.TOTAL_LAND ?? "",
    })),
  };

  return {
    ...base,
    OWNERS: owners,
    DAGS: dags,
    GUARDIANS: guardians,
    TOTAL_LAND: totalLand,
    PUBLIC_RECORD: {
      ...(base.PUBLIC_RECORD ?? {}),
      ...(verifiedOwner ? { "সার্চে_মিল_পাওয়া_মালিক_নাম_বা_অংশ": verifiedOwner } : {}),
      ...(verifiedDag ? { "সার্চে_মিল_পাওয়া_দাগ": verifiedDag } : {}),
      LANDBD_RECONSTRUCTION: reconstruction,
    },
  };
}
