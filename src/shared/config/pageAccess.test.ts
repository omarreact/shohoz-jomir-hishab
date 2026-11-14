import {
  PAGE_ACCESS_PAGES,
  getDefaultPageAccessRules,
  getPageAccessLevel,
  normalizeStoredPageAccess,
  resolvePageDefinition,
  sanitizePageAccessRules,
} from "./pageAccess";

describe("page access registry", () => {
  it("contains every current user-facing top-level route", () => {
    const ids = new Set(PAGE_ACCESS_PAGES.map((page) => page.id));
    [
      "/",
      "/blog",
      "/contact",
      "/dlrms-khatian",
      "/faq",
      "/faraez",
      "/geospatial-map",
      "/khatiyan",
      "/land-measurement",
      "/mouza-map",
      "/mouza-khatian-book",
      "/mouza-dag-report",
      "/ms-test",
      "/porcha",
      "/privacy",
      "/rajuk-test",
      "/terms",
    ].forEach((route) => expect(ids.has(route)).toBe(true));
  });

  it("keeps the remaining Porcha workspace member-only", () => {
    const rules = getDefaultPageAccessRules();
    expect(rules["/porcha"]).toBe("logged_in");
    rules["/porcha"] = "public";
    expect(getPageAccessLevel("/porcha", rules)).toBe("logged_in");
    expect(sanitizePageAccessRules({ "/porcha": "public" })["/porcha"]).toBe("logged_in");
  });

  it("defaults QA routes to staff-only access", () => {
    const rules = getDefaultPageAccessRules();
    expect(rules["/rajuk-test"]).toBe("admin");
    expect(rules["/ms-test"]).toBe("super_admin");
  });

  it("resolves dynamic blog and custom page routes", () => {
    expect(resolvePageDefinition("/blog/land/bangladesh-records")?.id).toBe("/blog/[category]/[slug]");
    expect(resolvePageDefinition("/p/about-landbd")?.id).toBe("/p/[slug]");
  });

  it("keeps unknown routes public and applies known restrictions", () => {
    const rules = getDefaultPageAccessRules();
    rules["/geospatial-map"] = "logged_in";
    expect(getPageAccessLevel("/geospatial-map", rules)).toBe("logged_in");
    expect(getPageAccessLevel("/not-registered", rules)).toBe("public");
  });

  it("rejects invalid values and unknown keys during sanitization", () => {
    const rules = sanitizePageAccessRules({
      "/geospatial-map": "admin",
      "/faraez": "not-a-level",
      "/made-up": "hidden",
    });
    expect(rules["/geospatial-map"]).toBe("admin");
    expect(rules["/faraez"]).toBe("public");
    expect(rules["/made-up"]).toBeUndefined();
  });

  it("supports both legacy flat Firestore data and new rules envelope", () => {
    expect(normalizeStoredPageAccess({ "/mouza-map": "hidden" })["/mouza-map"]).toBe("hidden");
    expect(normalizeStoredPageAccess({ rules: { "/mouza-map": "admin" } })["/mouza-map"]).toBe("admin");
  });
});

test("retired pages are absent from the access registry", () => {
  const removed = [
    "/dap-map",
    "/history",
    "/khatian",
    "/map",
    "/mouza-porcha-report",
    "/my-purchases",
    "/namjari-khatian",
    "/nid-copy",
    "/nid_dob",
    "/settlement-khatian",
    "/warish",
    "/warishsanad"
];
  const defaults = getDefaultPageAccessRules();
  for (const route of removed) {
    expect(defaults[route]).toBeUndefined();
    expect(resolvePageDefinition(route)).toBeNull();
  }
});
