import { GIS_COVERAGE_NOTE, LAND_SURVEY_LABELS, OFFICIAL_LAND_SERVICES, OFFICIAL_LAND_USE_CLASSES } from "./officialLandSources";

describe("LandBD official land-source catalog", () => {
  it("links only to explicit government or DLRS portals", () => {
    expect(OFFICIAL_LAND_SERVICES.length).toBeGreaterThanOrEqual(5);
    for (const service of OFFICIAL_LAND_SERVICES) {
      const url = new URL(service.href);
      expect(url.protocol).toBe("https:");
      expect(url.hostname === "land.gov.bd" || url.hostname.endsWith(".land.gov.bd") || url.hostname === "settlement.gov.bd" || url.hostname.endsWith(".settlement.gov.bd")).toBe(true);
      expect(service.source.trim().length).toBeGreaterThan(0);
      expect(service.subtitle.trim().length).toBeGreaterThan(0);
    }
  });

  it("does not misclassify a draft survey as final", () => {
    expect(OFFICIAL_LAND_SERVICES.find((item) => item.id === "settlement")?.kind).toBe("draft");
    expect(GIS_COVERAGE_NOTE).toMatch(/RAJUK/);
    expect(GIS_COVERAGE_NOTE).toMatch(/সব মৌজার/);
  });

  it("identifies published survey types and land-use categories without manufacturing records", () => {
    expect(LAND_SURVEY_LABELS.map((row) => row.code)).toEqual(["CS", "SA", "RS", "BRS", "BDS"]);
    expect(OFFICIAL_LAND_USE_CLASSES).toContain("কৃষি");
    expect(OFFICIAL_LAND_USE_CLASSES).toContain("জলমহাল / জলাশয়");
  });
});
