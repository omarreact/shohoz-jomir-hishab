import { rational, type Rational } from "./rational";
import type { FaraezMeasurementAdapterResult } from "./contracts";
import {
  TIL_PER_FULL_UNIT,
  tilToShare,
} from "@/src/modules/khatiyan/share-normalization";

/**
 * Convert an exact Faraez fraction into the canonical Khatiyan mixed-radix
 * representation. The conversion is intentionally exact: fractions that cannot
 * be represented by an integer Til count are rejected rather than rounded.
 */
export function faraezFractionToKhatiyan(fraction: Rational): FaraezMeasurementAdapterResult {
  const normalized = rational(fraction.numerator, fraction.denominator);
  if (normalized.numerator < 0n) throw new RangeError("Inheritance fraction cannot be negative");
  if (normalized.numerator > normalized.denominator) throw new RangeError("Inheritance fraction cannot exceed 1/1");

  const fullUnitTil = BigInt(TIL_PER_FULL_UNIT);
  const scaled = normalized.numerator * fullUnitTil;
  const til = scaled / normalized.denominator;
  const remainder = scaled % normalized.denominator;

  if (remainder !== 0n) {
    throw new RangeError(
      `Inheritance fraction ${normalized.numerator}/${normalized.denominator} is not exactly representable in the canonical Khatiyan Til grid`,
    );
  }

  const share = tilToShare(Number(til));
  return {
    fraction: normalized,
    ana: BigInt(share.a),
    gonda: BigInt(share.g),
    kora: BigInt(share.k),
    kranti: BigInt(share.kr),
    til: BigInt(share.ti),
  };
}
