"use client";

import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

// Dynamically import the actual map content with SSR disabled
const MapCore = dynamic(() => import("@/src/features/map/components/MapCore"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white dark:bg-slate-900" style={{ minHeight: "80vh" }}>
      <Loader className="animate-spin text-[#006a4e] mb-3" size={48} />
      <h5 className="text-slate-500 dark:text-slate-400 font-bold text-lg">Loading Map Workspace...</h5>
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
    <div className="w-full h-full relative overflow-hidden" style={{ width: "100%" }}>
      <MapEngineProvider>
        <MapCore initialData={initialData} />
      </MapEngineProvider>
    </div>
  );
}
