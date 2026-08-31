"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import MapVisitConsent from "@/src/features/geospatial-map/components/MapVisitConsent";

const MapLibreMap = dynamic(
  () => import("@/src/features/geospatial-map/maplibre/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-dvh w-full place-items-center overflow-hidden bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        নগর পরিকল্পনা মানচিত্র প্রস্তুত হচ্ছে…
      </div>
    ),
  },
);

/** Full-viewport map host — no app chrome (navbar/footer). */
export default function GeospatialMapClient() {
  useEffect(() => {
    // The map is a viewport application. Prevent the document itself from
    // becoming scrollable on mobile when browser chrome changes the visual
    // viewport height. The map and its panels handle their own scrolling.
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlHeight = html.style.height;
    const previousBodyHeight = body.style.height;

    html.style.height = "100%";
    body.style.height = "100%";
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.height = previousHtmlHeight;
      body.style.height = previousBodyHeight;
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 w-full overflow-hidden bg-slate-900"
      style={{
        height: "var(--landbd-vh, 100svh)",
        minHeight: "0",
        maxHeight: "100svh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <MapLibreMap />
      <MapVisitConsent />
    </div>
  );
}
