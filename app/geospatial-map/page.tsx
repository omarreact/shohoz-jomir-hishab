import GeospatialMapClient from "@/src/features/geospatial-map/components/GeospatialMapClient";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";

export default function UrbanPlanningMapPage() {
  return (
    <DynamicPageGate pageId="/geospatial-map" featureName="GIS ডাইনামিক ম্যাপ">
      <GeospatialMapClient />
    </DynamicPageGate>
  );
}
