import { BANGLADESH_STANDARD } from "./standards";

/**
 * The Ministry of Land publishes two different Kani measurement relationships
 * on the same standards page. They are preserved as explicit profiles rather
 * than being silently combined with the primary Decimal/Katha/Bigha standard.
 *
 * Source: Bangladesh Ministry of Land — "বাংলাদেশ ভূমি পরিমাপের আদর্শ এককসমূহ".
 */
export type KaniMeasurementProfile = "8-hat-nol" | "40-shotok";

export type KaniProfile = {
  id: KaniMeasurementProfile;
  label: string;
  squareFeetPerKani: number;
  squareMetersPerKani: number;
  decimalsPerKani?: number;
  gondaPerKani: number;
  koraPerGonda: number;
  krantiPerKora: number;
  tilPerKranti: number;
  source: string;
};

export const KANI_PROFILES: Record<KaniMeasurementProfile, KaniProfile> = {
  "8-hat-nol": {
    id: "8-hat-nol",
    label: "৮ হাত নল — মন্ত্রণালয়ের প্রকাশিত Kani মান",
    squareFeetPerKani: BANGLADESH_STANDARD.kaniSquareFeet8HatNol!,
    squareMetersPerKani: BANGLADESH_STANDARD.kaniSquareMeters8HatNol!,
    gondaPerKani: 20,
    koraPerGonda: 4,
    krantiPerKora: 3,
    tilPerKranti: 20,
    source: BANGLADESH_STANDARD.source,
  },
  "40-shotok": {
    id: "40-shotok",
    label: "৪০ শতক — মন্ত্রণালয়ের প্রকাশিত Kani মান",
    squareFeetPerKani: BANGLADESH_STANDARD.kaniSquareFeet40Shotok!,
    squareMetersPerKani: BANGLADESH_STANDARD.kaniSquareMeters40Shotok!,
    decimalsPerKani: BANGLADESH_STANDARD.kaniDecimals40Shotok,
    gondaPerKani: 20,
    koraPerGonda: 4,
    krantiPerKora: 3,
    tilPerKranti: 20,
    source: BANGLADESH_STANDARD.source,
  },
};

export function getKaniProfile(profile: KaniMeasurementProfile = "8-hat-nol") {
  return KANI_PROFILES[profile];
}

export function squareFeetFromKani(kani: number, profile: KaniMeasurementProfile = "8-hat-nol") {
  return Number.isFinite(kani) ? kani * getKaniProfile(profile).squareFeetPerKani : NaN;
}

export function kaniFromSquareFeet(squareFeet: number, profile: KaniMeasurementProfile = "8-hat-nol") {
  const value = getKaniProfile(profile).squareFeetPerKani;
  return Number.isFinite(squareFeet) ? squareFeet / value : NaN;
}

export function squareFeetFromGonda(gonda: number, profile: KaniMeasurementProfile = "8-hat-nol") {
  const standard = getKaniProfile(profile);
  return Number.isFinite(gonda)
    ? gonda * (standard.squareFeetPerKani / standard.gondaPerKani)
    : NaN;
}

export function squareFeetFromKora(kora: number, profile: KaniMeasurementProfile = "8-hat-nol") {
  const standard = getKaniProfile(profile);
  return Number.isFinite(kora)
    ? kora * (standard.squareFeetPerKani / (standard.gondaPerKani * standard.koraPerGonda))
    : NaN;
}

export function squareFeetFromKranti(kranti: number, profile: KaniMeasurementProfile = "8-hat-nol") {
  const standard = getKaniProfile(profile);
  return Number.isFinite(kranti)
    ? kranti * (standard.squareFeetPerKani / (standard.gondaPerKani * standard.koraPerGonda * standard.krantiPerKora))
    : NaN;
}

export function squareFeetFromTil(til: number, profile: KaniMeasurementProfile = "8-hat-nol") {
  const standard = getKaniProfile(profile);
  return Number.isFinite(til)
    ? til * (standard.squareFeetPerKani / (standard.gondaPerKani * standard.koraPerGonda * standard.krantiPerKora * standard.tilPerKranti))
    : NaN;
}
