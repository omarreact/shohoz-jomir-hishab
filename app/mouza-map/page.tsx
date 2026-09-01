import MouzaMapClient from "@/src/features/geospatial-map/components/MouzaMapClient";
import MouzaMapViewer from "@/src/features/mouza-map/MouzaMapViewer";

/**
 * Browser/provider layer is intentionally separate from the existing
 * authenticated export pipeline. The existing export APIs remain untouched.
 */
export default function MouzaMapPage() {
  return <><MouzaMapViewer /><MouzaMapClient /></>;
}
