import type { KhatianDetails } from "../types";
import { detectSurveyKind } from "./khatian-display";

export type KhatianSourceField = { label: string; value: string };

const COMMON_FIELDS: Array<[string, string[]]> = [
  ["আগে / সাবেক খতিয়ান", ["আগে_খতিয়ান", "PREVIOUS_KHATIAN", "SABEK_KHATIAN_NO"]],
  ["রাজস্ব", ["RAJASWA", "REVENUE"]],
  ["খাজনা", ["KHAJNA", "RENT"]],
  ["সেস", ["CESS"]],
  ["ভূমি উন্নয়ন কর", ["LAND_DEVELOPMENT_TAX"]],
];

const MUTATION_FIELDS: Array<[string, string[]]> = [
  ["আবেদন নং", ["APPLICATION_NO", "আবেদন_নং"]],
  ["আবেদনের তারিখ", ["APPLICATION_DATE"]],
  ["মামলা নং", ["CASE_NO", "মামলা_নং"]],
  ["অনলাইন DCR", ["DCR_NO", "ONLINE_DCR"]],
  ["দলিল নং", ["DEED_NO"]],
  ["দলিলের তারিখ", ["DEED_DATE"]],
  ["হোল্ডিং নম্বর", ["HOLDING_NO"]],
];

/** Restore the source-backed fields previously shown by CompactKhatianDetailsView. */
export function extractKhatianAdditionalFields(
  khatian: KhatianDetails,
  surveyKey?: string,
): KhatianSourceField[] {
  const record = khatian.PUBLIC_RECORD ?? {};
  const kind = detectSurveyKind(khatian.SURVEY_NAME, surveyKey);
  const definitions = kind === "MUTATION" ? [...COMMON_FIELDS, ...MUTATION_FIELDS] : COMMON_FIELDS;
  const output: KhatianSourceField[] = [];

  for (const [label, keys] of definitions) {
    for (const key of keys) {
      const value = record[key];
      if (value === null || value === undefined) continue;
      if (typeof value !== "string" && typeof value !== "number") continue;
      const text = String(value).trim();
      if (text) {
        output.push({ label, value: text });
        break;
      }
    }
  }
  return output;
}
