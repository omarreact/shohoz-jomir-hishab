import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";
import MouzaMapPageTabs from "@/src/features/geospatial-map/components/MouzaMapPageTabs";
import DynamicPageGate from "@/src/shared/components/DynamicPageGate";

/** Never expose the sample-file browser as an official production record source. */
export default function MouzaMapPage() {
  return (
    <DynamicPageGate pageId="/mouza-map" featureName="মৌজা ম্যাপ">
      <ServicePaywallGate serviceId="mouza-map">
        <MouzaMapPageTabs demoBrowserEnabled={process.env.NODE_ENV !== "production"} />
      </ServicePaywallGate>
    </DynamicPageGate>
  );
}
