"use client";

import dynamic from "next/dynamic";

const MouzaExportMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MouzaExportMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-screen w-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        মৌজা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function MouzaMapClient() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MouzaExportMap />
    </div>
  );
}
