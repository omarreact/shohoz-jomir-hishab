import { isPrivateSearchPath, parseSearchIndexingEnabled } from "./search-indexing-config";
describe("Search-engine indexing safety policy", () => {
  test("never enables from missing, malformed or truthy-but-not-approved values", () => {
    for (const value of [undefined, null, false, "false", 1, "1", "yes", {}, []]) {
      expect(parseSearchIndexingEnabled(value)).toBe(false);
    }
  });
  test("enables only when expressly set true", () => {
    expect(parseSearchIndexingEnabled(true)).toBe(true);
    expect(parseSearchIndexingEnabled("true")).toBe(true);
  });
  test("private and sensitive routes always stay noindex", () => {
    for (const pathname of ["/nid_dob", "/nid-copy", "/admin/nid-verification", "/admin", "/admin/orders", "/api/auth/session", "/login", "/checkout/result", "/security-locked", "/maintenance", "/my-purchases"]) {
      expect(isPrivateSearchPath(pathname)).toBe(true);
    }
    for (const pathname of ["/", "/khatiyan", "/geospatial-map", "/mouza-map"]) {
      expect(isPrivateSearchPath(pathname)).toBe(false);
    }
  });
});
