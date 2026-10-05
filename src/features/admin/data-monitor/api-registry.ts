export type ServiceKind = "feature" | "tile" | "external";

export interface DataMonitorService {
  id: string;
  name: string;
  kind: ServiceKind;
  /** Public/runtime endpoint used by the LandBD application. */
  endpoint: string;
  verified: boolean;
  note: string;
}

const FEATURE_PROBE = "?where=1%3D1&outFields=*&resultRecordCount=1&returnGeometry=false";

export const DATA_MONITOR_SERVICES: readonly DataMonitorService[] = [
  {
    id: "rs-plots",
    name: "RS Plots",
    kind: "feature",
    endpoint: `/api/rajuk/0${FEATURE_PROBE}`,
    verified: true,
    note: "LandBD FeatureServer proxy — plot attributes and polygon geometry",
  },
  {
    id: "rs-mouza",
    name: "RS Mauza",
    kind: "feature",
    endpoint: `/api/rajuk/1${FEATURE_PROBE}`,
    verified: true,
    note: "LandBD FeatureServer proxy — mouza hierarchy records",
  },
  {
    id: "upazila",
    name: "Upazila / Thana",
    kind: "feature",
    endpoint: `/api/rajuk/9${FEATURE_PROBE}`,
    verified: true,
    note: "LandBD FeatureServer proxy — administrative hierarchy",
  },
  {
    id: "district",
    name: "District",
    kind: "feature",
    endpoint: `/api/rajuk/10${FEATURE_PROBE}`,
    verified: true,
    note: "LandBD FeatureServer proxy — administrative hierarchy",
  },
  {
    id: "dap-landuse",
    name: "DAP Proposed Landuse",
    kind: "tile",
    endpoint: "/api/rajuk/tile/dap/{z}/{y}/{x}",
    verified: true,
    note: "LandBD allow-listed tile proxy",
  },
  {
    id: "rs-mauza-tiles",
    name: "RS Mauza 282 Scale",
    kind: "tile",
    endpoint: "/api/rajuk/tile/rs/{z}/{y}/{x}",
    verified: true,
    note: "LandBD allow-listed tile proxy",
  },
  {
    id: "ms-mauza-tiles",
    name: "MS Mauza",
    kind: "tile",
    endpoint: "/api/rajuk/tile/ms/{z}/{y}/{x}",
    verified: true,
    note: "LandBD allow-listed tile proxy; upstream authentication handled server-side",
  },
  {
    id: "flood",
    name: "Flood Overlay",
    kind: "tile",
    endpoint: "/api/rajuk/tile/flood/{z}/{y}/{x}",
    verified: true,
    note: "LandBD allow-listed tile proxy; upstream authentication handled server-side",
  },
  {
    id: "overlay-boundary",
    name: "Overlay Boundary",
    kind: "tile",
    endpoint: "/api/rajuk/tile/boundary/{z}/{y}/{x}",
    verified: true,
    note: "LandBD allow-listed tile proxy",
  },
  {
    id: "transport",
    name: "Transport Network",
    kind: "tile",
    endpoint: "/api/rajuk/tile/transport/{z}/{y}/{x}",
    verified: true,
    note: "LandBD allow-listed tile proxy",
  },
  {
    id: "elevation",
    name: "Open-Meteo Elevation",
    kind: "external",
    endpoint: "https://api.open-meteo.com/v1/elevation?latitude=23.8103&longitude=90.4125",
    verified: true,
    note: "External elevation service",
  },
];

export const VERIFIED_RAJUK_SERVICE_IDS = DATA_MONITOR_SERVICES
  .filter((service) => service.id !== "elevation")
  .map((service) => service.id);
