import { citizenPrintMatchesExpected } from "./citizen-khatian-match";
import type { DlrmsCitizenPrint } from "../dlrms-citizen";

const fixture: DlrmsCitizenPrint = {
  source: "DLRMS_CITIZEN",
  applicationId: 1000,
  fetchedAt: "2026-11-04T00:00:00.000Z",
  khatian: {
    id: 100, khatianNo: "349", surveyId: 7, jlNumberId: 382911,
    mouzaName: "পাতিরা", districtName: "ঢাকা",
  },
  totalPages: 0,
  pages: [],
  summary: {
    occupantText: [], shareText: [], dagText: [], landTypeText: [],
    areaText: [], rentText: [], remarks: [],
  },
};

const selected = {
  khatianNo: "৩৪৯", surveyId: 7, jlNumberId: 382911,
  mouzaName: "পাতিরা", districtName: "ঢাকা",
};

describe("citizenPrintMatchesExpected", () => {
  it("recognizes the same source ID with Bengali digits", () => {
    expect(citizenPrintMatchesExpected(fixture, selected)).toBe(true);
  });
  it("rejects different records sharing a khatian number", () => {
    expect(citizenPrintMatchesExpected(fixture, { ...selected, jlNumberId: 382912 })).toBe(false);
    expect(citizenPrintMatchesExpected(fixture, { ...selected, mouzaName: "বাড্ডা" })).toBe(false);
    expect(citizenPrintMatchesExpected(fixture, { ...selected, surveyId: 6 })).toBe(false);
    expect(citizenPrintMatchesExpected(fixture, { ...selected, khatianNo: "348" })).toBe(false);
  });
  it("requires alternative location identity if the official JL field is absent", () => {
    const missingJl = { ...fixture, khatian: { ...fixture.khatian, jlNumberId: undefined } };
    expect(citizenPrintMatchesExpected(missingJl, selected)).toBe(true);
    expect(citizenPrintMatchesExpected(missingJl,
      { khatianNo: "349", jlNumberId: 382911 })).toBe(false);
  });
});
