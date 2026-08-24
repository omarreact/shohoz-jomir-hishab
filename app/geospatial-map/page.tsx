"use client";

import dynamic from "next/dynamic";

/**
 * Canonical urban planning map page.
 * Merges the former Geospatial + LIOS map entry points into one experience.
 * /lios-map redirects here.
 */
const GeospatialMap = dynamic(
  () => import("@/src/features/geospatial-map/components/GeospatialMap"),
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
    <div className="h-[calc(100vh-5rem)] w-full min-h-[560px]">
      <GeospatialMap />
    </div>
  );
}
