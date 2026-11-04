import type { DlrmsCitizenPrint } from "../dlrms-citizen";

export type CitizenExpectedKhatian = {
  khatianNo: string;
  jlNumberId?: number;
  surveyId?: number;
  mouzaName?: string;
  districtName?: string;
};

function numberKey(input: string): string {
  const normalized = input.normalize("NFKC")
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\s+/g, "").trim();
  return /^\d+$/.test(normalized) ? normalized.replace(/^0+(?=\d)/, "") : normalized;
}

function placeKey(input: string): string {
  return input.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("bn-BD");
}

/** Strictly avoid associating a citizen print with the wrong khatian. */
export function citizenPrintMatchesExpected(
  record: DlrmsCitizenPrint,
  expected: CitizenExpectedKhatian,
): boolean {
  const actual = record.khatian;
  if (!expected.khatianNo.trim() || !actual.khatianNo.trim() ||
      numberKey(actual.khatianNo) !== numberKey(expected.khatianNo)) return false;
  if (expected.surveyId && actual.surveyId && actual.surveyId !== expected.surveyId) return false;
  if (expected.jlNumberId && actual.jlNumberId && actual.jlNumberId !== expected.jlNumberId) return false;
  if (expected.mouzaName && actual.mouzaName &&
      placeKey(actual.mouzaName) !== placeKey(expected.mouzaName)) return false;
  if (expected.districtName && actual.districtName &&
      placeKey(actual.districtName) !== placeKey(expected.districtName)) return false;

  // Khatian numbers repeat across mouzas. Require independent source identity.
  if (expected.jlNumberId && actual.jlNumberId) return true;
  if (expected.mouzaName && actual.mouzaName &&
      expected.surveyId && actual.surveyId) return true;
  return false;
}
