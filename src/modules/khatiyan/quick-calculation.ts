import type { KhatiyanOwner, KhatiyanQuickData } from "@/src/shared/types";
import { KHATIYAN_RECORD_STANDARD } from "./standards";
import {
  shareToTilExact,
  TIL_PER_FULL_UNIT_BIGINT,
  type KhatiyanShare,
} from "./share-normalization";

export interface KhatiyanQuickResult {
  land: number;
  sqft: number;
  katha: number;
}

/** Exact fixed-point scale for continuous land area at the calculation boundary. */
const AREA_SCALE = 1_000_000n;
/** Defensive upper bound; unrealistic or malicious exponents must not exhaust browser memory. */
const MAX_AREA_SCALED = 1_000_000_000n * AREA_SCALE;
const SQFT_PER_DECIMAL = BigInt(KHATIYAN_RECORD_STANDARD.squareFeetPerDecimal);
const SQFT_PER_KATHA = BigInt(KHATIYAN_RECORD_STANDARD.squareFeetPerKatha);
const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

function toShare(owner: Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">): KhatiyanShare {
  return {
    a: Number(owner.a),
    g: Number(owner.g),
    k: Number(owner.k),
    kr: Number(owner.kr),
    ti: Number(owner.ti),
  };
}

/** Exact Til conversion; Number is used only for the legacy UI return boundary. */
export function ownerShareToTil(owner: Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">): number {
  return Number(shareToTilExact(toShare(owner)));
}

/** Sum owner shares as exact Til counts (Number only at the legacy UI boundary). */
export function totalOwnerTil(
  owners: ReadonlyArray<Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">>,
): number {
  const total = owners.reduce((sum, owner) => sum + shareToTilExact(toShare(owner)), 0n);
  return Number(total);
}

function normalizeNumericText(value: string | number): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)));
}

function toScaledDecimal(value: string | number): bigint {
  const text = normalizeNumericText(value);
  if (text.length > 64) throw new RangeError("Land area input too long");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(text)) {
    throw new RangeError("Invalid land area");
  }

  const [coefficient, exponentText] = text.split("e");
  const exponent = exponentText ? Number.parseInt(exponentText, 10) : 0;
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 32) {
    throw new RangeError("Land area exponent out of bounds");
  }
  const [whole, fraction = ""] = coefficient.split(".");
  if (whole.length + fraction.length > 32) {
    throw new RangeError("Land area precision out of bounds");
  }
  const digits = BigInt(`${whole || "0"}${fraction}` || "0");
  const decimalPlaces = fraction.length - exponent;
  const shift = 6 - decimalPlaces;

  const scaled = shift >= 0
    ? digits * 10n ** BigInt(shift)
    : (() => {
        const divisor = 10n ** BigInt(-shift);
        const quotient = digits / divisor;
        const remainder = digits % divisor;
        return remainder * 2n >= divisor ? quotient + 1n : quotient;
      })();
  if (scaled > MAX_AREA_SCALED) {
    throw new RangeError("Land area exceeds supported range");
  }
  return scaled;
}

function fromScaled(value: bigint): number {
  return Number(value) / Number(AREA_SCALE);
}

/**
 * Quick খতিয়ান estimate. All area/share arithmetic is exact bigint fixed-point;
 * floating point is used only when returning presentation numbers to the legacy UI.
 */
export function calculateQuickKhatiyan(
  quickData: KhatiyanQuickData,
  _toEn: (value: string | number) => number,
): KhatiyanQuickResult | null {
  let totalScaled: bigint;
  try {
    totalScaled = toScaledDecimal(quickData.totalLand);
  } catch {
    return null;
  }
  if (totalScaled <= 0n) return null;

  let shareTil: bigint;
  try {
    shareTil = shareToTilExact(toShare(quickData));
  } catch {
    return null;
  }
  if (shareTil <= 0n) return null;

  const scaledLand = (totalScaled * shareTil) / TIL_PER_FULL_UNIT_BIGINT;
  if (scaledLand <= 0n) return null;

  const land = fromScaled(scaledLand);
  const sqft = fromScaled(scaledLand * SQFT_PER_DECIMAL);
  // Khatiyan-specific record conversion: decimal -> sq ft -> katha.
  const katha = Number(scaledLand * SQFT_PER_DECIMAL) / Number(AREA_SCALE * SQFT_PER_KATHA);

  return { land, sqft, katha };
}
