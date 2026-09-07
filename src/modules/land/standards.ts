export type LandMeasurementStandard = {
  id: "bangladesh-standard" | "dhaka-rajuk";
  label: string;
  squareFeetPerKatha: number;
  kathasPerBigha: number;
  decimalsPerBigha: number;
  decimalsPerAcre: number;
  squareFeetPerDecimal: number;
  squareFeetPerBigha: number;
  squareFeetPerAcre: number;
  squareMetersPerAcre: number;
  // Traditional units are included from the Ministry's published table.
  // Kani has more than one published relationship on the same Ministry page,
  // so these are reference values and must not be silently substituted for
  // the primary acre/decimal/katha/bigha baseline.
  gondaPerKani?: number;
  koraPerGonda?: number;
  krantiPerKora?: number;
  tilPerKranti?: number;
  kaniSquareFeet8HatNol?: number;
  kaniSquareFeet40Shotok?: number;
  kaniDecimals40Shotok?: number;
  kaniSquareMeters8HatNol?: number;
  kaniSquareMeters40Shotok?: number;
  source: string;
};

/**
 * Official baseline published by the Bangladesh Ministry of Land on its
 * "বাংলাদেশ ভূমি পরিমাপের আদর্শ এককসমূহ" page.
 *
 * The Ministry page contains both the common Bangladesh units and multiple
 * traditional Kani/Gonda formulas. The common baseline is kept authoritative
 * for normal calculator conversions, while the traditional relationships are
 * preserved as explicit reference data so they are never silently mixed.
 */
export const BANGLADESH_STANDARD: LandMeasurementStandard = {
  id: "bangladesh-standard",
  label: "ভূমি মন্ত্রণালয়ের প্রকাশিত মান",
  squareFeetPerKatha: 720,
  kathasPerBigha: 20,
  decimalsPerBigha: 33,
  decimalsPerAcre: 100,
  squareFeetPerDecimal: 435.6,
  squareFeetPerBigha: 14400,
  squareFeetPerAcre: 43560,
  squareMetersPerAcre: 4047,
  gondaPerKani: 20,
  koraPerGonda: 4,
  krantiPerKora: 3,
  tilPerKranti: 20,
  kaniSquareFeet8HatNol: 17280,
  kaniSquareFeet40Shotok: 17424,
  kaniDecimals40Shotok: 40,
  kaniSquareMeters8HatNol: 1605,
  kaniSquareMeters40Shotok: 1619,
  source: "বাংলাদেশ ভূমি মন্ত্রণালয় — বাংলাদেশ ভূমি পরিমাপের আদর্শ এককসমূহ",
};

/**
 * Compatibility profile for existing Dhaka/RAJUK callers. Its conversion
 * values intentionally match the Ministry baseline; it is not presented as
 * a separate government conversion table.
 */
export const DHAKA_RAJUK_STANDARD: LandMeasurementStandard = {
  ...BANGLADESH_STANDARD,
  id: "dhaka-rajuk",
  label: "ঢাকা / RAJUK (ভূমি মন্ত্রণালয়ের মান)",
};

export const LAND_MEASUREMENT_STANDARDS = [
  BANGLADESH_STANDARD,
  DHAKA_RAJUK_STANDARD,
] as const;

export function getLandMeasurementStandard(
  id: LandMeasurementStandard["id"] = "bangladesh-standard",
) {
  return LAND_MEASUREMENT_STANDARDS.find((standard) => standard.id === id) ?? BANGLADESH_STANDARD;
}
