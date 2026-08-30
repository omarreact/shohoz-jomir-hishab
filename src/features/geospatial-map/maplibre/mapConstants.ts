import type { BasemapKey, MapRasterKey } from "./types";

export type Tab = "layers" | "basemap" | "results";
export type LayerKey = MapRasterKey;
export type LayerDef = {
  key: LayerKey;
  label: string;
  description: string;
  color: string;
  defaultVisible: boolean;
};

export const LAYERS: LayerDef[] = [
  { key: "dap", label: "DAP Proposed Landuse", description: "Proposed land-use zones", color: "#16a34a", defaultVisible: true },
  { key: "rs", label: "RS Mauza tiles", description: "Hosted/RS_Mauza_282Scale MapServer", color: "#2563eb", defaultVisible: true },
  { key: "ms", label: "MS Mauza tiles", description: "Hosted/MS_Mauza_Tiles_Final MapServer", color: "#7c3aed", defaultVisible: true },
  { key: "flood", label: "Flood Overlay", description: "Flood susceptibility overlay", color: "#0891b2", defaultVisible: false },
  { key: "boundary", label: "Overlay Boundary", description: "Planning boundary tiles", color: "#ea580c", defaultVisible: false },
  { key: "transport", label: "Transport Network", description: "Transport network tiles", color: "#dc2626", defaultVisible: false },
];

export const PUBLIC_LAYER_VISIBILITY: Record<LayerKey, boolean> = {
  dap: false,
  // RAJUK raster proxy currently returns empty GIFs (x-proxy-source: landbd-rajuk-empty).
  // Keep off by default so satellite basemap remains visible; vectors still load at zoom 15+.
  rs: false,
  ms: false,
  flood: false,
  boundary: false,
  transport: false,
};

export const PUBLIC_LAYER_OPACITY: Record<LayerKey, number> = {
  dap: 1,
  rs: 1,
  ms: 1,
  flood: 1,
  boundary: 1,
  transport: 1,
};

export const ADVANCED_LAYER_VISIBILITY = Object.fromEntries(LAYERS.map((layer) => [layer.key, layer.defaultVisible])) as Record<LayerKey, boolean>;
export const ADVANCED_LAYER_OPACITY = Object.fromEntries(LAYERS.map((layer) => [layer.key, layer.key === "ms" ? 0.72 : 0.78])) as Record<LayerKey, number>;

// OSM: blocked by tile.openstreetmap.org policy (x-blocked).
// Carto light: usable after removing Leaflet {r} token.
// Default public basemap: Esri satellite (verified working in production).
export const PUBLIC_BASEMAP_KEYS: BasemapKey[] = ["satellite", "light"];
export const BASemap_LABELS: Record<BasemapKey, string> = {
  osm: "রাস্তার মানচিত্র",
  light: "Light",
  satellite: "স্যাটেলাইট",
  satellite2003: "স্যাটেলাইট ২০০৩",
};

export const GOOGLE_EARTH_2003_URL = "https://earth.google.com/web/@23.82810618,90.48911986,3.60010157a,3337.57801622d,35y,-0h,0t,0r/data=ChYqEAgBEgoyMDAzLTAxLTE3GAFCAggBOgMKATBCAggASg0I____________ARAA?authuser=0";
