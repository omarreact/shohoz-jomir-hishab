"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
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
 * Visitors: cascade form → high-res PNG only.
 * Admins: full map + GeoTIFF / RAW / advanced export controls.
 */
export default function MouzaMapClient() {
  const { user, isLoggedIn, loading } = useAuth();
  const isAdmin = isLoggedIn && isAdminRole(user?.role);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-950 text-sm text-slate-400">
        লোড হচ্ছে…
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-950">
        <MouzaExportMap />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full items-start justify-center overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-3 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-lg">
        <VisitorMouzaShareDownload />
        <p className="mt-4 text-center text-[11px] text-slate-500">
          অ্যাডমিন টুলস (GeoTIFF, RAW, Vector PDF, মানচিত্র সম্পাদনা) স্টাফ লগইনের পর উপলব্ধ।
        </p>
      </div>
    </div>
  );
}
