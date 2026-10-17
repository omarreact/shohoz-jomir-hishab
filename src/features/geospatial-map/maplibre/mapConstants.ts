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
  { key: "dap", label: "প্রস্তাবিত ভূমি ব্যবহার", description: "জমির পরিকল্পিত ব্যবহার ও অঞ্চল", color: "#16a34a", defaultVisible: true },
  { key: "rs", label: "আরএস মৌজা", description: "আরএস জরিপের মৌজা সীমানা ও দাগ", color: "#2563eb", defaultVisible: true },
  { key: "ms", label: "এমএস মৌজা", description: "এমএস জরিপের মৌজা সীমানা ও দাগ", color: "#7c3aed", defaultVisible: true },
  { key: "flood", label: "বন্যা ঝুঁকি", description: "বন্যা ঝুঁকির অনুমানভিত্তিক অঞ্চল", color: "#0891b2", defaultVisible: false },
  { key: "boundary", label: "পরিকল্পনা সীমানা", description: "এলাকাভিত্তিক পরিকল্পনার সীমা", color: "#ea580c", defaultVisible: false },
  { key: "transport", label: "সড়ক সংযোগ", description: "সড়ক ও যোগাযোগ নেটওয়ার্ক", color: "#dc2626", defaultVisible: false },
];

export const PUBLIC_LAYER_VISIBILITY: Record<LayerKey, boolean> = {
  dap: false,
  // Public visitors should see both cadastral Mauza tile layers by default.
  // Advanced layer management remains intended for authenticated users.
  rs: true,
  ms: true,
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
  light: "রাস্তার মানচিত্র",
  satellite: "স্যাটেলাইট",
  satellite2003: "স্যাটেলাইট ২০০৩",
};

export const GOOGLE_EARTH_2003_URL = "https://earth.google.com/web/@23.82810618,90.48911986,3.60010157a,3337.57801622d,35y,-0h,0t,0r/data=ChYqEAgBEgoyMDAzLTAxLTE3GAFCAggBOgMKATBCAggASg0I____________ARAA?authuser=0";
