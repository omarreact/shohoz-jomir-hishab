import { FEATURE_ROUTES } from "./feature-routes";
import { MOBILE_MENU_KEYS, NAV_SECTIONS, isFeatureRouteActive, featureSection, navRoute } from "./navigation";

describe("canonical navigation and deep links", () => {
  test("every group uses registered destinations without duplicate feature keys", () => {
    const keys = NAV_SECTIONS.flatMap(g => [...g.keys]);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(FEATURE_ROUTES[key]).toMatch(/^\//);
      expect(featureSection(key)?.label).toBeTruthy();
    }
    for (const key of MOBILE_MENU_KEYS) {
      expect(keys).toContain(key);
      expect(navRoute(key).href).toBe(FEATURE_ROUTES[key]);
    }
  });

  test("deep links activate only the correct segment-safe menu entry", () => {
    expect(isFeatureRouteActive("/blog/land/example", "/blog")).toBe(true);
    expect(isFeatureRouteActive("/blogger", "/blog")).toBe(false);
    expect(isFeatureRouteActive("/admin/users/create", "/admin/users")).toBe(true);
    expect(isFeatureRouteActive("/administer", "/admin")).toBe(false);
    expect(isFeatureRouteActive("/dlrms-khatian?survey=BRS", "/dlrms-khatian")).toBe(true);
    expect(isFeatureRouteActive("/map", "/geospatial-map")).toBe(true);
    expect(isFeatureRouteActive("/dap-map", "/geospatial-map")).toBe(true);
    expect(isFeatureRouteActive("/khatian", "/khatiyan")).toBe(true);
    expect(isFeatureRouteActive("/survey-khatian", "/dlrms-khatian")).toBe(true);
    expect(isFeatureRouteActive("/admin", "/")).toBe(false);
  });
});
