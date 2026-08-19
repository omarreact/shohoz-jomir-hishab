export type ServiceKind = "feature" | "tile" | "external";

export interface DataMonitorService {
  id: string;
  name: string;
  kind: ServiceKind;
  endpoint: string;
  verified: boolean;
  note: string;
}

const RAJUK_FEATURE_BASE = "https://masterplan.rajuk.gov.bd/server/rest/services/rajuk_db/Rajuk_dap_db/FeatureServer";
const RAJUK_HOSTED_BASE = "https://masterplan.rajuk.gov.bd/server/rest/services/Hosted";

export const DATA_MONITOR_SERVICES: readonly DataMonitorService[] = [
  { id: "rs-plots", name: "RS Plots", kind: "feature", endpoint: `${RAJUK_FEATURE_BASE}/0`, verified: true, note: "Real plot attributes + polygon geometry" },
  { id: "rs-mouza", name: "RS Mauza", kind: "feature", endpoint: `${RAJUK_FEATURE_BASE}/1`, verified: true, note: "Mauza hierarchy records" },
  { id: "upazila", name: "Upazila / Thana", kind: "feature", endpoint: `${RAJUK_FEATURE_BASE}/9`, verified: true, note: "Administrative hierarchy" },
  { id: "district", name: "District", kind: "feature", endpoint: `${RAJUK_FEATURE_BASE}/10`, verified: true, note: "Administrative hierarchy" },
  { id: "dap-landuse", name: "DAP Proposed Landuse", kind: "tile", endpoint: `${RAJUK_HOSTED_BASE}/DAP_proposed_landuse/MapServer`, verified: true, note: "Cached visualization tiles" },
  { id: "rs-mauza-tiles", name: "RS Mauza 282 Scale", kind: "tile", endpoint: `${RAJUK_HOSTED_BASE}/RS_Mauza_282Scale/MapServer`, verified: true, note: "Cached visualization tiles" },
  { id: "ms-mauza-tiles", name: "MS Mauza", kind: "tile", endpoint: `${RAJUK_HOSTED_BASE}/MS_Mauza_Tiles_Final/MapServer`, verified: true, note: "Cached visualization tiles; token required" },
  { id: "flood", name: "Flood Overlay", kind: "tile", endpoint: `${RAJUK_HOSTED_BASE}/flood_overlay_lvl11_20/MapServer`, verified: true, note: "Cached visualization tiles; token required" },
  { id: "overlay-boundary", name: "Overlay Boundary", kind: "tile", endpoint: `${RAJUK_HOSTED_BASE}/Overlay_Boundary_Tiles/MapServer`, verified: true, note: "Cached visualization tiles" },
  { id: "transport", name: "Transport Network", kind: "tile", endpoint: `${RAJUK_HOSTED_BASE}/Transport_Network_Tiles/MapServer`, verified: true, note: "Cached visualization tiles" },
  { id: "elevation", name: "Open-Meteo Elevation", kind: "external", endpoint: "https://api.open-meteo.com/v1/elevation", verified: true, note: "External elevation service" },
];

export const VERIFIED_RAJSUK_SERVICE_IDS = DATA_MONITOR_SERVICES.filter((service) => service.id !== "elevation").map((service) => service.id);
