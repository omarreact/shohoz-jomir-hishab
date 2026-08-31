"use client";

import dynamic from "next/dynamic";
import VectorPdfExportControl from "@/src/features/geospatial-map/components/VectorPdfExportControl";

const MouzaExportMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MouzaExportMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-dvh w-full place-items-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        মৌজা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

/** Full-viewport মৌজা map — no app chrome (navbar/footer). */
export default function MouzaMapClient() {
  return (
    <div className="fixed inset-0 z-0 h-dvh w-full overflow-hidden bg-slate-900">
      <MouzaExportMap />
      <VectorPdfExportControl />
    </div>
  );
}
