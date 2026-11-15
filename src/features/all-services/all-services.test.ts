import { LAND_SERVICES } from "@/src/shared/config/service-catalog";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import fs from "node:fs";
import path from "node:path";

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

  it("uses the service workspace as mobile home and keeps the alias desktop-hidden", () => {
    const home = fs.readFileSync(path.join(process.cwd(), "app/(public)/page.tsx"), "utf8");
    const alias = fs.readFileSync(
      path.join(process.cwd(), "src/features/all-services/components/MobileOnlyAllServicesRoute.tsx"),
      "utf8",
    );
    expect(home).toContain('<div className="md:hidden"><AllServicesWorkspace /></div>');
    expect(home).toContain('<div className="hidden md:block">');
    expect(alias).toContain('window.matchMedia("(min-width: 768px)")');
    expect(alias).toContain('router.replace("/")');
    expect(alias).toContain('className="md:hidden"');
  });
});
