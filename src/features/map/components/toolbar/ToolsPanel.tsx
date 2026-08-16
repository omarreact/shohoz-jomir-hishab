"use client";

import React from "react";
import { FloatingCard } from "@/src/components/ui/gis/FloatingCard";
import { useToolbar } from "@/src/features/map/providers/ToolbarProvider";
import { Ruler, Navigation, Hexagon, Circle, MapPin, Download } from "lucide-react";

export function ToolsPanel() {
  const { activePanel, setActivePanel, activeAction, setActiveAction } = useToolbar();

  if (activePanel !== "tools") return null;

  return (
    <FloatingCard 
      title="Map Tools" 
      icon={<Ruler size={18} className="text-blue-600" />} 
      onClose={() => setActivePanel("none")}
      className="absolute z-3 shadow-lg bg-white dark:bg-slate-900"
    >
      <div className="flex flex-col gap-3">
        
        <div>
          <label className="text-sm text-slate-500 font-bold mb-2">Measurement</label>
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1.5 text-sm grow flex flex-col items-center gap-1 p-2 border ${activeAction === "measure" ? "border-primary text-primary" : "border-secondary border-opacity-25 text-white hover-bg-dark"}`}
              style={{ backgroundColor: activeAction === "measure" ? "#ffffff" : "#f8fafc" }}
              onClick={() => setActiveAction(activeAction === "measure" ? "none" : "measure")}
            >
              <Navigation size={18} />
              <span style={{ fontSize: "0.75rem" }}>Distance</span>
            </button>
            <button 
              className={`px-3 py-1.5 text-sm grow flex flex-col items-center gap-1 p-2 border ${activeAction === "draw" ? "border-primary text-primary" : "border-secondary border-opacity-25 text-white hover-bg-dark"}`}
              style={{ backgroundColor: activeAction === "draw" ? "#ffffff" : "#f8fafc" }}
              onClick={() => setActiveAction(activeAction === "draw" ? "none" : "draw")}
            >
              <Hexagon size={18} />
              <span style={{ fontSize: "0.75rem" }}>Area</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-500 font-bold mb-2">Draw</label>
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 text-sm grow flex flex-col items-center gap-1 p-2 border border-slate-500 border-opacity-25 text-white hover-bg-dark bg-slate-50 dark:bg-slate-950"
              onClick={() => setActiveAction("draw")}
            >
              <Circle size={18} />
              <span style={{ fontSize: "0.75rem" }}>Circle</span>
            </button>
            <button 
              className="px-3 py-1.5 text-sm grow flex flex-col items-center gap-1 p-2 border border-slate-500 border-opacity-25 text-white hover-bg-dark bg-slate-50 dark:bg-slate-950"
              onClick={() => setActiveAction("select")}
            >
              <MapPin size={18} />
              <span style={{ fontSize: "0.75rem" }}>Point</span>
            </button>
          </div>
        </div>

        <hr className="my-1 border-slate-500 opacity-25" />

        <div>
          <button className="px-3 py-1.5 text-sm w-full border border-slate-500 text-slate-500 hover:bg-slate-500 hover:text-white flex items-center justify-center gap-2 border-slate-500 border-opacity-50 text-white hover-bg-dark transition-colors">
            <Download size={14} /> Export GeoJSON
          </button>
        </div>
        
      </div>
    </FloatingCard>
  );
}
