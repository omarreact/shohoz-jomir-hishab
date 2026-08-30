"use client";

import dynamic from "next/dynamic";

const MapLibreMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[50vh] w-full flex-1 place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function GeospatialMapClient() {
  return (
    <div className="relative min-h-[min(70vh,720px)] w-full flex-1 overflow-hidden md:min-h-[min(75vh,900px)]">
      <MapLibreMap />
    </div>
  );
}
