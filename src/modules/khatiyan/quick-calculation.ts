import { FULL_UNIT_TIL } from "@/src/shared/constants";
import type { KhatiyanOwner, KhatiyanQuickData } from "@/src/shared/types";
import { shareToTil } from "./share-normalization";

export interface KhatiyanQuickResult {
  land: number;
  sqft: number;
  katha: number;
}

/** Adapt the shared Khatiyan owner type to the canonical mixed-radix converter. */
export function ownerShareToTil(owner: Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">): number {
  return shareToTil({
    a: Number(owner.a),
    g: Number(owner.g),
    k: Number(owner.k),
    kr: Number(owner.kr),
    ti: Number(owner.ti),
  });
}

/** Sum owner shares using the canonical Khatiyan til representation. */
export function totalOwnerTil(owners: ReadonlyArray<Pick<KhatiyanOwner, "a" | "g" | "k" | "kr" | "ti">>): number {
  return owners.reduce((sum, owner) => sum + ownerShareToTil(owner), 0);
}

/** Existing quick-calculation formula extracted from the page as a pure function. */
export function calculateQuickKhatiyan(
  quickData: KhatiyanQuickData,
  toEn: (value: string | number) => number,
): KhatiyanQuickResult | null {
  const total = toEn(quickData.totalLand);
  const shareTil = ownerShareToTil(quickData);
  const share = shareTil / FULL_UNIT_TIL;

  if (total > 0 && share > 0) {
    return {
      land: total * share,
      sqft: total * share * 435.6,
      katha: total * share / 1.65,
    };
  }

  return null;
}
