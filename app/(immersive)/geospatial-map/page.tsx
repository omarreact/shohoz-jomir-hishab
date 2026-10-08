import GeospatialMapClient from "@/src/features/geospatial-map/components/GeospatialMapClient";

/**
 * Primary public GIS map.
 *
 * The route itself stays public so visitors can use the satellite/OSM map and
 * plot identify experience. Authenticated users automatically receive the
 * advanced layer/control experience inside GeospatialMapClient/MapLibreMap.
 */
export default function UrbanPlanningMapPage() {
  return <GeospatialMapClient />;
}
