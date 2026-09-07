/**
 * Exact largest-remainder plot allocation.
 *
 * Owner shares and allocation arithmetic remain bigint-only. Numeric fields are
 * presentation adapters retained for the existing UI contract.
 */
import { shareToTilExact, TIL_PER_FULL_UNIT_BIGINT, type KhatiyanShare } from "./share-normalization";

const INTERNAL_SCALE = 1_000_000n;
const INTERNAL_SCALE_NUMBER = Number(INTERNAL_SCALE);

export type AreaAllocation = {
  index: number;
  /** Exact canonical ownership share in Tils. */
  shareTil: bigint;
  /** Exact scaled plot-area × share numerator. */
  exactAreaScaled: bigint;
  /** Exact largest-remainder numerator over the Til denominator. */
  remainderNumerator: bigint;
  /** Exact allocated area in scaled units. */
  allocatedAreaScaled: bigint;
  /** Presentation-only numeric adapter; never used for conservation. */
  exactArea: number;
  /** Presentation-only numeric adapter; never used for conservation. */
  allocatedArea: number;
  /** Presentation-only remainder fraction; never used for conservation. */
  remainder: number;
};

/** Convert a finite JS number's decimal representation to fixed 6-decimal units using bigint only. */
function toScaledArea(area: number): bigint {
  if (!Number.isFinite(area) || area < 0) throw new Error("Area must be a finite non-negative number");

  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(area));
  if (!match) throw new Error("Area must be a finite decimal number");

  const sign = match[1] === "-" ? -1n : 1n;
  const integerPart = match[2];
  const fractionPart = match[3] ?? "";
  const exponent = Number(match[4] ?? "0");
  const digits = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  const decimalPosition = integerPart.length + exponent;
  const scalePower = decimalPosition - digits.length + 6;
  const coefficient = BigInt(digits || "0");

  if (scalePower >= 0) return sign * coefficient * 10n ** BigInt(scalePower);

  const divisor = 10n ** BigInt(-scalePower);
  const quotient = coefficient / divisor;
  const remainder = coefficient % divisor;
  const rounded = remainder * 2n >= divisor ? quotient + 1n : quotient;
  return sign * rounded;
}

function fromScaledArea(area: bigint): number {
  return Number(area) / INTERNAL_SCALE_NUMBER;
}

function exactAreaAsNumber(scaledNumerator: bigint): number {
  return fromScaledArea(scaledNumerator / TIL_PER_FULL_UNIT_BIGINT);
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
    return { index, shareTil, numerator, base, remainderNumerator };
  });

  const assigned = rows.reduce((sum, row) => sum + row.base, 0n);
  let remaining = scaledTotal - assigned;

  [...rows]
    .sort((a, b) =>
      b.remainderNumerator > a.remainderNumerator
        ? 1
        : b.remainderNumerator < a.remainderNumerator
          ? -1
          : a.index - b.index,
    )
    .forEach((row) => {
      if (remaining > 0n) {
        row.base += 1n;
        remaining -= 1n;
      }
    });

  if (remaining !== 0n) {
    throw new Error("Exact Khatiyan area allocation failed to conserve the scaled plot area");
  }

  return rows
    .sort((a, b) => a.index - b.index)
    .map((row) => ({
      index: row.index,
      shareTil: row.shareTil,
      exactAreaScaled: row.numerator,
      remainderNumerator: row.remainderNumerator,
      allocatedAreaScaled: row.base,
      exactArea: exactAreaAsNumber(row.numerator),
      allocatedArea: fromScaledArea(row.base),
      remainder: Number(row.remainderNumerator) / Number(TIL_PER_FULL_UNIT_BIGINT),
    }));
}

/** Exact conservation check; epsilon is retained only for source compatibility and is ignored. */
export function allocationsConserved(totalArea: number, allocations: AreaAllocation[], _epsilon = 0): boolean {
  const roundedTotal = toScaledArea(totalArea);
  const allocated = allocations.reduce((sum, allocation) => sum + allocation.allocatedAreaScaled, 0n);
  return allocated === roundedTotal;
}
