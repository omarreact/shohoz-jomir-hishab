export type LandMeasurementStandard = {
  id: "bangladesh-standard" | "dhaka-rajuk";
  label: string;
  squareFeetPerKatha: number;
  kathasPerBigha: number;
  decimalsPerAcre: number;
  squareFeetPerDecimal: number;
};

/**
 * Baseline used by the calculator for the common Bangladesh/Dhaka convention.
 * Local deed/record conventions can differ, so the standard is explicit rather
 * than hidden inside conversion formulas.
 */
export const BANGLADESH_STANDARD: LandMeasurementStandard = {
  id: "bangladesh-standard",
  label: "বাংলাদেশের প্রচলিত মান",
  squareFeetPerKatha: 720,
  kathasPerBigha: 20,
  decimalsPerAcre: 100,
  squareFeetPerDecimal: 435.6,
};

/** Same numerical convention, explicitly labelled for Dhaka/RAJUK use. */
export const DHAKA_RAJUK_STANDARD: LandMeasurementStandard = {
  id: "dhaka-rajuk",
  label: "ঢাকা / RAJUK",
  squareFeetPerKatha: 720,
  kathasPerBigha: 20,
  decimalsPerAcre: 100,
  squareFeetPerDecimal: 435.6,
};

export const LAND_MEASUREMENT_STANDARDS = [
  BANGLADESH_STANDARD,
  DHAKA_RAJUK_STANDARD,
] as const;

export function getLandMeasurementStandard(id: LandMeasurementStandard["id"] = "bangladesh-standard") {
  return LAND_MEASUREMENT_STANDARDS.find((standard) => standard.id === id) ?? BANGLADESH_STANDARD;
}
