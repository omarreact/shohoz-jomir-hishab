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

function splitVisibleItems(value: string): string[] {
  const visible = stripTrailingEllipsis(value);
  if (!visible) return [];
  return visible
    .split(",")
    .map((item) => clean(item))
    .filter((item) => item && item !== "..." && item !== "…");
}

interface MergedListValue {
  text: string;
  partial: boolean;
  truncatedInputs: number;
  distinctItems: number;
}

/**
 * Merge identity-like sets such as Dag numbers. Duplicate tokens are not useful
 * for these fields, so they are collapsed while fuller non-truncated variants
 * are allowed to complete a truncated compact response.
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

    for (const item of splitVisibleItems(value)) addItem(item);
  }

  for (const item of verifiedExactItems) addItem(item);

  const partial = truncatedInputs > 0 && completeInputs === 0;
  const joined = output.join(", ");

  return {
    text: partial && joined ? `${joined}, …` : joined,
    partial,
    truncatedInputs,
    distinctItems: output.length,
  };
}

/**
 * Owner and guardian lists are ordered record rows, not mathematical sets.
 * The same visible name may legitimately occur more than once (for example,
 * two ownership entries named "সিরাজদ্দিন"). When a complete public variant
 * exists, preserve its order and multiplicity exactly instead of Set-deduping
 * by name. If every variant is truncated, fall back to conservative merging
 * and keep the partial marker.
 */
function mergeOrderedRecordList(values: Array<string | undefined>): MergedListValue {
  const prepared = values
    .map((raw, index) => {
      const value = clean(raw);
      return {
        index,
        value,
        truncated: value ? isTruncated(value) : false,
        items: value ? splitVisibleItems(value) : [],
      };
    })
    .filter((entry) => entry.value && entry.items.length);

  const truncatedInputs = prepared.filter((entry) => entry.truncated).length;
  const complete = prepared.filter((entry) => !entry.truncated);

  if (!complete.length) return mergeListValues(values);

  const best = complete
    .slice()
    .sort((a, b) => {
      if (b.items.length !== a.items.length) return b.items.length - a.items.length;
      if (b.value.length !== a.value.length) return b.value.length - a.value.length;
      return a.index - b.index;
    })[0];

  const distinct = new Set(best.items.map((item) => normalizeToken(item)).filter(Boolean));
  return {
    text: best.items.join(", "),
    partial: false,
    truncatedInputs,
    distinctItems: distinct.size,
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
 * - truncation-aware merging that preserves complete owner/guardian row order.
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

  const owners = mergeOrderedRecordList([base.OWNERS, ...rows.map((row) => row.OWNERS)]);
  const dags = mergeListValues(
    [base.DAGS, ...rows.map((row) => row.DAGS)],
    verifiedDag ? [verifiedDag] : [],
  );
  const guardians = mergeOrderedRecordList([base.GUARDIANS, ...rows.map((row) => row.GUARDIANS)]);

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
