"use client";

import React from "react";
import { useLayers } from "@/src/features/map/providers/LayerProvider";
import { LayerRegistry } from "@/src/features/map/layers/registry";
import { FloatingCard } from "@/src/components/ui/gis/FloatingCard";
import { useToolbar } from "@/src/features/map/providers/ToolbarProvider";
import { Map } from "lucide-react";

export function BasemapSelectorPanel() {
  const { activePanel, setActivePanel } = useToolbar();
  const { activeBasemap, setActiveBasemap } = useLayers();

  if (activePanel !== "basemap") return null;

  const basemaps = LayerRegistry.getBasemaps();

  return (
    <FloatingCard 
      title="Basemaps" 
      icon={<Map size={18} />} 
      onClose={() => setActivePanel("none")}
      className="absolute z-3"
      style={{
        top: "90px",
        left: "86px",
        width: "320px",
      }}
    >
      <div className="row g-2">
        {basemaps.map(basemap => {
          const isActive = activeBasemap === basemap.id;
          return (
            <div key={basemap.id} className="col-6">
              <button
                onClick={() => setActiveBasemap(basemap.id)}
                aria-pressed={isActive}
                aria-label={`Select ${basemap.displayName} basemap`}
                className={`w-full p-2 border rounded-lg transition-colors hover-shadow flex flex-col items-center gap-2 ${ isActive ? "border-success bg-green-600 bg-opacity-10" : "bg-white hover-bg-light" }`}
                style={{
                  height: "100px"
                }}
              >
                <div 
                  className="w-full rounded grow" 
                  style={{
                    background: "#e2e8f0", 
                    backgroundImage: `url(${basemap.id === 'satellite' ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/3506/6166' : 'https://a.tile.openstreetmap.org/13/6166/3506.png'})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                />
                <span className={`text-sm font-bold ${isActive ? "text-success" : "text-dark"}`}>
                  {basemap.displayName}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </FloatingCard>
  );
}
