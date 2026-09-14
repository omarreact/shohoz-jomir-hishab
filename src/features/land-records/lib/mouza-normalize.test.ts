import { mouzaNamesMatch, normalizeAdminName, normalizeMouzaName } from "./mouza-normalize";

describe("normalizeMouzaName", () => {
  test("maps Patira Bangla and English to one deterministic key", () => {
    expect(normalizeMouzaName("পাতিরা")).toBe("patira");
    expect(normalizeMouzaName("Patira")).toBe("patira");
    expect(normalizeMouzaName("Patira Mouza")).toBe("patira");
    expect(mouzaNamesMatch("পাতিরা", "Patira")).toBe(true);
  });

  test("normalizes administrative suffixes for optional ambiguity checks", () => {
    expect(normalizeAdminName("Gulshan Thana")).toBe("gulshan");
    expect(normalizeAdminName("Gulshan Upazila")).toBe("gulshan");
  });
});
