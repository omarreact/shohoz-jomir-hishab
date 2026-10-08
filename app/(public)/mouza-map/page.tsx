import MouzaMapClient from "@/src/features/geospatial-map/components/MouzaMapClient";
import MouzaMapViewer from "@/src/features/mouza-map/MouzaMapViewer";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";

export default function MouzaMapPage() {
  return (
    <DynamicPageGate pageId="/mouza-map" featureName="মৌজা ম্যাপ (PDF)">
      <MouzaMapViewer />
      <MouzaMapClient />
    </DynamicPageGate>
  );
}
