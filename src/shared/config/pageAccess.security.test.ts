import {
  getDefaultPageAccessRules,
  getPageAccessLevel,
  sanitizePageAccessRules,
} from "./pageAccess";

describe("sensitive public-route minimum access", () => {
  it("keeps QA routes privileged even when stored rules try to downgrade them", () => {
    const rules = sanitizePageAccessRules({
      "/ms-test": "public",
      "/rajuk-test": "public",
      "/porcha": "public",
    });

    expect(getPageAccessLevel("/ms-test", rules)).toBe("super_admin");
    expect(getPageAccessLevel("/rajuk-test", rules)).toBe("admin");
    expect(getPageAccessLevel("/porcha", rules)).toBe("logged_in");
  });

  it("preserves default privileged access", () => {
    const defaults = getDefaultPageAccessRules();
    expect(defaults["/ms-test"]).toBe("super_admin");
    expect(defaults["/rajuk-test"]).toBe("admin");
  });
});
