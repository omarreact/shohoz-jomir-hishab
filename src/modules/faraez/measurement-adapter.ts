import { rational, add, type Rational } from "./rational";
import type { FaraezMeasurementAdapterResult } from "./contracts";
import { TIL_PER_FULL_UNIT, tilToShare } from "@/src/modules/khatiyan/share-normalization";

/**
 * Convert one fraction to the nearest canonical Til count.
 *
 * A single fraction cannot guarantee estate-level conservation when its Til
 * count is fractional. Use faraezFractionsToKhatiyan for a set of heirs so the
 * Largest-Remainder method can distribute the remaining Tils collectively.
 */
export function faraezFractionToKhatiyan(fraction: Rational): FaraezMeasurementAdapterResult {
  const normalized = rational(fraction.numerator, fraction.denominator);
  validateFraction(normalized);

  const scaled = normalized.numerator * BigInt(TIL_PER_FULL_UNIT);
  const roundedTil = roundNearestInteger(scaled, normalized.denominator);
  return toResult(normalized, roundedTil);
}

/**
 * Convert all heir fractions together using Largest Remainder.
 *
 * When the input fractions sum exactly to 1, floors are assigned first and
 * the remaining Tils are awarded to the largest exact fractional remainders.
 * The resulting integer Til counts therefore sum exactly to one full unit.
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

  return exact
    .sort((a, b) => a.index - b.index)
    .map((item) => toResult(item.fraction, item.floorTil + (awarded.get(item.index) ?? 0n)));
}

function validateFraction(fraction: Rational): void {
  if (fraction.numerator < 0n) throw new RangeError("Inheritance fraction cannot be negative");
  if (fraction.numerator > fraction.denominator) throw new RangeError("Inheritance fraction cannot exceed 1/1");
}

function roundNearestInteger(numerator: bigint, denominator: bigint): bigint {
  const floor = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? floor + 1n : floor;
}

function toResult(fraction: Rational, til: bigint): FaraezMeasurementAdapterResult {
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
