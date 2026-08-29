import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";
import OfflineMapNotice from "@/src/shared/components/OfflineMapNotice";

/**
 * Canonical urban planning map page.
 * MapLibre is now the production WebGL rendering engine.
 */
const MapLibreMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[calc(100vh-5rem)] place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        নগর পরিকল্পনা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function UrbanPlanningMapPage() {
  return (
    <div className="relative h-full min-h-screen w-full">
      <MapLibreMap />
      <OfflineMapNotice />
      <MapVisitConsent />
    </div>
  );
}
