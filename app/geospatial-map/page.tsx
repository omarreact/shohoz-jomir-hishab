import GeospatialMapClient from "@/src/features/geospatial-map/components/GeospatialMapClient";
import RequireLogin from "@/src/modules/auth/components/RequireLogin";

/**
 * Canonical urban planning map page.
 * MapLibre is the production WebGL rendering engine.
 * Visitors must log in; members and admins can use the map.
 */
export default function UrbanPlanningMapPage() {
  return (
    <RequireLogin featureName="GIS মানচিত্র">
      <GeospatialMapClient />
    </RequireLogin>
  );
}
