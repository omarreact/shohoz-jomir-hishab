export const RAJUK_SERVER = "https://masterplan.rajuk.gov.bd/server/rest/services";
export const RAJUK_DB = `${RAJUK_SERVER}/rajuk_db/Rajuk_dap_db/FeatureServer`;

export const RAJUK_LAYERS = {
  dap: { key: "dap", name: "DAP Proposed Landuse", service: `${RAJUK_SERVER}/Hosted/DAP_proposed_landuse/MapServer`, auth: false },
  rs: { key: "rs", name: "RS Mauza", service: `${RAJUK_SERVER}/Hosted/RS_Mauza_282Scale/MapServer`, auth: false },
  ms: { key: "ms", name: "MS Mauza", service: `${RAJUK_SERVER}/Hosted/MS_Mauza_Tiles_Final/MapServer`, auth: true },
  flood: { key: "flood", name: "Flood Overlay", service: `${RAJUK_SERVER}/Hosted/flood_overlay_lvl11_20/MapServer`, auth: true },
  boundary: { key: "boundary", name: "Overlay Boundary", service: `${RAJUK_SERVER}/Hosted/Overlay_Boundary_Tiles/MapServer`, auth: false },
  transport: { key: "transport", name: "Transport Network", service: `${RAJUK_SERVER}/Hosted/Transport_Network_Tiles/MapServer`, auth: false },
} as const;

export type RajukLayerKey = keyof typeof RAJUK_LAYERS;
export const RAJUK_LAYER_KEYS = Object.keys(RAJUK_LAYERS) as RajukLayerKey[];
export const RAJUK_LAYER_IDS = { district: 10, upazila: 9, mauza: 1, plot: 0 } as const;

export function getLayer(key: string) {
  if (!RAJUK_LAYER_KEYS.includes(key as RajukLayerKey)) throw new Error("Unknown RAJUK layer");
  return RAJUK_LAYERS[key as RajukLayerKey];
}
