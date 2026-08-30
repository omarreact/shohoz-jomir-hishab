import MouzaMapClient from "@/src/features/geospatial-map/components/MouzaMapClient";

/**
 * Dedicated Mouza/4K export map route.
 * Intentionally bypasses the shared offline/application shell UI.
 */
export default function MouzaMapPage() {
  return <MouzaMapClient />;
}
