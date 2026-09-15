import { lisfSurveyType, parseLisfDagInfo, parseLisfOwnerInfo } from "./lisf-provider";

describe("LISF Khatian enrichment parser", () => {
  it("maps LandBD survey IDs to documented LISF survey_type values", () => {
    expect(lisfSurveyType({ SURVEY_ID: 7, SURVEY_NAME: "বি আর এস" })).toBe("1");
    expect(lisfSurveyType({ SURVEY_ID: 1, SURVEY_NAME: "সি এস" })).toBe("2");
    expect(lisfSurveyType({ SURVEY_ID: 3, SURVEY_NAME: "এস এ" })).toBe("3");
    expect(lisfSurveyType({ SURVEY_ID: 5, SURVEY_NAME: "দিয়ারা" })).toBe("5");
    expect(lisfSurveyType({ SURVEY_ID: 2, SURVEY_NAME: "আর এস" })).toBe("6");
    expect(lisfSurveyType({ SURVEY_ID: 4, SURVEY_NAME: "বি এস" })).toBeNull();
  });

  it("preserves aligned Dag, land-type, total-area and Khatian-area lists", () => {
    const result = parseLisfDagInfo([{
      "Dag Number List": ["1948", "1972", "1987"],
      "Dag Number Land Type List": ["চালা", "চালা", "নাল"],
      "Total Area amount List": ["0.2000", "0.1200", "0.4000"],
      "Khatian Area Amount List": ["0.1152", "0.0868", "0.3144"],
    }]);

    expect(result).toEqual([
      {
        dagNo: "1948",
        landType: "চালা",
        totalAreaRaw: "0.2000",
        khatianAreaRaw: "0.1152",
        source: "LISF_AUTHORIZED",
      },
      {
        dagNo: "1972",
        landType: "চালা",
        totalAreaRaw: "0.1200",
        khatianAreaRaw: "0.0868",
        source: "LISF_AUTHORIZED",
      },
      {
        dagNo: "1987",
        landType: "নাল",
        totalAreaRaw: "0.4000",
        khatianAreaRaw: "0.3144",
        source: "LISF_AUTHORIZED",
      },
    ]);
  });

  it("keeps repeated owner rows and aligns guardian/address/share by index", () => {
    const result = parseLisfOwnerInfo([{
      "Land Owner Name List": ["সিরাজদ্দিন", "সিরাজদ্দিন"],
      "Land Owner Father/Husband Name List": ["পিং জোনাবালী", "পিং তোরাবালী"],
      "Land Owner Address List": ["সাং নিজ", "সাং নিজ"],
      "Land Owner Percentage List": ["0.10", "0.20"],
    }]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: "সিরাজদ্দিন",
      fatherOrHusband: "পিং জোনাবালী",
      shareRaw: "0.10",
      source: "LISF_AUTHORIZED",
    });
    expect(result[1]).toMatchObject({
      name: "সিরাজদ্দিন",
      fatherOrHusband: "পিং তোরাবালী",
      shareRaw: "0.20",
      source: "LISF_AUTHORIZED",
    });
  });
});
