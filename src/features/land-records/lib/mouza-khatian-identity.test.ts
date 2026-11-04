import { khatianMatchesMouza } from "./mouza-khatian-identity";

const official = { ID: 349, KHATIAN_NO: "৩৪৯", JL_NUMBER_ID: 71947 };

describe("khatianMatchesMouza", () => {
  it("accepts a record whose official JL matches the selected mouza", () => {
    expect(khatianMatchesMouza(official, 71947)).toBe(true);
  });

  it("does not allow a conflicting official JL even with a matching index row", () => {
    expect(khatianMatchesMouza(official, 71948, [{ ID: 349, KHATIAN_NO: "৩৪৯" }])).toBe(false);
  });

  it("requires an exact ID and khatian number if the official JL is missing", () => {
    const missingJl = { ...official, JL_NUMBER_ID: 0 };
    expect(khatianMatchesMouza(missingJl, 71947, [{ ID: 349, KHATIAN_NO: "৩৪৯" }])).toBe(true);
    expect(khatianMatchesMouza(missingJl, 71947, [{ ID: 350, KHATIAN_NO: "৩৪৯" }])).toBe(false);
    expect(khatianMatchesMouza(missingJl, 71947, [{ ID: 349, KHATIAN_NO: "৩৪৮" }])).toBe(false);
    expect(khatianMatchesMouza(missingJl, 71947, [])).toBe(false);
  });

  it("rejects invalid or nonpositive requested JL identifiers", () => {
    expect(khatianMatchesMouza(official, 0)).toBe(false);
    expect(khatianMatchesMouza(official, Number.NaN)).toBe(false);
  });
});
