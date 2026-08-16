"use client";

import React, { useState } from "react";
import { useLayers } from "@/src/features/map/providers/LayerProvider";
import { LayerRegistry } from "@/src/features/map/layers/registry";
import { FloatingCard } from "@/src/components/ui/gis/FloatingCard";
import { OpacitySlider } from "@/src/components/ui/gis/OpacitySlider";
import { useToolbar } from "@/src/features/map/providers/ToolbarProvider";
import { Layers, Eye, EyeOff } from "lucide-react";

export function LayerManagerPanel() {
  const { activePanel, setActivePanel } = useToolbar();
  const { activeOverlays, toggleOverlay } = useLayers();
  
  // Local state for UI opacity sliders. Note: Actual layer opacity requires map core integration.
  const [opacities, setOpacities] = useState<Record<string, number>>({});

  if (activePanel !== "layers") return null;

  const overlays = LayerRegistry.getOverlays();

  return (
    <FloatingCard 
      title="Map Layers" 
      icon={<Layers size={18} />} 
      onClose={() => setActivePanel("none")}
      className="position-absolute z-3"
      style={{
        top: "90px",
        left: "86px", // 20px (toolbar left) + 56px (toolbar width) + 10px spacing
        width: "320px",
        maxHeight: "calc(100vh - 120px)"
      }}
    >
      <div className="d-flex flex-column gap-3">
        {overlays.map(layer => {
          const isVisible = activeOverlays.includes(layer.id);
          const opacity = opacities[layer.id] ?? 1.0;

          return (
            <div key={layer.id} className="p-3 rounded-3 border-0 bg-slate-50 dark:bg-slate-950">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-link p-0 text-secondary transition-colors"
                    onClick={() => toggleOverlay(layer.id, !isVisible)}
                    aria-label={`Toggle visibility of ${layer.displayName}`}
                    aria-pressed={isVisible}
                  >
                    {isVisible ? <Eye size={18} className="text-primary transition-transform hover-shadow" /> : <EyeOff size={18} className="transition-transform hover-shadow" />}
                  </button>
                  <span className={`fw-bold small ${isVisible ? "text-white" : "text-secondary"}`}>
                    {layer.displayName}
                  </span>
                </div>
              </div>
              
              {isVisible && (
                <div className="mt-3">
                  <OpacitySlider 
                    value={opacity} 
                    onChange={(val) => setOpacities(prev => ({ ...prev, [layer.id]: val }))} 
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FloatingCard>
  );
}
