import type { BasemapKey, MapRasterKey } from "./types";

export type Tab = "search" | "layers" | "basemap" | "history" | "legend" | "settings";
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
  { key: "rs", label: "আরএস মৌজা", description: "আরএস জরিপের মৌজা সীমানা ও দাগ", color: "#151c1a", defaultVisible: true },
  { key: "ms", label: "এমএস মৌজা", description: "এমএস জরিপের মৌজা সীমানা ও দাগ", color: "#dc2626", defaultVisible: true },
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
  rs: 0.20,
  ms: 0.14,
  flood: 1,
  boundary: 1,
  transport: 1,
};

export const ADVANCED_LAYER_VISIBILITY = Object.fromEntries(LAYERS.map((layer) => [layer.key, layer.defaultVisible])) as Record<LayerKey, boolean>;
export const ADVANCED_LAYER_OPACITY = Object.fromEntries(LAYERS.map((layer) => [layer.key, layer.key === "ms" ? 0.14 : layer.key === "rs" ? 0.20 : 0.72])) as Record<LayerKey, number>;

// OSM: blocked by tile.openstreetmap.org policy (x-blocked).
// Carto light: usable after removing Leaflet {r} token.
// Default public basemap: Esri satellite (verified working in production).
export const PUBLIC_BASEMAP_KEYS: BasemapKey[] = ["satellite", "light", "sentinel2016", "satellite2003", "satellite2010", "satellite2020", "satellite2025"];
export const BASemap_LABELS: Record<BasemapKey, string> = {
  osm: "রাস্তার মানচিত্র",
  light: "রাস্তার মানচিত্র",
  satellite: "স্যাটেলাইট",
  sentinel2016: "Sentinel-2 ২০১৬ (১০ মি)",
  satellite2003: "NASA MODIS ২০০৩",
  satellite2010: "NASA MODIS ২০১০",
  satellite2020: "NASA MODIS ২০২০",
  satellite2025: "NASA MODIS ২০২৫",
};


/** Public imagery choices: NASA GIBS open imagery and EOxCloudless 2016 CC BY 4.0 only.
 * Other EOxCloudless vintages cannot be embedded in commercial LandBD without a license.
 * MODIS dates are specific daily observations, NOT annual cloud-free composites.
 */
export const FREE_IMAGERY_OPTIONS: Array<{
  key: BasemapKey;
  label: string;
  description: string;
  detail: string;
}> = [
  {
    key: "sentinel2016",
    label: "Sentinel-2 · ২০১৬",
    description: "EOxCloudless, প্রায় ১০ মিটার রেজোলিউশন",
    detail: "CC BY 4.0 · ২০১৬–১৭ এর মিশ্র চিত্র; সীমানা নির্ধারণে নয়",
  },
  ...([2003, 2010, 2020, 2025] as const).map((year) => ({
    key: `satellite${year}` as BasemapKey,
    label: `NASA MODIS · ${year}`,
    description: `${year}-01-17 তারিখের আঞ্চলিক চিত্র · প্রায় ২৫০ মিটার`,
    detail: "খুব কম বিস্তারিত; দাগ, ঘর বা মালিকানা যাচাই করা যাবে না",
  })),
];

export const GOOGLE_EARTH_2003_URL = "https://earth.google.com/web/";
export const GOOGLE_EARTH_HISTORICAL_DOCS_URL = "https://developers.google.com/maps/documentation/earth/historical-imagery";
