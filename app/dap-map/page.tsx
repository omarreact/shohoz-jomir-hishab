"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/src/shared/ui/LoadingSpinner";
import { ChevronDown, Map as MapIcon } from "lucide-react";
import DapSearchWizard from "@/src/features/map/components/DapSearchWizard";

// Lazy load the heavy Leaflet map
const FullDapMap = dynamic(() => import("@/src/features/map/components/FullDapMap"), {
  ssr: false,
  loading: () => <LoadingSpinner label="ম্যাপ লোড হচ্ছে..." size="lg" />,
});

export default function DapMapPage() {
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 w-full" style={{ height: "calc(100vh - 75px)", overflow: "hidden" }}>
      {/* ── Official RAJUK Style Header ── */}
      <div 
        className="bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between shrink-0 h-[60px] border-b border-slate-200 dark:border-slate-800 shadow-sm z-[1050]"
      >
        <div className="flex items-center h-full">
          {/* Mock Logo / Branding */}
          <div className="flex items-center justify-center border rounded-full border-blue-600/25 bg-slate-50 dark:bg-slate-800 w-10 h-10">
            <MapIcon size={22} className="text-blue-600 dark:text-blue-500" />
          </div>
          <div className="ml-3 pl-3 border-l border-slate-200 dark:border-slate-700 h-full flex flex-col justify-center">
            <h5 className="m-0 font-bold text-[#1e3a8a] dark:text-blue-400 text-lg leading-tight">
              Masterplan, RAJUK
            </h5>
            <small className="text-slate-500 dark:text-slate-400 font-medium text-xs">
              Detailed Area Plan 2022 - 2035
            </small>
          </div>
        </div>

        <div className="flex items-center">
          <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 flex items-center font-medium text-sm transition-colors">
            Help <ChevronDown size={14} className="ml-1" />
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="relative grow w-full">
        <FullDapMap initialData={selectedPlot} />
        
        {/* ── Floating Search Wizard ── */}
        <div 
          className="absolute top-4 right-4 z-[1050] w-full max-w-[400px]"
        >
          <DapSearchWizard onPlotSelected={setSelectedPlot} onMouzaSelected={setSelectedPlot} />
        </div>
      </div>

      {/* ── Official RAJUK Style Footer ── */}
      <div 
        className="bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between shrink-0 h-[36px] border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 z-[1050]"
      >
        <span>© 2025 Rajuk</span>
        <span className="flex items-center">
          Developed by 
          <strong className="ml-1 text-slate-900 dark:text-white">esri Bangladesh</strong>
        </span>
      </div>
    </div>
  );
}