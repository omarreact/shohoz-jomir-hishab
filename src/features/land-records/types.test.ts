import {
  MUTATION_SURVEY_ID,
  normalizeSurveyKey,
  resolveSurveyKey,
} from "./types";

describe("DLRMS survey-key compatibility", () => {
  it("keeps known survey IDs compatible", () => {
    expect(resolveSurveyKey({ SURVEY_ID: 7, SURVEY_NAME_EN: "" })).toBe("BRS");
    expect(resolveSurveyKey({ SURVEY_ID: MUTATION_SURVEY_ID, SURVEY_NAME_EN: "MUTATION" })).toBe("MUTATION");
  });

  it("accepts a newly published safe survey key from the official Mouza payload", () => {
    expect(resolveSurveyKey({ SURVEY_ID: 42, SURVEY_NAME_EN: "CITY_SURVEY" })).toBe("CITY_SURVEY");
  });

  it("rejects unsafe path/query values instead of forwarding them upstream", () => {
    expect(normalizeSurveyKey("../BRS")).toBeUndefined();
    expect(normalizeSurveyKey("BRS/1")).toBeUndefined();
    expect(normalizeSurveyKey("BRS?token=x")).toBeUndefined();
  });
});
