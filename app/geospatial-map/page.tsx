import GeospatialMapClient from "@/src/features/geospatial-map/components/GeospatialMapClient";

/**
 * Canonical urban planning map page.
 * MapLibre is the production WebGL rendering engine.
 * This route intentionally has no offline fallback or application shell UI.
 */
export default function UrbanPlanningMapPage() {
  return <GeospatialMapClient />;
}
