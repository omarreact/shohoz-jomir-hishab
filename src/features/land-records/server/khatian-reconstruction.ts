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
 * Search evidence is kept separate from owner/dag values because a user may
 * search with only a partial name. This prevents a partial query from being
 * misrepresented as a complete legal name while still preserving the hidden
 * match that led to the khatian.
 */
export function reconstructKhatian(
  base: KhatianDetails,
  candidateRows: KhatianIndex[],
  evidence: KhatianSearchEvidence = {},
): KhatianDetails {
  const rows = candidateRows.filter((row) => sameKhatian(base, row));
  const owners = mergeTextValues([base.OWNERS, ...rows.map((row) => row.OWNERS)]);
  const dags = mergeTextValues([base.DAGS, ...rows.map((row) => row.DAGS)]);
  const guardians = mergeTextValues([base.GUARDIANS, ...rows.map((row) => row.GUARDIANS)]);
  const totalLand = clean(base.TOTAL_LAND) || rows.map((row) => clean(row.TOTAL_LAND)).find(Boolean) || "";

  const searchVerified: Record<string, string> = {};
  if (evidence.ownerVerified && clean(evidence.owner)) searchVerified.OWNER_QUERY = clean(evidence.owner);
  if (evidence.dagVerified && clean(evidence.dagNumber)) searchVerified.DAG_NUMBER_QUERY = clean(evidence.dagNumber);

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
      LANDBD_RECONSTRUCTION: reconstruction,
    },
  };
}
