import { LayerDefinition, LayerRegistry } from "./registry";

export const basemaps: LayerDefinition[] = [
  {
    id: "google-standard",
    displayName: "গুগল ম্যাপ (Standard)",
    type: "basemap",
    sourceUrl: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    defaultVisible: false,
    maxZoom: 22,
    maxNativeZoom: 20,
  },
  {
    id: "google-satellite",
    displayName: "গুগল স্যাটেলাইট (Satellite)",
    type: "basemap",
    sourceUrl: "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    defaultVisible: true,
    maxZoom: 22,
    maxNativeZoom: 20,
  },
  {
    id: "esri-satellite",
    displayName: "Esri স্যাটেলাইট (Esri Imagery)",
    type: "basemap",
    sourceUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    defaultVisible: false,
    maxZoom: 22,
    maxNativeZoom: 19,
  },
  {
    id: "osm",
    displayName: "OpenStreetMap",
    type: "basemap",
    sourceUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    defaultVisible: false,
    maxZoom: 22,
    maxNativeZoom: 19,
  }
];

LayerRegistry.registerMultiple(basemaps);
