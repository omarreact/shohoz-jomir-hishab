import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";

/**
 * Canonical urban planning map page.
 * MapLibre is the production WebGL rendering engine.
 * This route intentionally has no offline fallback or application shell UI.
 */
const MapLibreMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-screen w-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        নগর পরিকল্পনা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function UrbanPlanningMapPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapLibreMap />
      <MapVisitConsent />
    </div>
  );
}
