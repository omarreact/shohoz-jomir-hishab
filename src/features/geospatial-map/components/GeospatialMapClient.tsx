"use client";

import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";

const MapLibreMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[50vh] w-full place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        নগর পরিকল্পনা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

/**
 * Full-viewport GIS host shared by visitors and logged-in users.
 * Height fills under sticky nav; bottom padding clears the mobile floating nav.
 */
export default function GeospatialMapClient() {
  return (
    <div
      className="relative w-full flex-1 overflow-hidden pb-[4.75rem] md:pb-0"
      style={{
        minHeight: "50vh",
        height: "calc(100dvh - 3.75rem)",
        maxHeight: "calc(100dvh - 3.75rem)",
      }}
    >
      <MapLibreMap />
      <MapVisitConsent />
    </div>
  );
}
