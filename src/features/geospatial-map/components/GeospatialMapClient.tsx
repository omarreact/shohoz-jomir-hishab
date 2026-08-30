"use client";

import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";

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

export default function GeospatialMapClient() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapLibreMap />
      <MapVisitConsent />
    </div>
  );
}
