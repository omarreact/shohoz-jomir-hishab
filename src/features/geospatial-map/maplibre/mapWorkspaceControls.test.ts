import fs from "node:fs";
import path from "node:path";

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const view = source("src/features/geospatial-map/maplibre/MapLibreMapViewV3.tsx");
const controller = source("src/features/geospatial-map/maplibre/MapLibreMap.tsx");
const styles = source("src/features/geospatial-map/maplibre/layers.ts");
const constants = source("src/features/geospatial-map/maplibre/mapConstants.ts");
const client = source("src/features/geospatial-map/components/GeospatialMapClient.tsx");
const globals = source("app/globals.css");

describe("LandBD map-first GIS workspace", () => {
  it("starts with a collapsed icon sidebar and exposes one tool panel at a time", () => {
    expect(constants).toContain(
      'export type Tab = "search" | "layers" | "basemap" | "history" | "legend" | "settings"',
    );
    expect(controller).toContain("const [panelOpen, setPanelOpen] = useState(false)");
    expect(view).toContain('aria-label="GIS মানচিত্র সাইডবার"');
    expect(view).toContain('id="atlas-map-workspace-panel"');
    expect(view).toContain("if (panelOpen && tab === next)");
    expect(view).toContain('event.key !== "Escape"');
    expect(view).not.toContain("window.matchMedia");
    expect(view).not.toContain('setPanelOpen(query.matches)');
    expect(view).not.toContain('role="tablist"');
  });

  it("removes measurement/drawing UI and all always-on map tool cards", () => {
    expect(view).not.toContain("পরিমাপ ও জরিপ টুলস");
    expect(view).not.toContain("মানচিত্রে ট্যাপ করে বিন্দু বসান");
    expect(view).not.toContain("MEASURE_SOURCE_ID");
    expect(view).not.toContain("mapMeasurement");
    expect(view).not.toContain("measurePanelOpen");
    expect(view).not.toContain("RajukMapControls");
    expect(view).not.toContain("RajukCoordinateStatus");
    expect(view).not.toContain("RajukParcelInspector");
    expect(client).not.toContain("MapVisitConsent");
    for (const file of [
      "src/features/geospatial-map/maplibre/mapMeasurement.ts",
      "src/features/geospatial-map/maplibre/RajukMapControls.tsx",
      "src/features/geospatial-map/maplibre/RajukCoordinateStatus.tsx",
      "src/features/geospatial-map/maplibre/RajukParcelInspector.tsx",
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), file))).toBe(false);
    }
  });

  it("keeps dag identify on the map and renders only one selected-dag popup", () => {
    expect(controller).toContain('action: "identify"');
    expect(controller).toContain("new maplibregl.Popup");
    expect(controller).toContain("closeOnClick: false");
    expect(controller).toContain("popupRef.current?.remove()");
    expect(controller).toContain("featuresToFc([feature])");
    expect(controller).toContain("buildDagPopupContent");
    expect(controller).toContain("তথ্য পাওয়া যায়নি");
    expect(controller).not.toContain('setTab("results")');
  });

  it("keeps RS/MS layer controls and canonical black/red survey styling", () => {
    expect(view).toContain("setRasterLayerVisibility");
    expect(view).toContain("defaultRasterLayerVisibility");
    expect(view).toContain("hideAvailableRasterLayers");
    expect(styles).toContain('"line-color": "#181e1d"');
    expect(styles).toContain('"line-color": "#dc2626"');
    expect(constants).toContain('color: "#151c1a"');
    expect(constants).toContain('color: "#dc2626"');
  });

  it("labels historical imagery truthfully and never embeds Google Earth tiles", () => {
    expect(constants).toContain('label: "NASA MODIS · 2003"');
    expect(constants).toContain("gibs.earthdata.nasa.gov");
    expect(constants).toContain('GOOGLE_EARTH_2003_URL = "https://earth.google.com/web/"');
    expect(constants).toContain("developers.google.com/maps/documentation/earth/historical-imagery");
    expect(view).toContain("নিচের ২০০৩ layer হলো NASA MODIS, Google Earth নয়");
    expect(view).not.toContain("earth.google.com/web/@");
  });

  it("locks screen UI copy to at least 18px without changing print or map-canvas labels", () => {
    expect(globals).toContain("Screen typography contract");
    expect(globals).toContain("font-size: 18px !important");
    expect(globals).toContain("MapLibre canvas labels");
    expect(globals).toContain("@media print");
    // MapLibre's internal symbol text remains deliberately independent.
    expect(styles).toContain('"text-size": 12');
  });
});
