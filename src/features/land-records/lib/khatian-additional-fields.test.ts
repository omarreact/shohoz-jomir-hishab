import { extractKhatianAdditionalFields } from "./khatian-additional-fields";
import type { KhatianDetails } from "../types";

function sample(survey: string, publicRecord: Record<string, unknown>): KhatianDetails {
  return {
    ID: 349,
    KHATIAN_NO: "349",
    OWNERS: "মালিক",
    DAGS: "125",
    GUARDIANS: "",
    JL_NUMBER_ID: 1,
    MOUZA_ID: 1,
    IS_LOCKED: 0,
    DIVISION_NAME: "ঢাকা",
    DISTRICT_NAME: "ঢাকা",
    UPAZILA_NAME: "রূপগঞ্জ",
    JL_NUMBER: "1",
    MOUZA_NAME: "পাতিরা",
    SURVEY_NAME: survey,
    TOTAL_LAND: "",
    PUBLIC_RECORD: publicRecord,
  };
}

describe("source-backed fields for every khatian survey", () => {
  test("restores revenue, previous khatian and tax from BRS/RS/SA/CS record payloads", () => {
    for (const survey of ["BRS", "RS", "SA", "CS"]) {
      expect(extractKhatianAdditionalFields(sample(survey, {
        PREVIOUS_KHATIAN: "100",
        KHAJNA: "6.50",
        LAND_DEVELOPMENT_TAX: 0,
      }), survey)).toEqual([
        { label: "আগে / সাবেক খতিয়ান", value: "100" },
        { label: "খাজনা", value: "6.50" },
        { label: "ভূমি উন্নয়ন কর", value: "0" },
      ]);
    }
  });

  test("includes application, case and deed metadata for mutation only", () => {
    const values = { APPLICATION_NO: "123", CASE_NO: "88", DCR_NO: "17" };
    const mutation = extractKhatianAdditionalFields(sample("MUTATION", values), "MUTATION");
    expect(mutation.map((row) => row.label)).toEqual(["আবেদন নং", "মামলা নং", "অনলাইন DCR"]);
    expect(extractKhatianAdditionalFields(sample("RS", values), "RS")).toEqual([]);
  });

  test("does not fabricate empty fields or serialize unknown objects", () => {
    expect(extractKhatianAdditionalFields(sample("BRS", {
      RAJASWA: " ",
      KHAJNA: null,
      RENT: { amount: "unverified" },
    }), "BRS")).toEqual([]);
  });
});
