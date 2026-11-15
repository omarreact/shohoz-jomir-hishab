import { LAND_SERVICES } from "@/src/shared/config/service-catalog";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

describe("all services catalogue", () => {
  it("keeps every requested service unique and connected to a declared route", () => {
    expect(LAND_SERVICES).toHaveLength(10);
    expect(new Set(LAND_SERVICES.map((service) => service.id)).size).toBe(LAND_SERVICES.length);
    expect(new Set(LAND_SERVICES.map((service) => service.href)).size).toBe(LAND_SERVICES.length);
    for (const service of LAND_SERVICES) {
      expect(Object.values(FEATURE_ROUTES)).toContain(service.href);
      expect(service.highlights).toHaveLength(3);
    }
  });

  it("contains the three service groups used by the sidebar", () => {
    expect(new Set(LAND_SERVICES.map((service) => service.category))).toEqual(
      new Set(["হিসাব", "খতিয়ান", "মানচিত্র"]),
    );
  });
});
