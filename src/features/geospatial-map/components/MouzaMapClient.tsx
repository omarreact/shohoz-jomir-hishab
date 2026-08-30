"use client";

import dynamic from "next/dynamic";

const MouzaExportMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MouzaExportMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[min(70vh,720px)] w-full place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)] md:h-[min(75vh,900px)]">
        মৌজা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function MouzaMapClient() {
  return (
    <div
      className="relative w-full flex-1 overflow-hidden"
      style={{ minHeight: "min(70vh, 720px)", height: "calc(100dvh - 11rem)" }}
    >
      <MouzaExportMap />
    </div>
  );
}
