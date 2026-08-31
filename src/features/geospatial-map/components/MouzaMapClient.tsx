"use client";

import dynamic from "next/dynamic";

const MouzaExportMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MouzaExportMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[50vh] w-full place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        মৌজা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function MouzaMapClient() {
  return (
    <div
      className="relative w-full flex-1 overflow-hidden pb-[4.75rem] md:pb-0"
      style={{
        minHeight: "50vh",
        height: "calc(100dvh - 3.75rem)",
        maxHeight: "calc(100dvh - 3.75rem)",
      }}
    >
      <MouzaExportMap />
    </div>
  );
}
