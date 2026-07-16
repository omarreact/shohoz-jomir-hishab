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
      icon={<Ruler size={18} className="text-primary" />} 
      onClose={() => setActivePanel("none")}
      className="position-absolute z-3 shadow-lg"
      style={{
        top: "90px",
        left: "86px",
        width: "280px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        color: "white"
      }}
    >
      <div className="d-flex flex-column gap-3">
        
        <div>
          <label className="small text-secondary fw-bold mb-2">Measurement</label>
          <div className="d-flex gap-2">
            <button 
              className={`btn btn-sm flex-grow-1 d-flex flex-column align-items-center gap-1 p-2 border ${activeAction === "measure" ? "border-primary text-primary" : "border-secondary border-opacity-25 text-white hover-bg-dark"}`}
              style={{ backgroundColor: activeAction === "measure" ? "var(--card-bg)" : "var(--card-bg-secondary)" }}
              onClick={() => setActiveAction(activeAction === "measure" ? "none" : "measure")}
            >
              <Navigation size={18} />
              <span style={{ fontSize: "0.75rem" }}>Distance</span>
            </button>
            <button 
              className={`btn btn-sm flex-grow-1 d-flex flex-column align-items-center gap-1 p-2 border ${activeAction === "draw" ? "border-primary text-primary" : "border-secondary border-opacity-25 text-white hover-bg-dark"}`}
              style={{ backgroundColor: activeAction === "draw" ? "var(--card-bg)" : "var(--card-bg-secondary)" }}
              onClick={() => setActiveAction(activeAction === "draw" ? "none" : "draw")}
            >
              <Hexagon size={18} />
              <span style={{ fontSize: "0.75rem" }}>Area</span>
            </button>
          </div>
        </div>

        <div>
          <label className="small text-secondary fw-bold mb-2">Draw</label>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-sm flex-grow-1 d-flex flex-column align-items-center gap-1 p-2 border border-secondary border-opacity-25 text-white hover-bg-dark"
              style={{ backgroundColor: "var(--card-bg-secondary)" }}
              onClick={() => setActiveAction("draw")}
            >
              <Circle size={18} />
              <span style={{ fontSize: "0.75rem" }}>Circle</span>
            </button>
            <button 
              className="btn btn-sm flex-grow-1 d-flex flex-column align-items-center gap-1 p-2 border border-secondary border-opacity-25 text-white hover-bg-dark"
              style={{ backgroundColor: "var(--card-bg-secondary)" }}
              onClick={() => setActiveAction("select")}
            >
              <MapPin size={18} />
              <span style={{ fontSize: "0.75rem" }}>Point</span>
            </button>
          </div>
        </div>

        <hr className="my-1 border-secondary opacity-25" />

        <div>
          <button className="btn btn-sm w-100 btn-outline-secondary d-flex align-items-center justify-content-center gap-2 border-secondary border-opacity-50 text-white hover-bg-dark transition-colors">
            <Download size={14} /> Export GeoJSON
          </button>
        </div>
        
      </div>
    </FloatingCard>
  );
}
