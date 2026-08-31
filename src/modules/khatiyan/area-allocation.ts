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
  /** Exact scaled plot area numerator (area × 1,000,000). */
  exactAreaScaled: bigint;
  /** Exact fractional remainder numerator over the Til denominator. */
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

/** Convert an already-parsed JS number to a fixed 6-decimal integer without multiplying floats. */
function toScaledArea(area: number): bigint {
  if (!Number.isFinite(area) || area < 0) throw new Error("Area must be a finite non-negative number");

  const text = String(area);
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) throw new Error("Area must be a finite decimal number");

  const sign = match[1] === "-" ? -1n : 1n;
  const integerPart = match[2];
  const fractionPart = match[3] ?? "";
  const exponent = Number(match[4] ?? "0");
  const digits = `${integerPart}${fractionPart}`.replace(/^0+(?=\d)/, "");
  const decimalPosition = integerPart.length + exponent;

  let scaledDigits: string;
  if (decimalPosition <= 0) {
    scaledDigits = `0${"0".repeat(-decimalPosition)}${digits}`;
  } else if (decimalPosition >= digits.length) {
    scaledDigits = `${digits}${"0".repeat(decimalPosition - digits.length)}`;
  } else {
    scaledDigits = `${digits.slice(0, decimalPosition)}${digits.slice(decimalPosition)}`;
  }

  const normalized = scaledDigits.replace(/^0+(?=\d)/, "");
  const fractionalDigits = decimalPosition < 0
    ? "0".repeat(-decimalPosition) + digits
    : decimalPosition >= digits.length
      ? ""
      : digits.slice(decimalPosition);

  let integerScaled: bigint;
  if (fractionalDigits.length <= 6) {
    const integerPartScaled = normalized;
    const fractionScaled = fractionalDigits.padEnd(6, "0");
    integerScaled = BigInt(integerPartScaled) * INTERNAL_SCALE + BigInt(fractionScaled || "0");
  } else {
    const baseInteger = decimalPosition <= 0 ? 0n : BigInt(digits.slice(0, decimalPosition) || "0");
    const fraction = decimalPosition <= 0
      ? `${"0".repeat(-decimalPosition)}${digits}`
      : digits.slice(decimalPosition);
    const firstSix = fraction.slice(0, 6).padEnd(6, "0");
    const seventh = fraction[6] ?? "0";
    integerScaled = baseInteger * INTERNAL_SCALE + BigInt(firstSix || "0");
    if (seventh >= "5") integerScaled += 1n;
  }

  return sign * integerScaled;
}

function fromScaledArea(area: bigint): number {
  return Number(area) / INTERNAL_SCALE_NUMBER;
}

function exactAreaAsNumber(scaledTotal: bigint, shareTil: bigint): number {
  return fromScaledArea((scaledTotal * shareTil) / TIL_PER_FULL_UNIT_BIGINT);
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
      exactArea: exactAreaAsNumber(scaledTotal, row.shareTil),
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
