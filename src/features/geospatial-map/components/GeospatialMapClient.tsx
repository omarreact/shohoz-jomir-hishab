"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { House } from "lucide-react";
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

/** Full-viewport map host — deliberately isolated from the global Navbar/Footer. */
export default function GeospatialMapClient() {
  useEffect(() => {
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
      className="fixed inset-0 z-0 h-[100svh] w-full overflow-hidden bg-slate-900"
      style={{
        height: "var(--landbd-vh, 100svh)",
        minHeight: "0",
        maxHeight: "100dvh",
      }}
    >
      <MapLibreMap />
      <Link
        href="/"
        aria-label="হোমে ফিরে যান"
        title="হোমে ফিরে যান"
        className="absolute left-3 top-[4.75rem] z-[1200] grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-slate-950/85 text-white shadow-xl backdrop-blur-md transition hover:bg-[#006a4e] focus:outline-none focus:ring-2 focus:ring-white/80 sm:left-4 sm:top-20"
      >
        <House size={20} />
      </Link>
      <MapVisitConsent />
    </div>
  );
}
