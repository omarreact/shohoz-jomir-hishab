import type { FeatureCollection, Geometry } from "geojson";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { featuresToFc, isSafeGeoJson, isValidLngLat, sanitizeRajukFeature, sanitizeRajukFeatures } from "./mapUtils";

function feature(rings: number[][][]): RajukPlotFeature {
  return {
    attributes: {
      objectid: 1,
      plot_no: 117,
      p_guid: "p-1",
      rs_plot_no: "117",
      address_search: null,
      Shape__Area: null,
      Shape__Length: null,
    },
    geometry: { rings },
  };
}

describe("GIS coordinate boundary", () => {
  it("accepts canonical [longitude, latitude] coordinates", () => {
    expect(isValidLngLat([90.48911986, 23.82810618])).toBe(true);
    expect(isValidLngLat([-180, -90])).toBe(true);
    expect(isValidLngLat([180, 90])).toBe(true);
  });

  it("rejects the historic [latitude, longitude] ordering when longitude exceeds latitude range", () => {
    expect(isValidLngLat([23.82810618, 90.48911986])).toBe(false);
  });

  it("rejects NaN, Infinity, and out-of-range coordinates", () => {
    expect(isValidLngLat([Number.NaN, 23])).toBe(false);
    expect(isValidLngLat([90, Number.POSITIVE_INFINITY])).toBe(false);
    expect(isValidLngLat([181, 23])).toBe(false);
    expect(isValidLngLat([90, -91])).toBe(false);
  });

  it("rejects an entire feature if any ring contains an invalid coordinate", () => {
    const safe = feature([[
      [90.1, 23.1],
      [90.2, 23.1],
      [90.2, 23.2],
      [90.1, 23.1],
    ]]);
    const unsafe = feature([[
      [90.1, 23.1],
      [90.2, 23.1],
      [90.2, 91.2],
      [90.1, 23.1],
    ]]);

    expect(sanitizeRajukFeature(safe)).not.toBeNull();
    expect(sanitizeRajukFeature(unsafe)).toBeNull();
    expect(sanitizeRajukFeatures([safe, unsafe])).toHaveLength(1);
  });

  it("rejects unsafe coordinates before any GeoJSON source can call setData", () => {
    const safe: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [90.4, 23.8] },
          properties: {},
        },
      ],
    };
    const unsafe: FeatureCollection<Geometry> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [90.4, 90.8] },
          properties: {},
        },
      ],
    };

    expect(isSafeGeoJson(safe)).toBe(true);
    expect(isSafeGeoJson(unsafe)).toBe(false);
  });
});

describe("sanitizeRajukFeatures pipeline", () => {
  it("keeps multiple safe RS/MS features for a single atomic setData payload", () => {
    const safeRs = feature([[
      [90.1, 23.1],
      [90.2, 23.1],
      [90.2, 23.2],
      [90.1, 23.1],
    ]]);
    const safeMs = feature([[
      [90.15, 23.15],
      [90.18, 23.15],
      [90.18, 23.18],
      [90.15, 23.15],
    ]]);
    safeMs.attributes = { ...safeMs.attributes, _layer_source: "ms", ms_plot_no: "MS-1", plot_no: 1 };
    const unsafe = feature([[
      [90.1, 23.1],
      [90.2, 23.1],
      [90.2, 91.2],
      [90.1, 23.1],
    ]]);

    const cleaned = sanitizeRajukFeatures([safeRs, unsafe, safeMs]);
    expect(cleaned).toHaveLength(2);
    const fc = featuresToFc(cleaned);
    expect(isSafeGeoJson(fc)).toBe(true);
    expect(fc.features).toHaveLength(2);
  });
});
