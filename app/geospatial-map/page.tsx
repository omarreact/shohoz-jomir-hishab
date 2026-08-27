"use client";

import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";

/**
 * Canonical urban planning map page.
 * Merges the former Geospatial + LIOS map entry points into one experience.
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
    <>
      <GeospatialMap />
      <MapVisitConsent />
    </>
  );
}
