import type { KhatianDetails, KhatianIndex } from "../types";

export interface KhatianSearchEvidence {
  owner?: string;
  dagNumber?: string;
  ownerVerified?: boolean;
  dagVerified?: boolean;
}

const TRAILING_ELLIPSIS = /(?:,\s*)?(?:\.{3,}|…)+\s*$/u;

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeToken(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
}

function isTruncated(value: string): boolean {
  return TRAILING_ELLIPSIS.test(clean(value));
}

function stripTrailingEllipsis(value: string): string {
  return clean(value).replace(TRAILING_ELLIPSIS, "").replace(/,\s*$/u, "").trim();
}

interface MergedListValue {
  text: string;
  partial: boolean;
  truncatedInputs: number;
  distinctItems: number;
}

/**
 * Merge comma-separated public DLRMS fields item-by-item rather than treating
 * an entire compact string as one opaque value. This lets a fuller public
 * variant such as "A, B, C" replace/complete "A,..." without leaking the
 * upstream ellipsis into otherwise complete output.
 */
function mergeListValues(values: Array<string | undefined>, verifiedExactItems: string[] = []): MergedListValue {
  const seen = new Set<string>();
  const output: string[] = [];
  let truncatedInputs = 0;
  let completeInputs = 0;

  const addItem = (raw: string) => {
    const item = clean(raw);
    if (!item) return;
    const normalized = normalizeToken(item);
    if (!normalized || normalized === "..." || normalized === "…" || seen.has(normalized)) return;
    seen.add(normalized);
    output.push(item);
  };

  for (const raw of values) {
    const value = clean(raw);
    if (!value) continue;

    const truncated = isTruncated(value);
    if (truncated) truncatedInputs += 1;
    else completeInputs += 1;

    const visible = stripTrailingEllipsis(value);
    for (const item of visible.split(",")) addItem(item);
  }

  for (const item of verifiedExactItems) addItem(item);

  // A non-truncated public variant for the same khatian is the best public
  // evidence currently available. If every upstream variant is truncated,
  // keep an explicit ellipsis so LandBD never presents a partial list as full.
  const partial = truncatedInputs > 0 && completeInputs === 0;
  const joined = output.join(", ");

  return {
    text: partial && joined ? `${joined}, …` : joined,
    partial,
    truncatedInputs,
    distinctItems: output.length,
  };
}

function sameKhatian(base: KhatianDetails, row: KhatianIndex): boolean {
  if (row.ID === base.ID) return true;
  if (clean(row.KHATIAN_NO) !== clean(base.KHATIAN_NO)) return false;

  // Candidate searches are scoped by JL_NUMBER_ID. Keep that boundary explicit
  // as a second identity check when both records expose it.
  if (base.JL_NUMBER_ID && row.JL_NUMBER_ID && base.JL_NUMBER_ID !== row.JL_NUMBER_ID) return false;
  return true;
}

/**
 * DLRMS can match owners/dags that are not echoed in the compact khatian row.
 * Reconstruct the fullest public record LandBD can truthfully show by combining:
 * - the official public detail endpoint,
 * - an exact khatian-number lookup,
 * - rows returned by the active owner/dag searches,
 * - verified exact dag evidence when DLRMS confirms the same khatian,
 * - truncation-aware item merging that prefers fuller official public variants.
 *
 * Owner search text is kept as search evidence because users can enter a
 * partial name. It is never promoted into the owner list. An exact dag-number
 * query can safely be merged after DLRMS confirms that the same khatian matched.
 */
export function reconstructKhatian(
  base: KhatianDetails,
  candidateRows: KhatianIndex[],
  evidence: KhatianSearchEvidence = {},
): KhatianDetails {
  const rows = candidateRows.filter((row) => sameKhatian(base, row));
  const verifiedOwner = evidence.ownerVerified ? clean(evidence.owner) : "";
  const verifiedDag = evidence.dagVerified ? clean(evidence.dagNumber) : "";

  const owners = mergeListValues([base.OWNERS, ...rows.map((row) => row.OWNERS)]);
  const dags = mergeListValues(
    [base.DAGS, ...rows.map((row) => row.DAGS)],
    verifiedDag ? [verifiedDag] : [],
  );
  const guardians = mergeListValues([base.GUARDIANS, ...rows.map((row) => row.GUARDIANS)]);

  const totalLandCandidates = [base.TOTAL_LAND, ...rows.map((row) => row.TOTAL_LAND)]
    .map((item) => clean(item))
    .filter(Boolean);
  const totalLand = totalLandCandidates[0] ?? "";
  const distinctTotalLand = [...new Set(totalLandCandidates)];

  const searchVerified: Record<string, string> = {};
  if (verifiedOwner) searchVerified.OWNER_QUERY = verifiedOwner;
  if (verifiedDag) searchVerified.DAG_NUMBER_QUERY = verifiedDag;

  const reconstruction = {
    METHOD: "official detail + exact khatian lookup + verified search-hit merge + truncation-aware field reconstruction",
    MATCHED_ROWS: rows.length,
    SEARCH_VERIFIED: searchVerified,
    MERGED_OWNERS: owners.text,
    MERGED_DAGS: dags.text,
    MERGED_GUARDIANS: guardians.text,
    MERGED_TOTAL_LAND: totalLand,
    UPSTREAM_TRUNCATION_REMAINS: owners.partial || dags.partial || guardians.partial,
    FIELD_QUALITY: {
      OWNERS: {
        PARTIAL: owners.partial,
        TRUNCATED_INPUTS: owners.truncatedInputs,
        DISTINCT_ITEMS: owners.distinctItems,
      },
      DAGS: {
        PARTIAL: dags.partial,
        TRUNCATED_INPUTS: dags.truncatedInputs,
        DISTINCT_ITEMS: dags.distinctItems,
      },
      GUARDIANS: {
        PARTIAL: guardians.partial,
        TRUNCATED_INPUTS: guardians.truncatedInputs,
        DISTINCT_ITEMS: guardians.distinctItems,
      },
      TOTAL_LAND: {
        CONFLICT: distinctTotalLand.length > 1,
        VARIANTS: distinctTotalLand,
      },
    },
    RETURNED_VARIANTS: rows.map((row) => ({
      ID: row.ID,
      KHATIAN_NO: row.KHATIAN_NO,
      JL_NUMBER_ID: row.JL_NUMBER_ID,
      OWNERS: row.OWNERS,
      DAGS: row.DAGS,
      GUARDIANS: row.GUARDIANS,
      TOTAL_LAND: row.TOTAL_LAND ?? "",
    })),
  };

  return {
    ...base,
    OWNERS: owners.text,
    DAGS: dags.text,
    GUARDIANS: guardians.text,
    TOTAL_LAND: totalLand,
    PUBLIC_RECORD: {
      ...(base.PUBLIC_RECORD ?? {}),
      ...(verifiedOwner ? { "সার্চে_মিল_পাওয়া_মালিক_নাম_বা_অংশ": verifiedOwner } : {}),
      ...(verifiedDag ? { "সার্চে_মিল_পাওয়া_দাগ": verifiedDag } : {}),
      LANDBD_RECONSTRUCTION: reconstruction,
    },
  };
}
