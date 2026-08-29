"use client";

import dynamic from "next/dynamic";
import OfflineMapNotice from "@/src/shared/components/OfflineMapNotice";

const MouzaExportMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MouzaExportMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        মৌজা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

export default function MouzaMapPage() {
  return (
    <div className="relative min-h-screen w-full">
      <MouzaExportMap />
      <OfflineMapNotice />
    </div>
  );
}
