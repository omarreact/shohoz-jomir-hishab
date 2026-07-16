"use client";

import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

// Dynamically import the actual map content with SSR disabled
const MapCore = dynamic(() => import("@/src/features/map/components/MapCore"), {
  ssr: false,
  loading: () => (
    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100" style={{ minHeight: "80vh", backgroundColor: "var(--card-bg)" }}>
      <Loader className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem", borderWidth: "0.25em" }} />
      <h5 className="text-secondary fw-bold">Loading Map Workspace...</h5>
    </div>
  ),
});

import { MapEngineProvider } from "@/src/features/map/providers/MapEngineProvider";
import { FloatingToolbar } from "@/src/features/map/components/toolbar/FloatingToolbar";

const GisIntelligencePanel = dynamic(() => import("@/src/features/search/components/GisIntelligencePanel"), { ssr: false });
const LayerManagerPanel = dynamic(() => import("@/src/features/map/components/toolbar/LayerManagerPanel").then(mod => mod.LayerManagerPanel), { ssr: false });
const BasemapSelectorPanel = dynamic(() => import("@/src/features/map/components/toolbar/BasemapSelectorPanel").then(mod => mod.BasemapSelectorPanel), { ssr: false });
const BookmarkPanel = dynamic(() => import("@/src/features/map/components/toolbar/BookmarkPanel").then(mod => mod.BookmarkPanel), { ssr: false });
const ToolsPanel = dynamic(() => import("@/src/features/map/components/toolbar/ToolsPanel").then(mod => mod.ToolsPanel), { ssr: false });

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
        <ToolsPanel />
        
        <GisIntelligencePanel />
      </MapEngineProvider>
    </div>
  );
}
