export interface ApiRow {
  name: string;
  endpoint: string;
  type: "Rajuk" | "Firebase" | "External";
  status: "active" | "unknown" | "failed";
  note: string;
}

export const API_REGISTRY: ApiRow[] = [
  {
    name: "RS Plots (FeatureServer/0)",
    endpoint: "/api/unified?include=plots&limit=1",
    type: "Rajuk",
    status: "active",
    note: "RS Plot geometry + attributes",
  },
  {
    name: "DAP Landuse (MapServer/0)",
    endpoint: "/api/unified?include=landuse&limit=1",
    type: "Rajuk",
    status: "active",
    note: "Landuse zone intersection",
  },
  {
    name: "Flood Overlay (MapServer/0)",
    endpoint: "/api/unified?include=flood&limit=1",
    type: "Rajuk",
    status: "active",
    note: "Flood risk zone intersection",
  },
  {
    name: "MS Mauza Tiles",
    endpoint: "Hosted/MS_Mauza_Tiles_Final",
    type: "Rajuk",
    status: "active",
    note: "MS survey raster tiles",
  },
  {
    name: "RS Mauza Tiles",
    endpoint: "Hosted/RS_Mauza_Tiles_Final",
    type: "Rajuk",
    status: "active",
    note: "RS survey raster tiles",
  },
  {
    name: "RS Mauza 282 Scale",
    endpoint: "Hosted/RS_Mauza_282Scale",
    type: "Rajuk",
    status: "active",
    note: "High-res RS tiles (zoom 17+)",
  },
  {
    name: "DAP Landuse Tiles",
    endpoint: "Hosted/DAP_proposed_landuse",
    type: "Rajuk",
    status: "active",
    note: "Raster landuse layer",
  },
  {
    name: "Overlay Boundary Tiles",
    endpoint: "Hosted/Overlay_Boundary_Tiles",
    type: "Rajuk",
    status: "active",
    note: "Rajuk administrative boundary",
  },
  {
    name: "Rajuk Zone Subzone Tiles",
    endpoint: "Hosted/Rajuk_Zone_Subzone_Tiles",
    type: "Rajuk",
    status: "active",
    note: "DAP zone & subzone layer",
  },
  {
    name: "Transport Network Tiles",
    endpoint: "Hosted/Transport_Network_Tiles",
    type: "Rajuk",
    status: "active",
    note: "Proposed road network",
  },
  {
    name: "Flood Overlay Tiles",
    endpoint: "Hosted/flood_overlay_lvl11_20",
    type: "Rajuk",
    status: "active",
    note: "Visual flood zone overlay",
  },
  {
    name: "Landmarks Tiles",
    endpoint: "Hosted/Major_Landmarks_V2_TILES",
    type: "Rajuk",
    status: "active",
    note: "Major landmarks",
  },
  {
    name: "POI Proposed Tiles",
    endpoint: "Hosted/POI_Proposed_Tiles",
    type: "Rajuk",
    status: "active",
    note: "Proposed points of interest",
  },
  {
    name: "Rajuk Token",
    endpoint: "/api/rajuk-token",
    type: "Firebase",
    status: "active",
    note: "Token from Firebase config/rajuk_api",
  },
  {
    name: "Open-Meteo Elevation",
    endpoint:
      "https://api.open-meteo.com/v1/elevation?latitude=23.8103&longitude=90.4125",
    type: "External",
    status: "active",
    note: "Ground elevation at lat/lng",
  },
  {
    name: "Porcha JSON",
    endpoint: "/api/porcha",
    type: "Firebase",
    status: "active",
    note: "Porcha data served as static JSON",
  },
];
