"use client";

import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";

const MapLibreMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-dvh w-full place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        নগর পরিকল্পনা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

/** Full-viewport map host — no app chrome (navbar/footer). */
export default function GeospatialMapClient() {
  return (
    <div className="fixed inset-0 z-0 h-dvh w-full overflow-hidden bg-slate-900">
      <MapLibreMap />
      <MapVisitConsent />
    </div>
  );
}
