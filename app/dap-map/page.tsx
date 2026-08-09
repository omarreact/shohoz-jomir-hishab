"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Layers, Search, Map as MapIcon } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SearchPanel from "@/src/features/search/components/SearchPanel";

// Lazy load the heavy Leaflet map
const FullDapMap = dynamic(() => import("@/components/FullDapMap"), {
  ssr: false,
  loading: () => (
    <LoadingSpinner label="ম্যাপ লোড হচ্ছে..." size="lg" fullPage={false} />
  ),
});

export default function DapMapPage() {
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handlePlotFound = (plot: any, type: string) => {
    setSelectedPlot(plot);
    setIsMobileSearchOpen(false); // Auto-close search panel on mobile when plot is found

    // Dispatch smart-search-result event for MapCore to handle flying and selecting
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("smart-search-result", {
          detail: {
            type: type === "rs_plot_no" ? "RS_PLOT" : "MS_PLOT",
            data: plot,
          },
        }),
      );
    }
  };

  return (
    <div
      className="flex flex-col w-full relative"
      style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}
    >
      {/* Top Header/Toolbar */}
      <div className="bg-[#0f172a] text-white p-3 flex items-center justify-between shadow-md shrink-0 z-20 relative border-b border-slate-800">
        <h5 className="m-0 flex items-center font-bold text-base sm:text-lg tracking-wide">
          <Layers size={20} className="mr-2 text-[#f6c343]" />
          রাজউক স্মার্ট ম্যাপ{" "}
          <span className="hidden sm:inline-block ml-1 opacity-70 font-medium text-sm">
            (Full DAP Map)
          </span>
        </h5>
        <div className="flex items-center gap-3">
          <span className="bg-[#f6c343]/10 text-[#f6c343] rounded-full px-3 py-1 text-xs font-bold border border-[#f6c343]/20 hidden md:inline-block shadow-sm">
            বেটা ভার্সন
          </span>
          <button
            className="md:hidden flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-bold border border-slate-600 shadow-sm"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            {isMobileSearchOpen ? (
              <>
                <MapIcon size={16} className="text-[#f6c343]" /> ম্যাপ দেখুন
              </>
            ) : (
              <>
                <Search size={16} className="text-blue-400" /> দাগ খুঁজুন
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Content Area */}
      <div className="flex flex-1 relative overflow-hidden bg-[var(--bg)]">
        {/* Sidebar / Search Panel (Left) */}
        <div
          className={`absolute md:relative h-full z-10 bg-[var(--surface)] border-r border-[var(--border)] shadow-xl transition-transform duration-300 ease-in-out ${isMobileSearchOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
          style={{ width: "100%", maxWidth: "420px", overflowY: "auto" }}
        >
          <div className="p-4 h-full flex flex-col">
            <SearchPanel
              onPlotFound={handlePlotFound}
              compact={false}
              onClose={() => setIsMobileSearchOpen(false)}
            />
          </div>
        </div>

        {/* Map Area (Right) */}
        <div className="flex-1 relative h-full w-full z-0 bg-slate-100 dark:bg-slate-900">
          <FullDapMap initialData={selectedPlot} />
        </div>
      </div>
    </div>
  );
}
