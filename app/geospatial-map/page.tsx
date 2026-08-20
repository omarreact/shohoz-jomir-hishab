"use client";

import dynamic from "next/dynamic";

const GeospatialMap = dynamic(
  () => import("@/src/features/geospatial-map/components/GeospatialMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[calc(100vh-5rem)] place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        জিওস্পেশিয়াল ম্যাপ প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function GeospatialMapPage() {
  return <GeospatialMap />;
}
