import { shareToTil, TIL_PER_FULL_UNIT, type KhatiyanShare } from "./share-normalization";

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

/**
 * Allocate one recorded plot among owners using exact Til share integers.
 * Allocation is rounded only at the final display scale, with the largest-
 * remainder rule ensuring that the rounded owner allocations conserve the
 * rounded recorded area exactly.
 */
export function allocatePlotArea(totalArea: number, shares: KhatiyanShare[]): AreaAllocation[] {
  const totalTil = shares.reduce((sum, share) => sum + shareToTil(share), 0);
  if (totalTil !== TIL_PER_FULL_UNIT) {
    throw new Error("Plot allocation requires owner shares to total exactly 16 আনা");
  }

  const scaledTotal = toScaledArea(totalArea);
  const rows = shares.map((share, index) => {
    const shareTil = shareToTil(share);
    const numerator = scaledTotal * BigInt(shareTil);
    const base = numerator / BigInt(TIL_PER_FULL_UNIT);
    const remainder = Number(numerator % BigInt(TIL_PER_FULL_UNIT)) / TIL_PER_FULL_UNIT;
    return { index, shareTil, base, remainder };
  });

  const assigned = rows.reduce((sum, row) => sum + row.base, 0n);
  let remaining = scaledTotal - assigned;

  [...rows]
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
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
      shareTil: row.shareTil,
      exactArea: totalArea * row.shareTil / TIL_PER_FULL_UNIT,
      allocatedArea: fromScaledArea(row.base),
      remainder: row.remainder,
    }));
}

export function allocationsConserved(totalArea: number, allocations: AreaAllocation[], epsilon = 1 / INTERNAL_SCALE): boolean {
  const roundedTotal = fromScaledArea(toScaledArea(totalArea));
  const allocated = allocations.reduce((sum, allocation) => sum + allocation.allocatedArea, 0);
  return Math.abs(allocated - roundedTotal) <= epsilon;
}
