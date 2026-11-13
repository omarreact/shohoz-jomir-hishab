import fs from "node:fs";
import path from "node:path";

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const view = source("src/features/geospatial-map/maplibre/MapLibreMapViewV3.tsx");
const controller = source("src/features/geospatial-map/maplibre/MapLibreMap.tsx");
const styles = source("src/features/geospatial-map/maplibre/layers.ts");
const constants = source("src/features/geospatial-map/maplibre/mapConstants.ts");
const header = source("src/features/geospatial-map/maplibre/RajukStyleMapHeader.tsx");
const controls = source("src/features/geospatial-map/maplibre/RajukMapControls.tsx");
const coordinates = source("src/features/geospatial-map/maplibre/RajukCoordinateStatus.tsx");

describe("LandBD DAP-style map workspace UI consolidation", () => {
  it("uses a single scrollable panel for plot search, layers, basemaps and results", () => {
    expect(constants).toContain('type Tab = "search" | "layers" | "basemap" | "results"');
    expect(controller).toContain('useState<Tab>("search")');
    expect(view).toContain('role="tablist"');
    expect(view).toContain('tab === "search"');
    expect(view).toContain('tab === "layers"');
    expect(view).toContain('tab === "basemap"');
    expect(view).toContain('role="tab"');
    expect(view).toContain("overflow-y-auto overscroll-contain");
    expect(view).not.toContain("RajukLayerSwitcher");
  });

  it("provides one RS/MS visibility control per survey with no redundant palette", () => {
    expect(view).toContain("setRasterLayerVisibility");
    expect(view).toContain("defaultRasterLayerVisibility");
    expect(view).toContain("hideAvailableRasterLayers");
    expect(view).not.toContain("checked={showRsBoundary}");
    expect(view).not.toContain("checked={showMsBoundary}");
    expect(view).not.toContain('setTab("basemap")');
    expect(header).not.toContain('href="/rajuk-test"');
  });

  it("uses the requested RS-black and MS-red vector/legend colors", () => {
    expect(styles).toContain('"line-color": "#181e1d"');
    expect(styles).toContain('"line-color": "#dc2626"');
    expect(constants).toContain('color: "#151c1a"');
    expect(constants).toContain('color: "#dc2626"');
  });

  it("avoids colliding mobile overlays and retains map navigation, export and print", () => {
    expect(view).toContain('window.matchMedia("(min-width: 1024px)")');
    expect(view).toContain("max-lg:hidden");
    expect(view).toContain("lg:max-w-[520px]");
    expect(coordinates).toContain("bottom-[92px]");
    for (const handler of ["zoomIn", "zoomOut", "fitBounds", "resetNorth", "goToMyLocation", "toggleFullscreen", "savePng", "window.print()"]) {
      expect(controls).toContain(handler);
    }
    expect(controls).toContain("overflow-y-auto overscroll-contain");
  });
});
