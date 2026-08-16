"use client";

import React from "react";
import { Plus, Minus, Compass } from "lucide-react";
import { useMap } from "react-leaflet";

export function MapControlsGroup() {
  const map = useMap();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleCompass = () => map.setView([23.7937, 90.4066], 13); // Reset to default view

  return (
    <div 
      className="absolute flex flex-col gap-2 z-3"
      style={{
        top: "20px",
        left: "20px",
        pointerEvents: "auto"
      }}
    >
      <div className="rounded-sm shadow-sm flex flex-col overflow-hidden border" style={{ width: "32px", backgroundColor: "#fff", borderColor: "#cbd5e1" }}>
        <button 
          onClick={handleZoomIn} 
          aria-label="Zoom in"
          className="px-3 py-1.5 text-sm border-0 rounded-none p-2 flex items-center justify-center transition-colors text-slate-500 hover-bg-light"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
        <hr className="m-0" style={{ borderColor: "#cbd5e1" }} />
        <button 
          onClick={handleZoomOut} 
          aria-label="Zoom out"
          className="px-3 py-1.5 text-sm border-0 rounded-none p-2 flex items-center justify-center transition-colors text-slate-500 hover-bg-light"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
      </div>

      <button 
        onClick={handleCompass} 
        aria-label="Reset bearing to north"
        className="rounded-sm shadow-sm border p-2 flex items-center justify-center transition-all text-slate-500 hover-bg-light"
        title="Reset View"
        style={{ width: "32px", height: "32px", backgroundColor: "#fff", borderColor: "#cbd5e1" }}
      >
        <Compass size={16} />
      </button>
    </div>
  );
}
