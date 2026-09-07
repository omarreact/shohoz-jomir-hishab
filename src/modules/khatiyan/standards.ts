import type { LandMeasurementStandard } from "@/src/modules/land/standards";

/**
 * Khatiyan-record reference values published by the Bangladesh Ministry of Land
 * on its "খতিয়ান কি?" page. These values are intentionally separate from the
 * general land-measurement calculator because the Ministry publishes a
 * different Khatiyan reference table.
 *
 * Do not derive one value from another here: the source itself contains
 * rounded/traditional relationships (for example 1 Gonda = 864 sq ft and
 * 1 Katha = 715 sq ft). The displayed record standard therefore preserves
 * source values independently rather than manufacturing a false equivalence.
 */
export const KHATIYAN_RECORD_STANDARD = {
  id: "khatiyan-record",
  label: "খতিয়ান রেকর্ডের জন্য ভূমি মন্ত্রণালয়ের প্রকাশিত মান",
  squareFeetPerKatha: 715,
  squareFeetPerDecimal: 432,
  squareFeetPerGonda: 864,
  kathaPerGonda: 1.2,
  decimalPerGonda: 2,
  gondaPerAna: 20,
  anaPerFullUnit: 16,
  source: "বাংলাদেশ ভূমি মন্ত্রণালয় — খতিয়ান কি? (হাল-নাগাদ ১ মে ২০২৫)",
} as const;

export type KhatiyanRecordStandard = typeof KHATIYAN_RECORD_STANDARD;

export function khatiyanShareToRecordSquareFeet(shareFraction: number, standard = KHATIYAN_RECORD_STANDARD) {
  if (!Number.isFinite(shareFraction) || shareFraction < 0) {
    throw new Error("Share fraction must be a finite non-negative number");
  }
  return shareFraction * standard.squareFeetPerGonda * standard.gondaPerAna * standard.anaPerFullUnit;
}
