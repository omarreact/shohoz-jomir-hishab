import { shareToTilExact, TIL_PER_FULL_UNIT_BIGINT, type KhatiyanShare } from "./share-normalization";

const INTERNAL_SCALE = 1_000_000;

export type AreaAllocation = {
  index: number;
  shareTil: number;
  exactArea: number;
  allocatedArea: number;
  remainder: number;
};

function toScaledArea(area: number): bigint {
  if (!Number.isFinite(area) || area < 0) throw new Error("Area must be a finite non-negative number");
  return BigInt(Math.round(area * INTERNAL_SCALE));
}

function fromScaledArea(area: bigint): number {
  return Number(area) / INTERNAL_SCALE;
}

export function allocatePlotArea(totalArea: number, shares: KhatiyanShare[]): AreaAllocation[] {
  const totalTil = shares.reduce((sum, share) => sum + shareToTilExact(share), 0n);
  if (totalTil !== TIL_PER_FULL_UNIT_BIGINT) {
    throw new Error("Plot allocation requires owner shares to total exactly 16 আনা");
  }

  const scaledTotal = toScaledArea(totalArea);
  const rows = shares.map((share, index) => {
    const shareTil = shareToTilExact(share);
    const numerator = scaledTotal * shareTil;
    const base = numerator / TIL_PER_FULL_UNIT_BIGINT;
    const remainderNumerator = numerator % TIL_PER_FULL_UNIT_BIGINT;
    return { index, shareTil, base, remainderNumerator };
  });

  const assigned = rows.reduce((sum, row) => sum + row.base, 0n);
  let remaining = scaledTotal - assigned;

  [...rows]
    .sort((a, b) => b.remainderNumerator > a.remainderNumerator ? 1 : b.remainderNumerator < a.remainderNumerator ? -1 : a.index - b.index)
    .forEach((row) => {
      if (remaining > 0n) {
        row.base += 1n;
        remaining -= 1n;
      }
    });

  return rows
    .sort((a, b) => a.index - b.index)
    .map((row) => ({
      index: row.index,
      shareTil: Number(row.shareTil),
      exactArea: totalArea * Number(row.shareTil) / Number(TIL_PER_FULL_UNIT_BIGINT),
      allocatedArea: fromScaledArea(row.base),
      remainder: Number(row.remainderNumerator) / Number(TIL_PER_FULL_UNIT_BIGINT),
    }));
}

export function allocationsConserved(totalArea: number, allocations: AreaAllocation[], epsilon = 1 / INTERNAL_SCALE): boolean {
  const roundedTotal = fromScaledArea(toScaledArea(totalArea));
  const allocated = allocations.reduce((sum, allocation) => sum + allocation.allocatedArea, 0);
  return Math.abs(allocated - roundedTotal) <= epsilon;
}
