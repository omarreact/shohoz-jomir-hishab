"use client";

import { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Lazy load the heavy Leaflet map — never loaded until user selects a plot
const FullDapMap = dynamic(() => import("@/components/FullDapMap"), {
  ssr: false,
  loading: () => <LoadingSpinner label="ম্যাপ লোড হচ্ছে..." size="lg" />,
});

export default function DapMapPage() {
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);

  useEffect(() => {
    const handleSearchResult = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setSelectedPlot(customEvent.detail);
      }
    };

    window.addEventListener("smart-search-result", handleSearchResult);
    return () => window.removeEventListener("smart-search-result", handleSearchResult);
  }, []);

  return (
    <div className="position-relative w-100 h-100 overflow-hidden">
      {/* Map Area - Always visible */}
      <div className="position-absolute top-0 start-0 w-100 h-100 z-0">
        <FullDapMap initialData={selectedPlot} />
      </div>
    </div>
  );
}
