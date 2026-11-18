import fs from "node:fs";
import path from "node:path";
const read = (name: string) => fs.readFileSync(path.join(process.cwd(), name), "utf8");
describe("LandBD edge-to-edge UI coverage", () => {
  it("preserves the public service pages and independent GIS workspaces", () => {
    for (const route of ["khatiyan", "land-measurement", "faraez", "dlrms-khatian", "mouza-khatian-book", "mouza-dag-report", "porcha", "contact"]) {
      expect(fs.existsSync(path.join(process.cwd(), "app/(public)", route, "page.tsx"))).toBe(true);
    }
    for (const route of ["geospatial-map", "mouza-map", "rajuk-test"]) {
      expect(fs.existsSync(path.join(process.cwd(), "app/(immersive)", route, "page.tsx"))).toBe(true);
    }
  });
  it("retains direct mobile links, desktop nav and map-first presentation", () => {
    const home = read("src/features/all-services/components/AllServicesWorkspace.tsx");
    const nav = read("src/shared/components/Navbar.tsx");
    const map = read("src/features/geospatial-map/components/GeospatialMapClient.tsx");
    expect(home).toContain("href={service.href}");
    expect(home).not.toContain("mobile-service-selector");
    expect(nav).toContain("GLOBAL_NAVIGATION.map");
    expect(nav).toContain("text-[18px]");
    expect(map).toContain("fixed inset-0");
  });
  it("labels calculator inputs and destructive actions", () => {
    const plots = read("src/features/khatiyan/components/PlotsCard.tsx");
    const owners = read("src/features/khatiyan/components/OwnersCard.tsx");
    for (const field of ["cs", "rs", "city", "bds", "a"]) {
      expect(plots).toContain("htmlFor={");
      expect(plots).toContain("plot-" + field + "-");
      expect(plots).toContain("id={");
    }
    expect(owners).toContain("owner-name-");
    expect(owners).toContain("owner-guardian-");
    expect(plots).toContain("aria-label=");
    expect(owners).toContain("aria-label=");
  });
  it("keeps inheritance controls and mobile book selection accessible", () => {
    const faraez = read("app/(public)/faraez/page.tsx");
    const heirs = read("src/features/faraez/components/FamilyTreeInput.tsx");
    const book = read("src/features/land-records/components/MouzaPorchaReportBuilder.tsx");
    expect(faraez).toContain('aria-pressed={religion === "muslim"}');
    expect(faraez).toContain('aria-pressed={gender === "female"}');
    expect(faraez).toContain("aria-expanded={isGuideOpen}");
    expect(heirs).toContain("aria-expanded={isOpen}");
    expect(heirs).toContain("faraez-heirs-group-");
    expect(book).toContain("sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5");
    expect(book).toContain("min-w-0 w-full space-y-3");
  });
  it("is screen-only and preserves existing A4 print policy", () => {
    expect(read("app/landbd-theme.css")).toContain("LandBD screen-only UX refinements");
    expect(read("app/landbd-theme.css")).toContain("@media screen");
    expect(read("app/globals.css")).toContain("@page");
    expect(read("app/(control)/admin/layout.tsx")).toContain("landbd-admin-shell");
  });
});
