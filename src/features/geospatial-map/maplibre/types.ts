import type { LngLatTuple, RasterSourceSpecification } from "maplibre-gl";

export type BasemapKey = "osm" | "light" | "satellite" | "satellite2003";
export type MapRasterKey = "dap" | "rs" | "ms" | "flood" | "boundary" | "transport";

export const RASTER_SOURCES = {
  basemapOsm: "basemap-osm",
  basemapLight: "basemap-light",
  basemapSatellite: "basemap-satellite",
  basemapSatellite2003: "basemap-satellite-2003",
  dap: "rajuk-dap",
  rs: "rajuk-rs",
  ms: "rajuk-ms",
  flood: "rajuk-flood",
  boundary: "rajuk-boundary",
  transport: "rajuk-transport",
} as const;

export const RASTER_LAYERS = {
  basemapOsm: "layer-basemap-osm",
  basemapLight: "layer-basemap-light",
  basemapSatellite: "layer-basemap-satellite",
  basemapSatellite2003: "layer-basemap-satellite-2003",
  dap: "layer-dap",
  rs: "layer-rs",
  ms: "layer-ms",
  flood: "layer-flood",
  boundary: "layer-boundary",
  transport: "layer-transport",
} as const;

export const VECTOR_SOURCES = {
  rsBoundary: "vector-rs-boundary",
  msBoundary: "vector-ms-boundary",
  selectedPlot: "vector-selected-plot",
  location: "vector-location",
  accuracy: "vector-accuracy",
} as const;

export const VECTOR_LAYERS = {
  rsBoundaryFill: "layer-rs-boundary-fill",
  rsBoundaryLine: "layer-rs-boundary-line",
  msBoundaryFill: "layer-ms-boundary-fill",
  msBoundaryLine: "layer-ms-boundary-line",
  selectedPlotFill: "layer-selected-plot-fill",
  selectedPlotLine: "layer-selected-plot-line",
  accuracyFill: "layer-accuracy-fill",
  accuracyLine: "layer-accuracy-line",
  locationPoint: "layer-location-point",
} as const;

export const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [] as never[],
};

/** Existing Leaflet map extent, retained as [south, west], [north, east]. */
export const DAP_BOUNDS: [[number, number], [number, number]] = [
  [23.5527, 90.2079],
  [24.1033, 90.6041],
];

/** Historical map center in MapLibre/GeoJSON order: [longitude, latitude]. */
export const HISTORIC_2003_CENTER: LngLatTuple = [90.48911986, 23.82810618];
/** Closer default so visitors reach plot-vector zoom with less pinching. */
export const HISTORIC_2003_ZOOM = 14;
/** Load RS/MS plot polygons from this zoom (was 15 — too high on mobile). */
export const MIN_ZOOM_FOR_VECTOR = 14;
export const GIS_REQUEST_TIMEOUT_MS = 15_000;
export const GIS_TIMEOUT_MESSAGE = "নেটওয়ার্ক ধীরগতির কারণে অনুরোধ বাতিল হয়েছে";

const transparentTile =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export const BASEMAP_SOURCE_DEFINITIONS: Record<BasemapKey, RasterSourceSpecification> = {
  osm: {
    type: "raster",
    tiles: [
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    tileSize: 256,
    attribution: "© OpenStreetMap",
    maxzoom: 19,
  },
  light: {
    type: "raster",
    tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
    tileSize: 256,
    attribution: "© CARTO",
    maxzoom: 20,
  },
  satellite: {
    type: "raster",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    attribution: "© Esri",
    maxzoom: 19,
  },
  satellite2003: {
    type: "raster",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    tileSize: 256,
    attribution: "© Esri (historic focus)",
    maxzoom: 19,
  },
};

/** RAJUK raster tiles via LandBD proxy (may return empty GIF when upstream fails). */
export const RAJUK_RASTER_SOURCE_DEFINITIONS: Record<MapRasterKey, RasterSourceSpecification> = {
  dap: {
    type: "raster",
    tiles: ["/api/rajuk/tile/dap/{z}/{y}/{x}"],
    tileSize: 256,
    attribution: "RAJUK",
    maxzoom: 19,
  },
  rs: {
    type: "raster",
    tiles: ["/api/rajuk/tile/rs/{z}/{y}/{x}"],
    tileSize: 256,
    attribution: "RAJUK RS",
    maxzoom: 19,
  },
  ms: {
    type: "raster",
    tiles: ["/api/rajuk/tile/ms/{z}/{y}/{x}"],
    tileSize: 256,
    attribution: "RAJUK MS",
    maxzoom: 19,
  },
  flood: {
    type: "raster",
    tiles: ["/api/rajuk/tile/flood/{z}/{y}/{x}"],
    tileSize: 256,
    attribution: "RAJUK",
    maxzoom: 19,
  },
  boundary: {
    type: "raster",
    tiles: ["/api/rajuk/tile/boundary/{z}/{y}/{x}"],
    tileSize: 256,
    attribution: "RAJUK",
    maxzoom: 19,
  },
  transport: {
    type: "raster",
    tiles: ["/api/rajuk/tile/transport/{z}/{y}/{x}"],
    tileSize: 256,
    attribution: "RAJUK",
    maxzoom: 19,
  },
};

// Keep transparent placeholder for failed tile debugging if needed.
void transparentTile;
