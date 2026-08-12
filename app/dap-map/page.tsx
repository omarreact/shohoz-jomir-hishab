"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DapSearchWizard from "@/components/features/dap-map/DapSearchWizard";

// Lazy load the heavy Leaflet map — never loaded until user selects a plot
const FullDapMap = dynamic(() => import("@/components/FullDapMap"), {
  ssr: false,
  loading: () => <LoadingSpinner label="ম্যাপ লোড হচ্ছে..." size="lg" />,
});

export default function DapMapPage() {
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handlePlotSelected = (plot: any) => {
    setSelectedPlot(plot);
    setShowMap(true);
  };

  const handleMouzaSelected = (mouza: string) => {
    // Future use
  };

  return (
    <div className="relative w-full overflow-hidden bg-[var(--bg)]" style={{ height: "calc(100dvh - 73px)" }}>
      {/* Floating Search Wizard */}
      <div className="absolute top-0 md:top-4 left-0 md:left-4 z-10 w-full md:w-[450px] max-h-full overflow-y-auto md:rounded-xl shadow-2xl bg-[var(--bg)] flex flex-col">
        <DapSearchWizard 
          onPlotSelected={handlePlotSelected} 
          onMouzaSelected={handleMouzaSelected} 
        />
        {!showMap && (
          <div className="p-6 text-center text-[var(--text-secondary)] border-t border-[var(--border)] bg-[var(--bg)]">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <Layers size={32} className="text-[var(--accent)]" />
            </div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">ফুল ড্যাপ ম্যাপ</h4>
            <p className="text-sm">
              ম্যাপ দেখার জন্য প্রথমে সার্চ প্যানেল থেকে একটি জেলা, থানা, মৌজা ও দাগ নম্বর নির্বাচন করুন।
            </p>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="w-full h-full relative z-0">
        {!showMap ? (
          <div className="w-full h-full flex items-center justify-center bg-[var(--bg)] md:pl-[450px]">
            {/* The background before map loads */}
            <div className="text-center opacity-30">
              <Layers size={100} className="mb-4 mx-auto text-[var(--text-primary)]" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">ম্যাপ লোড করতে সার্চ করুন</h2>
            </div>
          </div>
        ) : (
          <FullDapMap initialData={selectedPlot} />
        )}
      </div>
    </div>
  );
}
