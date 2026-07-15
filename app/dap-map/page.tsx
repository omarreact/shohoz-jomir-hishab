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
    <div className="position-relative w-100" style={{ height: "calc(100vh - 75px)", overflow: "hidden" }}>
      {/* Map Area - Always visible */}
      <div className="position-absolute top-0 start-0 w-100 h-100 z-0">
        <FullDapMap initialData={selectedPlot} />
      </div>

      {/* Floating Search Wizard */}
      <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-1 w-100 px-2" style={{ maxWidth: "800px" }}>
        <DapSearchWizard onPlotSelected={handlePlotSelected} onMouzaSelected={handlePlotSelected} />
      </div>
    </div>
  );
}
