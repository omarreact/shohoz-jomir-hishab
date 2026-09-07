import { BANGLADESH_STANDARD } from "./standards";
import { KaniMeasurementProfile, getKaniProfile } from "./kani";

export type ConversionUnit = "sqft" | "sqm" | "decimal" | "katha" | "bigha" | "acre" | "kani" | "gonda" | "kora" | "kranti" | "til";

export type ConversionResult = {
  value: number;
  unit: ConversionUnit;
  profile?: KaniMeasurementProfile;
};

const SQFT_PER: Record<Exclude<ConversionUnit, "kani" | "gonda" | "kora" | "kranti" | "til">, number> = {
  sqft: 1,
  sqm: 10.763910416709722,
  decimal: BANGLADESH_STANDARD.squareFeetPerDecimal,
  katha: BANGLADESH_STANDARD.squareFeetPerKatha,
  bigha: BANGLADESH_STANDARD.squareFeetPerBigha,
  acre: BANGLADESH_STANDARD.squareFeetPerAcre,
};

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function toSquareFeet(value: number, unit: ConversionUnit, profile: KaniMeasurementProfile = "8-hat-nol"): number {
  if (!finiteNonNegative(value)) return NaN;
  if (unit in SQFT_PER) return value * SQFT_PER[unit as keyof typeof SQFT_PER];
  const kani = getKaniProfile(profile);
  const perKani = kani.squareFeetPerKani;
  const perGonda = perKani / kani.gondaPerKani;
  const perKora = perGonda / kani.koraPerGonda;
  const perKranti = perKora / kani.krantiPerKora;
  const perTil = perKranti / kani.tilPerKranti;
  return value * ({ kani: perKani, gonda: perGonda, kora: perKora, kranti: perKranti, til: perTil } as Record<string, number>)[unit];
}

export function fromSquareFeet(squareFeet: number, unit: ConversionUnit, profile: KaniMeasurementProfile = "8-hat-nol"): number {
  if (!finiteNonNegative(squareFeet)) return NaN;
  if (unit in SQFT_PER) return squareFeet / SQFT_PER[unit as keyof typeof SQFT_PER];
  const kani = getKaniProfile(profile);
  const perKani = kani.squareFeetPerKani;
  const perGonda = perKani / kani.gondaPerKani;
  const perKora = perGonda / kani.koraPerGonda;
  const perKranti = perKora / kani.krantiPerKora;
  const perTil = perKranti / kani.tilPerKranti;
  return squareFeet / ({ kani: perKani, gonda: perGonda, kora: perKora, kranti: perKranti, til: perTil } as Record<string, number>)[unit];
}

/** Returns true when a round-trip conversion stays within an absolute/relative tolerance. */
export function isRoundTripStable(value: number, from: ConversionUnit, to: ConversionUnit, profile: KaniMeasurementProfile = "8-hat-nol", tolerance = 1e-9): boolean {
  const sqft = toSquareFeet(value, from, profile);
  const roundTrip = fromSquareFeet(sqft, from, profile);
  return Number.isFinite(sqft) && Number.isFinite(roundTrip) && Math.abs(roundTrip - value) <= tolerance * Math.max(1, Math.abs(value));
}

/** Cross-check a Kani profile against its published square-foot value. */
export function validateKaniProfile(profile: KaniMeasurementProfile): { valid: boolean; errors: string[] } {
  const kani = getKaniProfile(profile);
  const errors: string[] = [];
  const hierarchy = kani.gondaPerKani * kani.koraPerGonda * kani.krantiPerKora * kani.tilPerKranti;
  if (hierarchy !== 4800) errors.push("Kani hierarchy must equal 20×4×3×20 = 4800 Til.");
  if (!finiteNonNegative(kani.squareFeetPerKani) || kani.squareFeetPerKani <= 0) errors.push("Kani square-foot value must be positive.");
  if (!finiteNonNegative(kani.squareMetersPerKani) || kani.squareMetersPerKani <= 0) errors.push("Kani square-meter value must be positive.");
  return { valid: errors.length === 0, errors };
}
