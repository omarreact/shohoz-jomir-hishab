import MouzaMapClient from "@/src/features/geospatial-map/components/MouzaMapClient";
import MouzaMapViewer from "@/src/features/mouza-map/MouzaMapViewer";
import RequireLogin from "@/src/modules/auth/components/RequireLogin";

/**
 * Mouza map browser / download. Members and admins only.
 */
export default function MouzaMapPage() {
  return (
    <RequireLogin featureName="ডাউনলোড মৌজা ম্যাপ">
      <>
        <MouzaMapViewer />
        <MouzaMapClient />
      </>
    </RequireLogin>
  );
}
