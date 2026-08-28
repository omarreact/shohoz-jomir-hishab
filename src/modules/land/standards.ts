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
  source: string;
};

/**
 * Official baseline published by the Bangladesh Ministry of Land on its
 * "বাংলাদেশ ভূমি পরিমাপের আদর্শ এককসমূহ" page.
 *
 * The Ministry labels several traditional-unit relationships as approximate.
 * The calculator therefore uses the Ministry's common baseline for the
 * primary Bangladesh units and does not silently invent a local Kani/Gonda
 * conversion where the Ministry page contains conflicting traditional
 * formulas.
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
  source: "বাংলাদেশ ভূমি মন্ত্রণালয় — বাংলাদেশ ভূমি পরিমাপের আদর্শ এককসমূহ",
};

/**
 * Kept as an explicit compatibility profile for existing Dhaka/RAJUK callers.
 * Its conversion values intentionally match the Ministry baseline; it is not
 * presented as a separate government conversion table.
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
