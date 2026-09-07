import { rational, type Rational } from "./rational";
import { TIL_PER_FULL_UNIT_BIGINT, tilToShareExact } from "@/src/modules/khatiyan/share-normalization";
import { toBn } from "@/src/shared/utils";

/** Exact Rational → Khatiyan conversion. No floating-point arithmetic. */
export function fractionToKhatiyan(fraction: Rational) {
  const normalized = rational(fraction.numerator, fraction.denominator);
  if (normalized.numerator < 0n || normalized.numerator > normalized.denominator) {
    throw new RangeError("Inheritance fraction must be between 0/1 and 1/1");
  }

  const scaled = normalized.numerator * TIL_PER_FULL_UNIT_BIGINT;
  const floor = scaled / normalized.denominator;
  const remainder = scaled % normalized.denominator;
  const totalTil = remainder * 2n >= normalized.denominator ? floor + 1n : floor;
  return tilToShareExact(totalTil);
}

export function formatKhatiyanString(share: ReturnType<typeof fractionToKhatiyan>) {
  const parts = [];
  if (share.a > 0) parts.push(`${toBn(share.a)} আনা`);
  if (share.g > 0) parts.push(`${toBn(share.g)} গন্ডা`);
  if (share.k > 0) parts.push(`${toBn(share.k)} কড়া`);
  if (share.kr > 0) parts.push(`${toBn(share.kr)} ক্রান্তি`);
  if (share.ti > 0) parts.push(`${toBn(share.ti)} তিল`);
  return parts.length > 0 ? parts.join(", ") : "০";
}
