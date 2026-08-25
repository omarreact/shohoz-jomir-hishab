/** Shared Leaflet tile performance options for GeospatialMap */
export const MAP_TILE_OPTS = {
  maxZoom: 21,
  crossOrigin: true as const,
  attribution: "LandBD / RAJUK",
  updateWhenIdle: true,
  keepBuffer: 2,
  errorTileUrl:
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
};

export const PUBLIC_TILE_KEYS = ["rs", "ms"] as const;
export const EXTENT_DEBOUNCE_MS = 550;
export const COACH_STORAGE_KEY = "landbd-map-coach-v1";

export function extentFeatureLimit(zoom: number): string {
  if (zoom >= 18) return "400";
  if (zoom >= 16) return "250";
  return "150";
}
