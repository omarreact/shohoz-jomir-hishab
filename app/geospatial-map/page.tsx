"use client";

import dynamic from "next/dynamic";
import { Map, Layers3, Satellite, MapPinned, ArrowLeft } from "lucide-react";
import Link from "next/link";

const GeospatialMap = dynamic(() => import("@/src/features/geospatial-map/components/GeospatialMap"), {
  ssr: false,
  loading: () => (
    <main className="min-h-[calc(100vh-5rem)] bg-[var(--background)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A6B3C]/10 text-[#1A6B3C]"><Map size={30} /></div>
          <span className="inline-flex rounded-full bg-[#F0A500]/15 px-3 py-1 text-xs font-bold text-[#8a5d00]">GIS মানচিত্র</span>
          <h1 className="mt-4 text-3xl font-bold text-[var(--foreground)] md:text-4xl">মানচিত্র প্রস্তুত হচ্ছে</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">RS ও MS মৌজা, প্লট এবং স্যাটেলাইট স্তরসহ মানচিত্র অভিজ্ঞতা লোড হচ্ছে।</p>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
            {[[Layers3, "RS · MS মৌজা"], [MapPinned, "প্লট তথ্য"], [Satellite, "স্যাটেলাইট স্তর"]].map(([Icon, label]) => (
              <div key={label as string} className="rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4">
                <Icon size={20} className="text-[#1A6B3C]" />
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{label as string}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 h-2 max-w-md overflow-hidden rounded-full bg-[var(--secondary)]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#1A6B3C]" /></div>
          <Link href="/" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] px-5 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]"><ArrowLeft size={16} /> ফিরে যান</Link>
        </div>
      </div>
    </main>
  ),
});

export default function UrbanPlanningMapPage() {
  return <GeospatialMap />;
}
