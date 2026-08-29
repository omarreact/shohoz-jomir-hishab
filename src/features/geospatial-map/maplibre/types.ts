import type { GeoJSONSourceSpecification, RasterLayerSpecification, RasterSourceSpecification, SourceSpecification } from "maplibre-gl";

export type BasemapKey = "osm" | "light" | "satellite" | "satellite2003";
export type MapRasterKey = "dap" | "rs" | "ms" | "flood" | "boundary" | "transport";
export type VectorKey = "rsBoundary" | "msBoundary" | "selectedPlot" | "location" | "accuracy" | "rsPlotLabels" | "msPlotLabels";

export const RASTER_SOURCES = {
  basemapOsm: "basemap-osm", basemapLight: "basemap-light", basemapSatellite: "basemap-satellite", basemapSatellite2003: "basemap-satellite-2003",
  dap: "raster-dap", rs: "raster-rs", ms: "raster-ms", flood: "raster-flood", boundary: "raster-boundary", transport: "raster-transport",
} as const;

export const VECTOR_SOURCES = { rsBoundary: "vector-rs-boundary", msBoundary: "vector-ms-boundary", selectedPlot: "vector-selected-plot", location: "vector-location", accuracy: "vector-accuracy" } as const;

export const RASTER_LAYERS = {
  basemapOsm: "basemap-osm-layer", basemapLight: "basemap-light-layer", basemapSatellite: "basemap-satellite-layer", basemapSatellite2003: "basemap-satellite-2003-layer",
  dap: "raster-dap-layer", rs: "raster-rs-layer", ms: "raster-ms-layer", flood: "raster-flood-layer", boundary: "raster-boundary-layer", transport: "raster-transport-layer",
} as const;

export const VECTOR_LAYERS = {
  rsBoundaryFill: "vector-rs-boundary-fill", rsBoundaryLine: "vector-rs-boundary-line", msBoundaryFill: "vector-ms-boundary-fill", msBoundaryLine: "vector-ms-boundary-line",
  selectedPlotFill: "vector-selected-plot-fill", selectedPlotLine: "vector-selected-plot-line", locationPoint: "vector-location-point",
  rsPlotLabels: "vector-rs-plot-labels", msPlotLabels: "vector-ms-plot-labels", accuracyFill: "vector-accuracy-fill", accuracyLine: "vector-accuracy-line",
} as const;

export type MapSourceId = (typeof RASTER_SOURCES)[keyof typeof RASTER_SOURCES] | (typeof VECTOR_SOURCES)[keyof typeof VECTOR_SOURCES];
export type MapLayerId = (typeof RASTER_LAYERS)[keyof typeof RASTER_LAYERS] | (typeof VECTOR_LAYERS)[keyof typeof VECTOR_LAYERS];
export type MapLibreRasterSource = RasterSourceSpecification;
export type MapLibreGeoJsonSource = GeoJSONSourceSpecification;
export type MapLibreSource = SourceSpecification;
export type MapLibreRasterLayer = RasterLayerSpecification;

export const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection" as const, features: [] };
export const DAP_BOUNDS: [[number, number], [number, number]] = [[23.5527, 90.2079], [24.1033, 90.6041]];
export const HISTORIC_2003_CENTER: [number, number] = [23.82810618, 90.48911986];
export const HISTORIC_2003_ZOOM = 11;
export const MIN_ZOOM_FOR_VECTOR = 15;
export const GIS_REQUEST_TIMEOUT_MS = 15_000;
export const GIS_TIMEOUT_MESSAGE = "নেটওয়ার্ক ধীরগতির কারণে অনুরোধ বাতিল হয়েছে";

const transparentTile = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
export const BASEMAP_SOURCE_DEFINITIONS: Record<BasemapKey, RasterSourceSpecification> = {
  osm: { type: "raster", tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png", "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors", maxzoom: 21 },
  light: { type: "raster", tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"], tileSize: 256, attribution: "© OpenStreetMap © CARTO", maxzoom: 21 },
  satellite: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "© Esri", maxzoom: 21 },
  satellite2003: { type: "raster", tiles: ["https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2003-01-17/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"], tileSize: 256, attribution: "© NASA GIBS / MODIS Terra · 2003-01-17", maxzoom: 18 },
};
export const RAJUK_RASTER_SOURCE_DEFINITIONS: Record<MapRasterKey, RasterSourceSpecification> = {
  dap: { type: "raster", tiles: ["/api/rajuk/tile/dap/{z}/{y}/{x}"], tileSize: 256, maxzoom: 21 }, rs: { type: "raster", tiles: ["/api/rajuk/tile/rs/{z}/{y}/{x}"], tileSize: 256, maxzoom: 21 }, ms: { type: "raster", tiles: ["/api/rajuk/tile/ms/{z}/{y}/{x}"], tileSize: 256, maxzoom: 21 }, flood: { type: "raster", tiles: ["/api/rajuk/tile/flood/{z}/{y}/{x}"], tileSize: 256, maxzoom: 21 }, boundary: { type: "raster", tiles: ["/api/rajuk/tile/boundary/{z}/{y}/{x}"], tileSize: 256, maxzoom: 21 }, transport: { type: "raster", tiles: ["/api/rajuk/tile/transport/{z}/{y}/{x}"], tileSize: 256, maxzoom: 21 },
};
export const TRANSPARENT_TILE_URL = transparentTile;
