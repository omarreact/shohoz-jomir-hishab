export const TIL_PER_KRANTI = 20;
export const KRANTI_PER_KORA = 3;
export const KORA_PER_GONDA = 4;
export const GONDA_PER_ANA = 20;
export const ANA_PER_FULL_UNIT = 16;

export const TIL_PER_KORA = TIL_PER_KRANTI * KRANTI_PER_KORA;
export const TIL_PER_GONDA = TIL_PER_KORA * KORA_PER_GONDA;
export const TIL_PER_ANA = TIL_PER_GONDA * GONDA_PER_ANA;
export const TIL_PER_FULL_UNIT = TIL_PER_ANA * ANA_PER_FULL_UNIT;
export const TIL_PER_FULL_UNIT_BIGINT = BigInt(TIL_PER_FULL_UNIT);

export type KhatiyanShare = {
  a: number;
  g: number;
  k: number;
  kr: number;
  ti: number;
};

const EPSILON = 1e-12;

function validateShare(share: KhatiyanShare): void {
  const values = [share.a, share.g, share.k, share.kr, share.ti];
  if (values.some((value) => !Number.isFinite(value) || !Number.isInteger(value) || value < 0)) {
    throw new Error("Khatiyan share units must be finite non-negative integers");
  }
  if (share.a > ANA_PER_FULL_UNIT) throw new Error("আনা exceeds the full 16-আনা unit");
  if (share.g >= GONDA_PER_ANA) throw new Error("গন্ডা must be below 20 per আনা");
  if (share.k >= KORA_PER_GONDA) throw new Error("কড়া must be below 4 per গন্ডা");
  if (share.kr >= KRANTI_PER_KORA) throw new Error("ক্রান্তি must be below 3 per কড়া");
  if (share.ti >= TIL_PER_KRANTI) throw new Error("তিল must be below 20 per ক্রান্তি");
}

/** Exact canonical Til conversion. This is the authoritative Khatiyan share representation. */
export function shareToTilExact(share: KhatiyanShare): bigint {
  validateShare(share);
  return BigInt(share.a) * BigInt(TIL_PER_ANA)
    + BigInt(share.g) * BigInt(TIL_PER_GONDA)
    + BigInt(share.k) * BigInt(TIL_PER_KORA)
    + BigInt(share.kr) * BigInt(TIL_PER_KRANTI)
    + BigInt(share.ti);
}

/** Convert an exact Til count to a canonical mixed-radix representation. */
export function tilToShareExact(til: bigint): KhatiyanShare {
  if (typeof til !== "bigint" || til < 0n || til > TIL_PER_FULL_UNIT_BIGINT) {
    throw new Error("Til count must be an integer between 0 and one full 16-আনা unit");
  }
  let remainder = til;
  const a = remainder / BigInt(TIL_PER_ANA);
  remainder %= BigInt(TIL_PER_ANA);
  const g = remainder / BigInt(TIL_PER_GONDA);
  remainder %= BigInt(TIL_PER_GONDA);
  const k = remainder / BigInt(TIL_PER_KORA);
  remainder %= BigInt(TIL_PER_KORA);
  const kr = remainder / BigInt(TIL_PER_KRANTI);
  const ti = remainder % BigInt(TIL_PER_KRANTI);
  return { a: Number(a), g: Number(g), k: Number(k), kr: Number(kr), ti: Number(ti) };
}

/** Legacy numeric adapter retained for existing UI boundaries. Domain allocation should use shareToTilExact(). */
export function shareToTil(share: KhatiyanShare): number {
  return Number(shareToTilExact(share));
}

export function shareToTilUnchecked(share: KhatiyanShare): number {
  return share.a * TIL_PER_ANA + share.g * TIL_PER_GONDA + share.k * TIL_PER_KORA + share.kr * TIL_PER_KRANTI + share.ti;
}

export function tilToShare(til: number): KhatiyanShare {
  if (!Number.isFinite(til) || !Number.isInteger(til) || til < 0 || til > TIL_PER_FULL_UNIT) {
    throw new Error("Til count must be an integer between 0 and one full 16-আনা unit");
  }
  return tilToShareExact(BigInt(til));
}

export function normalizeShare(share: KhatiyanShare): KhatiyanShare {
  return tilToShareExact(shareToTilExact(share));
}

export function shareFraction(share: KhatiyanShare): number {
  return Number(shareToTilExact(share)) / TIL_PER_FULL_UNIT;
}

/** Exact conservation predicate: ownership shares must equal one complete 16-আনা estate (76,800 Tils). */
export function sharesConserved(shares: KhatiyanShare[], _epsilon = EPSILON): boolean {
  const totalTil = shares.reduce((sum, share) => sum + shareToTilExact(share), 0n);
  return totalTil === TIL_PER_FULL_UNIT_BIGINT;
}
