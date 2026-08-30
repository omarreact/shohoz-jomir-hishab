import type { KhatiyanOwner, KhatiyanQuickData } from "@/src/shared/types";
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

/** Internal scale for continuous land area (শতাংশ) while share math stays bigint. */
const AREA_SCALE = 1_000_000n;

function toShare(owner: Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">): KhatiyanShare {
  return {
    a: Number(owner.a),
    g: Number(owner.g),
    k: Number(owner.k),
    kr: Number(owner.kr),
    ti: Number(owner.ti),
  };
}

/**
 * Exact Til conversion for quick-calc owners.
 * Rejects non-canonical mixed-radix inputs (no float আনা / overflowing গন্ডা).
 */
export function ownerShareToTil(owner: Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">): number {
  return Number(shareToTilExact(toShare(owner)));
}

/** Sum owner shares as exact Til counts (bigint accumulation, number only at boundary). */
export function totalOwnerTil(
  owners: ReadonlyArray<Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">>,
): number {
  const total = owners.reduce((sum, owner) => sum + shareToTilExact(toShare(owner)), 0n);
  return Number(total);
}

/**
 * Quick খতিয়ান estimate: share is exact Til / 76_800;
 * land area is scaled-integer so (total × shareTil) / 76800 does not use float share ratios.
 */
export function calculateQuickKhatiyan(
  quickData: KhatiyanQuickData,
  toEn: (value: string | number) => number,
): KhatiyanQuickResult | null {
  const total = toEn(quickData.totalLand);
  if (!Number.isFinite(total) || total <= 0) return null;

  let shareTil: bigint;
  try {
    shareTil = shareToTilExact(toShare(quickData));
  } catch {
    return null;
  }
  if (shareTil <= 0n) return null;

  // Scaled land: floor division by full unit, then unscale for UI.
  const scaledTotal = BigInt(Math.round(total * Number(AREA_SCALE)));
  const scaledLand = (scaledTotal * shareTil) / TIL_PER_FULL_UNIT_BIGINT;
  const land = Number(scaledLand) / Number(AREA_SCALE);

  if (land <= 0) return null;

  return {
    land,
    sqft: land * 435.6,
    katha: land / 1.65,
  };
}
