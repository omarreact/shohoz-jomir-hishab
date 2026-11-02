"use client";

import { useState } from "react";
import { ExternalLink, FileSearch, MapPinned, FileWarning } from "lucide-react";
import MouzaMapClient from "./MouzaMapClient";
import MouzaMapViewer from "@/src/features/mouza-map/MouzaMapViewer";

type Mode = "gis" | "demo";

/** Render one workflow at a time; the previous page stacked full-height GIS and PDF browser. */
export default function MouzaMapPageTabs({ demoBrowserEnabled }: { demoBrowserEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("gis");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="relative z-30 border-b border-white/10 bg-slate-950 px-3 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold sm:text-xl">মৌজা মানচিত্র ও নকশা</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
              GIS নকশা, সরকারি রেকর্ড এবং উৎসভিত্তিক ডাউনলোড আলাদা রাখুন।
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="মৌজা ম্যাপ সেবা">
            <button
              type="button"
              aria-pressed={mode === "gis"}
              onClick={() => setMode("gis")}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-emerald-400 ${mode === "gis" ? "border-emerald-400 bg-emerald-700 text-white" : "border-white/20 text-slate-200 hover:bg-white/10"}`}
            >
              <MapPinned size={17} /> GIS ম্যাপ
            </button>
            {demoBrowserEnabled && (
              <button
                type="button"
                aria-pressed={mode === "demo"}
                onClick={() => setMode("demo")}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-emerald-400 ${mode === "demo" ? "border-amber-400 bg-amber-700 text-white" : "border-white/20 text-slate-200 hover:bg-white/10"}`}
              >
                <FileWarning size={17} /> নমুনা PDF (ডেভ)
              </button>
            )}
            <a
              href="https://map.settlement.gov.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <ExternalLink size={17} /> সরকারি মৌজা নকশা
            </a>
            <a
              href="/dlrms-khatian"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              <FileSearch size={17} /> খতিয়ান
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-3 max-w-7xl text-xs leading-5 text-amber-200">
          GIS-এ RAJUK RS/MS তথ্য কেবল প্রাপ্য এলাকায় দেখানো হয়। সারা বাংলাদেশের যাচাইকৃত সরকারি নকশা বা খতিয়ানের বিকল্প নয়।
        </p>
      </header>
      {mode === "demo" && demoBrowserEnabled ? (
        <div className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
          <MouzaMapViewer />
        </div>
      ) : (
        <MouzaMapClient />
      )}
    </main>
  );
}
