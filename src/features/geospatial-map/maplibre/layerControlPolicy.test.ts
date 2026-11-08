import {
  canToggleRasterLayer,
  defaultRasterLayerVisibility,
  hideAvailableRasterLayers,
  setRasterLayerVisibility,
  shouldShowSurveyBoundary,
} from "./layerControlPolicy";
import {
  ADVANCED_LAYER_VISIBILITY,
  PUBLIC_LAYER_VISIBILITY,
  type LayerKey,
} from "./mapConstants";

describe("GIS layer checkbox access and visibility", () => {
  it("allows anonymous visitors to toggle only already-public RS and MS rasters", () => {
    const allowed = (Object.keys(PUBLIC_LAYER_VISIBILITY) as LayerKey[]).filter((key) =>
      canToggleRasterLayer(key, false),
    );
    expect(allowed).toEqual(["rs", "ms"]);
    expect(canToggleRasterLayer("dap", true)).toBe(true);
    expect(canToggleRasterLayer("flood", true)).toBe(true);
  });

  it("unchecks RS/MS independently without mutating state or advancing privileges", () => {
    const start = defaultRasterLayerVisibility(false);
    const next = setRasterLayerVisibility(start, "rs", false, false);
    expect(next.rs).toBe(false);
    expect(next.ms).toBe(true);
    expect(start.rs).toBe(true);
    expect(setRasterLayerVisibility(next, "dap", true, false)).toBe(next);
  });

  it("hides only permitted public layers when visitor presses all off", () => {
    const start = { ...PUBLIC_LAYER_VISIBILITY, dap: true, flood: true };
    const next = hideAvailableRasterLayers(start, false);
    expect(next.rs).toBe(false);
    expect(next.ms).toBe(false);
    expect(next.dap).toBe(true);
    expect(next.flood).toBe(true);
    expect(start.rs).toBe(true);
  });

  it("allows an authenticated visitor to hide all raster overlays", () => {
    const next = hideAvailableRasterLayers(defaultRasterLayerVisibility(true), true);
    expect(Object.values(next).every((visible) => visible === false)).toBe(true);
    expect(defaultRasterLayerVisibility(true)).toEqual(ADVANCED_LAYER_VISIBILITY);
  });

  it("restores default public and authenticated layer presets without shared references", () => {
    expect(defaultRasterLayerVisibility(false)).toEqual(PUBLIC_LAYER_VISIBILITY);
    expect(defaultRasterLayerVisibility(false)).not.toBe(PUBLIC_LAYER_VISIBILITY);
    expect(defaultRasterLayerVisibility(true)).toEqual(ADVANCED_LAYER_VISIBILITY);
  });

  it("never shows RS/MS vector boundaries after its raster layer is unchecked", () => {
    expect(shouldShowSurveyBoundary(false, true)).toBe(false);
    expect(shouldShowSurveyBoundary(true, false)).toBe(false);
    expect(shouldShowSurveyBoundary(true, true)).toBe(true);
  });
});
