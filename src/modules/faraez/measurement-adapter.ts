import { rational, add, type Rational } from "./rational";
import type { FaraezMeasurementAdapterResult } from "./contracts";
import { TIL_PER_FULL_UNIT, tilToShare } from "@/src/modules/khatiyan/share-normalization";

/**
 * Convert one inheritance fraction to the nearest canonical Til count.
 *
 * The canonical 16-Ana estate contains exactly 76,800 Tils. Therefore common
 * fractions such as 1/3, 1/6 and 2/3 are exactly representable in the
 * mixed-radix Ana/Gonda/Kora/Kranti/Til system. A fraction that is not an
 * integer number of Tils is rounded to the nearest Til; it is never rejected
 * merely because its decimal representation is non-terminating.
 *
 * IMPORTANT: for a complete estate containing multiple heirs, use
 * faraezFractionsToKhatiyan(). It applies Largest Remainder collectively so
 * the rounded heir allocations sum to exactly the full estate.
 */
export function faraezFractionToKhatiyan(fraction: Rational): FaraezMeasurementAdapterResult {
  const normalized = rational(fraction.numerator, fraction.denominator);
  validateFraction(normalized);

  const scaled = normalized.numerator * BigInt(TIL_PER_FULL_UNIT);
  const roundedTil = roundNearestTil(scaled, normalized.denominator);
  return toResult(normalized, roundedTil);
}

/**
 * Convert all heir fractions together using exact Largest Remainder allocation.
 *
 * The fractions must sum exactly to 1/1. Each exact Til amount is first floored;
 * the remaining Tils are then awarded to the largest exact fractional
 * remainders. Integer comparison is done by cross multiplication, so no
 * floating-point arithmetic is used for ranking or allocation.
 */
export function faraezFractionsToKhatiyan(
  fractions: readonly Rational[],
): readonly FaraezMeasurementAdapterResult[] {
  if (fractions.length === 0) return [];

  const normalized = fractions.map((fraction) => rational(fraction.numerator, fraction.denominator));
  normalized.forEach(validateFraction);

  const total = normalized.reduce((sum, fraction) => add(sum, fraction), rational(0n));
  if (total.numerator !== total.denominator) {
    throw new RangeError("Faraez fractions must sum exactly to 1/1 for collective measurement allocation");
  }

  const fullUnitTil = BigInt(TIL_PER_FULL_UNIT);
  const exact = normalized.map((fraction, index) => {
    const scaled = fraction.numerator * fullUnitTil;
    return {
      fraction,
      index,
      floorTil: scaled / fraction.denominator,
      remainderNumerator: scaled % fraction.denominator,
      denominator: fraction.denominator,
    };
  });

  const floorTotal = exact.reduce((sum, item) => sum + item.floorTil, 0n);
  let remaining = fullUnitTil - floorTotal;
  if (remaining < 0n || remaining > BigInt(exact.length)) {
    throw new RangeError("Largest-Remainder allocation produced an invalid Til remainder");
  }

  const ranked = [...exact].sort((a, b) => {
    const left = a.remainderNumerator * b.denominator;
    const right = b.remainderNumerator * a.denominator;
    if (left === right) return a.index - b.index;
    return left > right ? -1 : 1;
  });

  const awarded = new Map<number, bigint>();
  for (const item of ranked) {
    const extra = remaining > 0n ? 1n : 0n;
    awarded.set(item.index, extra);
    remaining -= extra;
  }

  if (remaining !== 0n) {
    throw new RangeError("Largest-Remainder allocation failed to conserve the full Til estate");
  }

  return exact
    .sort((a, b) => a.index - b.index)
    .map((item) => toResult(item.fraction, item.floorTil + (awarded.get(item.index) ?? 0n)));
}

function validateFraction(fraction: Rational): void {
  if (fraction.numerator < 0n) throw new RangeError("Inheritance fraction cannot be negative");
  if (fraction.numerator > fraction.denominator) throw new RangeError("Inheritance fraction cannot exceed 1/1");
}

function roundNearestTil(numerator: bigint, denominator: bigint): bigint {
  const floor = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? floor + 1n : floor;
}

function toResult(fraction: Rational, til: bigint): FaraezMeasurementAdapterResult {
  // TIL_PER_FULL_UNIT is 76,800, so this conversion is safely within Number's
  // exact-integer range. All inheritance arithmetic remains bigint/rational.
  const share = tilToShare(Number(til));
  return {
    fraction,
    ana: BigInt(share.a),
    gonda: BigInt(share.g),
    kora: BigInt(share.k),
    kranti: BigInt(share.kr),
    til: BigInt(share.ti),
  };
}
