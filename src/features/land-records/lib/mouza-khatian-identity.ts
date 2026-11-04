import type { KhatianDetails, KhatianIndex } from "../types";

/**
 * Never rely on a browser-supplied JL number alone to authorize showing
 * another mouza's record. A missing source JL ID needs a separate exact
 * lookup in the server-side selected mouza index.
 */
export function khatianMatchesMouza(
  record: Pick<KhatianDetails, "ID" | "JL_NUMBER_ID" | "KHATIAN_NO">,
  selectedJlId: number,
  matchingIndexRows: Pick<KhatianIndex, "ID" | "KHATIAN_NO">[] = [],
): boolean {
  if (!Number.isSafeInteger(selectedJlId) || selectedJlId <= 0) return false;
  if (record.JL_NUMBER_ID > 0) return record.JL_NUMBER_ID === selectedJlId;
  return matchingIndexRows.some(
    (row) => row.ID === record.ID && row.KHATIAN_NO.trim() === record.KHATIAN_NO.trim(),
  );
}
