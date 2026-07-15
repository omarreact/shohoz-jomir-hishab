"use client";

import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

// Dynamically import the actual map content with SSR disabled
const MapCore = dynamic(() => import("@/src/features/map/components/MapCore"), {
  ssr: false,
  loading: () => (
    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 bg-light" style={{ minHeight: "80vh" }}>
      <Loader className="spinner-border text-success mb-3" style={{ width: "3rem", height: "3rem", borderWidth: "0.25em" }} />
      <h5 className="text-secondary fw-bold">ফুল ড্যাপ ম্যাপ লোড হচ্ছে...</h5>
    </div>
  ),
});

import { MapEngineProvider } from "@/src/features/map/providers/MapEngineProvider";
import PlotDetailsDrawer from "@/src/features/search/components/PlotDetailsDrawer";
import { FloatingToolbar } from "@/src/features/map/components/toolbar/FloatingToolbar";
import { LayerManagerPanel } from "@/src/features/map/components/toolbar/LayerManagerPanel";
import { BasemapSelectorPanel } from "@/src/features/map/components/toolbar/BasemapSelectorPanel";
import { BookmarkPanel } from "@/src/features/map/components/toolbar/BookmarkPanel";

export default function FullDapMap({ initialData }: { initialData?: any }) {
  return (
    <div className="w-100 h-100 position-relative overflow-hidden">
      <MapEngineProvider>
        <MapCore initialData={initialData} />
        
        {/* Workspace Panels */}
        <FloatingToolbar />
        <LayerManagerPanel />
        <BasemapSelectorPanel />
        <BookmarkPanel />
        
        <PlotDetailsDrawer />
      </MapEngineProvider>
    </div>
  );
}
