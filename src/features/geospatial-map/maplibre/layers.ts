import type {
  FillLayerSpecification,
  LineLayerSpecification,
  RasterLayerSpecification,
} from "maplibre-gl";
import {
  RASTER_LAYERS,
  RASTER_SOURCES,
  VECTOR_LAYERS,
  VECTOR_SOURCES,
  type BasemapKey,
  type MapRasterKey,
} from "./types";

/**
 * These values intentionally mirror the existing Leaflet renderer:
 * RS boundary: #2563eb / #3b82f6 / 0.08
 * MS boundary: #7c3aed / #a78bfa / 0.08
 * RS selected: #1d4ed8 / #93c5fd / 0.30
 * MS selected: #6d28d9 / #a78bfa / 0.30
 */
export const VECTOR_LAYER_STYLES = {
  rsBoundaryFill: {
    id: VECTOR_LAYERS.rsBoundaryFill,
    type: "fill",
    source: VECTOR_SOURCES.rsBoundary,
    paint: {
      "fill-color": "#3b82f6",
      "fill-opacity": 0.08,
    },
  } satisfies FillLayerSpecification,

  rsBoundaryLine: {
    id: VECTOR_LAYERS.rsBoundaryLine,
    type: "line",
    source: VECTOR_SOURCES.rsBoundary,
    paint: {
      "line-color": "#2563eb",
      "line-width": 1.5,
      "line-opacity": 1,
    },
  } satisfies LineLayerSpecification,

  msBoundaryFill: {
    id: VECTOR_LAYERS.msBoundaryFill,
    type: "fill",
    source: VECTOR_SOURCES.msBoundary,
    paint: {
      "fill-color": "#a78bfa",
      "fill-opacity": 0.08,
    },
  } satisfies FillLayerSpecification,

  msBoundaryLine: {
    id: VECTOR_LAYERS.msBoundaryLine,
    type: "line",
    source: VECTOR_SOURCES.msBoundary,
    paint: {
      "line-color": "#7c3aed",
      "line-width": 1.5,
      "line-opacity": 1,
    },
  } satisfies LineLayerSpecification,

  selectedPlotFill: {
    id: VECTOR_LAYERS.selectedPlotFill,
    type: "fill",
    source: VECTOR_SOURCES.selectedPlot,
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "_layer_source"], "ms"],
        "#a78bfa",
        "#93c5fd",
      ],
      "fill-opacity": 0.3,
    },
  } satisfies FillLayerSpecification,

  selectedPlotLine: {
    id: VECTOR_LAYERS.selectedPlotLine,
    type: "line",
    source: VECTOR_SOURCES.selectedPlot,
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "_layer_source"], "ms"],
        "#6d28d9",
        "#1d4ed8",
      ],
      "line-width": 3,
      "line-opacity": 1,
    },
  } satisfies LineLayerSpecification,

  locationPoint: {
    id: VECTOR_LAYERS.locationPoint,
    type: "fill",
    source: VECTOR_SOURCES.location,
    paint: {
      "fill-color": "#2563eb",
      "fill-opacity": 0.9,
      "fill-outline-color": "#ffffff",
    },
  } satisfies FillLayerSpecification,

  accuracyFill: {
    id: VECTOR_LAYERS.accuracyFill,
    type: "fill",
    source: VECTOR_SOURCES.accuracy,
    paint: {
      "fill-color": "#2563eb",
      "fill-opacity": 0.08,
      "fill-outline-color": "#2563eb",
    },
  } satisfies FillLayerSpecification,

  accuracyLine: {
    id: VECTOR_LAYERS.accuracyLine,
    type: "line",
    source: VECTOR_SOURCES.accuracy,
    paint: {
      "line-color": "#2563eb",
      "line-width": 1.5,
      "line-opacity": 0.55,
    },
  } satisfies LineLayerSpecification,
} as const;

export const BASEMAP_RASTER_LAYERS: Record<BasemapKey, RasterLayerSpecification> = {
  osm: {
    id: RASTER_LAYERS.basemapOsm,
    type: "raster",
    source: RASTER_SOURCES.basemapOsm,
    paint: { "raster-opacity": 1 },
  },
  light: {
    id: RASTER_LAYERS.basemapLight,
    type: "raster",
    source: RASTER_SOURCES.basemapLight,
    paint: { "raster-opacity": 1 },
  },
  satellite: {
    id: RASTER_LAYERS.basemapSatellite,
    type: "raster",
    source: RASTER_SOURCES.basemapSatellite,
    paint: { "raster-opacity": 1 },
  },
  satellite2003: {
    id: RASTER_LAYERS.basemapSatellite2003,
    type: "raster",
    source: RASTER_SOURCES.basemapSatellite2003,
    paint: { "raster-opacity": 1 },
  },
};

/** Public defaults and authenticated defaults are inherited from the current Leaflet definitions. */
export const RAJUK_RASTER_LAYERS: Record<MapRasterKey, RasterLayerSpecification> = {
  dap: {
    id: RASTER_LAYERS.dap,
    type: "raster",
    source: RASTER_SOURCES.dap,
    paint: { "raster-opacity": 0.78 },
  },
  rs: {
    id: RASTER_LAYERS.rs,
    type: "raster",
    source: RASTER_SOURCES.rs,
    paint: { "raster-opacity": 0.78 },
  },
  ms: {
    id: RASTER_LAYERS.ms,
    type: "raster",
    source: RASTER_SOURCES.ms,
    paint: { "raster-opacity": 0.72 },
  },
  flood: {
    id: RASTER_LAYERS.flood,
    type: "raster",
    source: RASTER_SOURCES.flood,
    paint: { "raster-opacity": 0.78 },
  },
  boundary: {
    id: RASTER_LAYERS.boundary,
    type: "raster",
    source: RASTER_SOURCES.boundary,
    paint: { "raster-opacity": 0.78 },
  },
  transport: {
    id: RASTER_LAYERS.transport,
    type: "raster",
    source: RASTER_SOURCES.transport,
    paint: { "raster-opacity": 0.78 },
  },
};
