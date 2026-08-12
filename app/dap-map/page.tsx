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

  return (
    <div className="d-flex flex-column" style={{ height: "calc(100vh - 75px)" }}>
      {/* Top bar */}
      <div className="bg-dark text-white p-2 px-3 d-flex align-items-center justify-content-between shadow-sm flex-shrink-0">
        <h5 className="mb-0 d-flex align-items-center fw-bold" style={{ fontSize: 16 }}>
          <Layers size={18} className="me-2 text-success" />
          ফুল ড্যাপ ম্যাপ (Full DAP Map)
        </h5>
        <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2 border border-success border-opacity-25">
          সম্পূর্ণ রাজউক ডেটাবেস সংযুক্ত
        </span>
      </div>

      {/* Content area */}
      <div className="flex-grow-1 d-flex flex-column bg-light">
        {/* Fixed Search Wizard at the top */}
        <div className="bg-white border-bottom shadow-sm z-1 position-relative" style={{ zIndex: 10 }}>
          <div className="container-fluid py-3 px-4">
            <DapSearchWizard onPlotSelected={handlePlotSelected} onMouzaSelected={handlePlotSelected} />
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-grow-1 position-relative">
          {!showMap ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
              <div className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2 mb-3 border border-success border-opacity-25">
                Smart DAP Search
              </div>
              <h2 className="text-secondary fw-bolder mb-2">ম্যাপ দেখার জন্য একটি মৌজা নির্বাচন করুন</h2>
              <p className="text-secondary opacity-75">
                মৌজা নির্বাচন করলেই ম্যাপ স্বয়ংক্রিয়ভাবে লোড হবে এবং আপনি দাগ নম্বর দিয়ে খুঁজতে পারবেন।
              </p>
            </div>
          ) : (
            <FullDapMap initialData={selectedPlot} />
          )}
        </div>
      </div>
    </div>
  );
}
