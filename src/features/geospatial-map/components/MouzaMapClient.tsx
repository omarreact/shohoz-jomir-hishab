"use client";

import dynamic from "next/dynamic";
import VisitorMouzaShareDownload from "./VisitorMouzaShareDownload";

const MouzaExportMap = dynamic(() => import("../maplibre/MouzaExportMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[40vh] items-center justify-center bg-slate-950 text-sm text-slate-400">
      মানচিত্র লোড হচ্ছে…
    </div>
  ),
});

/**
 * Visitor-first মৌজা download: cascade form on top of the map canvas.
 */
export default function MouzaMapClient() {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-80">
        <MouzaExportMap />
      </div>
      <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center overflow-y-auto p-3 pt-4 sm:p-6 sm:pt-8">
        <div className="pointer-events-auto w-full max-w-lg">
          <VisitorMouzaShareDownload />
        </div>
      </div>
    </div>
  );
}
