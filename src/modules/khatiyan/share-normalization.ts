export const TIL_PER_KRANTI = 20;
export const KRANTI_PER_KORA = 3;
export const KORA_PER_GONDA = 4;
export const GONDA_PER_ANA = 20;
export const ANA_PER_FULL_UNIT = 16;

export const TIL_PER_KORA = TIL_PER_KRANTI * KRANTI_PER_KORA;
export const TIL_PER_GONDA = TIL_PER_KORA * KORA_PER_GONDA;
export const TIL_PER_ANA = TIL_PER_GONDA * GONDA_PER_ANA;
export const TIL_PER_FULL_UNIT = TIL_PER_ANA * ANA_PER_FULL_UNIT;

export type KhatiyanShare = {
  a: number;
  g: number;
  k: number;
  kr: number;
  ti: number;
};

const EPSILON = 1e-12;

/**
 * Convert a share to til after enforcing the canonical Khatiyan mixed-radix
 * constraints. This remains the validated domain entry point.
 */
export function shareToTil(share: KhatiyanShare): number {
  const values = [share.a, share.g, share.k, share.kr, share.ti];
  if (values.some((value) => !Number.isFinite(value) || !Number.isInteger(value) || value < 0)) {
    throw new Error("Khatiyan share units must be finite non-negative integers");
  }
  if (share.a > ANA_PER_FULL_UNIT) throw new Error("আনা exceeds the full 16-আনা unit");
  if (share.g >= GONDA_PER_ANA) throw new Error("গন্ডা must be below 20 per আনা");
  if (share.k >= KORA_PER_GONDA) throw new Error("কড়া must be below 4 per গন্ডা");
  if (share.kr >= KRANTI_PER_KORA) throw new Error("ক্রান্তি must be below 3 per কড়া");
  if (share.ti >= TIL_PER_KRANTI) throw new Error("তিল must be below 20 per ক্রান্তি");
  return shareToTilUnchecked(share);
}

/**
 * Compatibility adapter for legacy UI calculations.
 *
 * The original quick Khatiyan calculation treated the five numeric inputs as
 * a direct weighted expression and did not validate mixed-radix ranges.
 * Keep that behavior isolated here rather than weakening the validated
 * shareToTil() domain function.
 */
export function shareToTilUnchecked(share: KhatiyanShare): number {
  return share.a * TIL_PER_ANA + share.g * TIL_PER_GONDA + share.k * TIL_PER_KORA + share.kr * TIL_PER_KRANTI + share.ti;
}

/** Convert a whole-number til count into the canonical mixed-radix representation. */
export function tilToShare(til: number): KhatiyanShare {
  if (!Number.isFinite(til) || !Number.isInteger(til) || til < 0 || til > TIL_PER_FULL_UNIT) {
    throw new Error("Til count must be an integer between 0 and one full 16-আনা unit");
  }

  let remainder = til;
  const a = Math.floor(remainder / TIL_PER_ANA);
  remainder %= TIL_PER_ANA;
  const g = Math.floor(remainder / TIL_PER_GONDA);
  remainder %= TIL_PER_GONDA;
  const k = Math.floor(remainder / TIL_PER_KORA);
  remainder %= TIL_PER_KORA;
  const kr = Math.floor(remainder / TIL_PER_KRANTI);
  const ti = remainder % TIL_PER_KRANTI;

  return { a, g, k, kr, ti };
}

export function normalizeShare(share: KhatiyanShare): KhatiyanShare {
  return tilToShare(shareToTil(share));
}

export function shareFraction(share: KhatiyanShare): number {
  return shareToTil(share) / TIL_PER_FULL_UNIT;
}

export function sharesConserved(shares: KhatiyanShare[], epsilon = EPSILON): boolean {
  const totalTil = shares.reduce((sum, share) => sum + shareToTil(share), 0);
  return totalTil <= TIL_PER_FULL_UNIT && Math.abs(totalTil - Math.round(totalTil)) <= epsilon;
}
