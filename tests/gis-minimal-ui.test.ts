import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * UI guardrails for the fullscreen GIS workspace. These checks do not
 * replace interactive accessibility, browser or map-rendering QA.
 */
const view = readFileSync(join(process.cwd(), "src/features/geospatial-map/maplibre/MapLibreMapViewV3.tsx"), "utf8");
const controls = readFileSync(join(process.cwd(), "src/features/geospatial-map/maplibre/RajukMapControls.tsx"), "utf8");

describe("minimal geospatial map UI", () => {
  it("removes the redundant introductory banner and repeated legend", () => {
    expect(view).not.toContain("LANDBD · GIS MASTER PLAN");
    expect(view).not.toContain("RAJUK-ধাঁচের");
    expect(view).not.toContain("Map legend / লেজেন্ড");
  });

  it("keeps plot search, layers, basemaps, historic imagery and plot results", () => {
    for (const required of [
      "<RajukPlotFinder",
      "<RajukLayerSwitcher",
      "FREE_IMAGERY_OPTIONS.map",
      'tab === "layers"',
      'tab === "basemap"',
      "rsResults.map",
      "msResults.map",
    ]) expect(view).toContain(required);
  });

  it("retains map measurement, parcel inspection and the government-source disclaimer", () => {
    for (const required of [
      "RajukParcelInspector",
      "startMeasurement(mode)",
      "summary.area",
      "OfficialLandSourceDock detailed",
      "LEGAL_SURVEY_NOTE",
    ]) expect(view).toContain(required);
  });

  it("keeps advanced map actions available in the More menu", () => {
    expect(controls).toContain('aria-label="আরও ম্যাপ টুল"');
    expect(controls).toContain('aria-expanded={moreOpen}');
    for (const required of [
      "fullExtent",
      "resetNorth",
      "toggleThreeD",
      "toggleFullscreen",
      "savePng",
      "window.print()",
    ]) expect(controls).toContain(required);
  });
});
