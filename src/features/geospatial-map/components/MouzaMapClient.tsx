"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import VisitorMouzaShareDownload from "./VisitorMouzaShareDownload";

const MouzaExportMap = dynamic(() => import("../maplibre/MouzaExportMap"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-80 place-items-center bg-[#e9f0e9] text-sm font-semibold text-[#557571]">GIS নকশা লোড হচ্ছে…</div>,
});

/** Public download uses live RAJUK locations; advanced georeferenced exports require authentication. */
export default function MouzaMapClient() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div role="status" className="grid min-h-72 place-items-center rounded-[25px] bg-white text-sm font-bold text-[#54746e]">সার্ভিস প্রস্তুত হচ্ছে…</div>;
  }

  if (isLoggedIn) {
    return (
      <div className="relative h-[min(72dvh,760px)] min-h-[470px] w-full overflow-hidden rounded-[26px] border border-[#dce5dc] bg-[#ebf0e8] shadow-[0_12px_40px_rgba(29,62,51,.12)]">
        <MouzaExportMap />
      </div>
    );
  }

  return (
    <div className="w-full">
      <VisitorMouzaShareDownload />
      <p className="mt-3 text-xs leading-6 text-[#788680]">অ্যাডভান্সড GeoTIFF, RAW ও Vector PDF টুলের জন্য অনুমোদিত স্টাফ লগইন প্রয়োজন।</p>
    </div>
  );
}
