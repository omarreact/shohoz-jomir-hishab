import {
  BASEMAP_SOURCE_DEFINITIONS,
  BASEMAP_SOURCE_IDS,
  BASEMAP_LAYER_IDS,
  type BasemapKey,
} from "./types";
import { FREE_IMAGERY_OPTIONS, PUBLIC_BASEMAP_KEYS, PUBLIC_LAYER_OPACITY } from "./mapConstants";

describe("LandBD publicly usable imagery", () => {
  it("registers every selectable basemap with stable source and layer IDs", () => {
    for (const key of PUBLIC_BASEMAP_KEYS) {
      expect(BASEMAP_SOURCE_DEFINITIONS[key]).toBeDefined();
      expect(BASEMAP_SOURCE_IDS[key]).toBeTruthy();
      expect(BASEMAP_LAYER_IDS[key]).toBeTruthy();
    }
  });

  it("offers NASA MODIS only as date-specific low resolution imagery", () => {
    for (const year of [2003, 2010, 2020, 2025]) {
      const key = `satellite${year}` as BasemapKey;
      const raster = BASEMAP_SOURCE_DEFINITIONS[key];
      expect(raster.tiles?.[0]).toContain(`/${year}-01-17/GoogleMapsCompatible_Level9/`);
      expect(raster.maxzoom).toBe(9);
      expect(FREE_IMAGERY_OPTIONS.find((item) => item.key === key)?.detail).toMatch(/দাগ/);
    }
  });

  it("limits EOxCloudless free commercial integration to 2016", () => {
    expect(BASEMAP_SOURCE_DEFINITIONS.sentinel2016.tiles?.[0]).toContain("/s2cloudless_3857/");
    expect(BASEMAP_SOURCE_DEFINITIONS.sentinel2016.attribution).toContain("EOxCloudless");
    expect(FREE_IMAGERY_OPTIONS.some((item) => item.key === "sentinel2016")).toBe(true);
    expect(FREE_IMAGERY_OPTIONS).toHaveLength(5);
  });

  it("keeps satellite imagery legible below RS/MS cadastral raster tiles", () => {
    expect(PUBLIC_LAYER_OPACITY.rs).toBeGreaterThan(0);
    expect(PUBLIC_LAYER_OPACITY.rs).toBeLessThan(1);
    expect(PUBLIC_LAYER_OPACITY.ms).toBeGreaterThan(0);
    expect(PUBLIC_LAYER_OPACITY.ms).toBeLessThan(1);
  });
});
