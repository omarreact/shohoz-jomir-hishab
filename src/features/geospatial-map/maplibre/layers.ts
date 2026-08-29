import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  RasterLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";
import {
  RASTER_LAYERS,
  RASTER_SOURCES,
  VECTOR_LAYERS,
  VECTOR_SOURCES,
  type BasemapKey,
  type MapRasterKey,
} from "./types";

export const VECTOR_LAYER_STYLES = {
  rsBoundaryFill: {
    id: VECTOR_LAYERS.rsBoundaryFill,
    type: "fill",
    source: VECTOR_SOURCES.rsBoundary,
    paint: { "fill-color": "#bfdbfe", "fill-opacity": 0.045 },
  } satisfies FillLayerSpecification,
  rsBoundaryLine: {
    id: VECTOR_LAYERS.rsBoundaryLine,
    type: "line",
    source: VECTOR_SOURCES.rsBoundary,
    paint: { "line-color": "#2563eb", "line-width": 1.5, "line-opacity": 0.8 },
  } satisfies LineLayerSpecification,
  msBoundaryFill: {
    id: VECTOR_LAYERS.msBoundaryFill,
    type: "fill",
    source: VECTOR_SOURCES.msBoundary,
    paint: { "fill-color": "#ddd6fe", "fill-opacity": 0.045 },
  } satisfies FillLayerSpecification,
  msBoundaryLine: {
    id: VECTOR_LAYERS.msBoundaryLine,
    type: "line",
    source: VECTOR_SOURCES.msBoundary,
    paint: { "line-color": "#7c3aed", "line-width": 1.5, "line-opacity": 0.8 },
  } satisfies LineLayerSpecification,
  rsPlotLabels: {
    id: VECTOR_LAYERS.rsPlotLabels,
    type: "symbol",
    source: VECTOR_SOURCES.rsBoundary,
    layout: {
      "text-field": ["coalesce", ["get", "rs_plot_no"], ["get", "plot_no"], ""],
      "text-size": 11,
      "text-anchor": "center",
      "text-allow-overlap": false,
      "symbol-placement": "point",
    },
    paint: { "text-color": "#1e3a8a", "text-halo-color": "#ffffff", "text-halo-width": 1.25, "text-halo-blur": 0.15 },
  } satisfies SymbolLayerSpecification,
  msPlotLabels: {
    id: VECTOR_LAYERS.msPlotLabels,
    type: "symbol",
    source: VECTOR_SOURCES.msBoundary,
    layout: {
      "text-field": ["coalesce", ["get", "ms_plot_no"], ["get", "plot_no"], ""],
      "text-size": 11,
      "text-anchor": "center",
      "text-allow-overlap": false,
      "symbol-placement": "point",
    },
    paint: { "text-color": "#5b21b6", "text-halo-color": "#ffffff", "text-halo-width": 1.25, "text-halo-blur": 0.15 },
  } satisfies SymbolLayerSpecification,
  selectedPlotFill: {
    id: VECTOR_LAYERS.selectedPlotFill,
    type: "fill",
    source: VECTOR_SOURCES.selectedPlot,
    paint: { "fill-color": ["case", ["==", ["get", "_layer_source"], "ms"], "#a78bfa", "#93c5fd"], "fill-opacity": 0.3 },
  } satisfies FillLayerSpecification,
  selectedPlotLine: {
    id: VECTOR_LAYERS.selectedPlotLine,
    type: "line",
    source: VECTOR_SOURCES.selectedPlot,
    paint: { "line-color": ["case", ["==", ["get", "_layer_source"], "ms"], "#6d28d9", "#1d4ed8"], "line-width": 3, "line-opacity": 1 },
  } satisfies LineLayerSpecification,
  locationPoint: {
    id: VECTOR_LAYERS.locationPoint,
    type: "circle",
    source: VECTOR_SOURCES.location,
    paint: { "circle-color": "#2563eb", "circle-radius": 6, "circle-opacity": 0.9, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 },
  } satisfies CircleLayerSpecification,
  accuracyFill: {
    id: VECTOR_LAYERS.accuracyFill,
    type: "fill",
    source: VECTOR_SOURCES.accuracy,
    paint: { "fill-color": "#2563eb", "fill-opacity": 0.08, "fill-outline-color": "#2563eb" },
  } satisfies FillLayerSpecification,
  accuracyLine: {
    id: VECTOR_LAYERS.accuracyLine,
    type: "line",
    source: VECTOR_SOURCES.accuracy,
    paint: { "line-color": "#2563eb", "line-width": 1.5, "line-opacity": 0.55 },
  } satisfies LineLayerSpecification,
} as const;

export const BASEMAP_RASTER_LAYERS: Record<BasemapKey, RasterLayerSpecification> = {
  osm: { id: RASTER_LAYERS.basemapOsm, type: "raster", source: RASTER_SOURCES.basemapOsm, paint: { "raster-opacity": 1 } },
  light: { id: RASTER_LAYERS.basemapLight, type: "raster", source: RASTER_SOURCES.basemapLight, paint: { "raster-opacity": 1 } },
  satellite: { id: RASTER_LAYERS.basemapSatellite, type: "raster", source: RASTER_SOURCES.basemapSatellite, paint: { "raster-opacity": 1 } },
  satellite2003: { id: RASTER_LAYERS.basemapSatellite2003, type: "raster", source: RASTER_SOURCES.basemapSatellite2003, paint: { "raster-opacity": 1 } },
};

export const RAJUK_RASTER_LAYERS: Record<MapRasterKey, RasterLayerSpecification> = {
  dap: { id: RASTER_LAYERS.dap, type: "raster", source: RASTER_SOURCES.dap, paint: { "raster-opacity": 0.78 } },
  rs: { id: RASTER_LAYERS.rs, type: "raster", source: RASTER_SOURCES.rs, paint: { "raster-opacity": 0.78 } },
  ms: { id: RASTER_LAYERS.ms, type: "raster", source: RASTER_SOURCES.ms, paint: { "raster-opacity": 0.72 } },
  flood: { id: RASTER_LAYERS.flood, type: "raster", source: RASTER_SOURCES.flood, paint: { "raster-opacity": 0.78 } },
  boundary: { id: RASTER_LAYERS.boundary, type: "raster", source: RASTER_SOURCES.boundary, paint: { "raster-opacity": 0.78 } },
  transport: { id: RASTER_LAYERS.transport, type: "raster", source: RASTER_SOURCES.transport, paint: { "raster-opacity": 0.78 } },
};
