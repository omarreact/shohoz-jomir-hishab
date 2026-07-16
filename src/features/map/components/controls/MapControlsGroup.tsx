"use client";

import React from "react";
import { Plus, Minus, Compass, Maximize2, Minimize2 } from "lucide-react";
import { useMap } from "react-leaflet";
import { useToolbar } from "@/src/features/map/providers/ToolbarProvider";

export function MapControlsGroup() {
  const map = useMap();
  const { isFullscreen, setIsFullscreen } = useToolbar();

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleCompass = () => map.setView([23.7937, 90.4066], 13); // Reset to default view

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      className="position-absolute d-flex flex-column gap-2 z-3"
      style={{
        bottom: "60px",
        right: "20px",
        pointerEvents: "auto"
      }}
    >
      <div className="rounded-3 shadow-sm d-flex flex-column overflow-hidden border border-secondary border-opacity-25" style={{ width: "36px", backgroundColor: "var(--card-bg)" }}>
        <button 
          onClick={handleZoomIn} 
          aria-label="Zoom in"
          className="btn btn-sm border-0 rounded-0 p-2 d-flex align-items-center justify-content-center transition-colors text-white"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
        <hr className="m-0 border-secondary border-opacity-50" />
        <button 
          onClick={handleZoomOut} 
          aria-label="Zoom out"
          className="btn btn-sm border-0 rounded-0 p-2 d-flex align-items-center justify-content-center transition-colors text-white"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>
      </div>

      <button 
        onClick={handleCompass} 
        aria-label="Reset bearing to north"
        className="btn rounded-3 shadow-sm border border-secondary border-opacity-25 p-2 d-flex align-items-center justify-content-center hover-shadow transition-all text-white"
        title="Reset View"
        style={{ width: "36px", height: "36px", backgroundColor: "var(--card-bg)" }}
      >
        <Compass size={16} />
      </button>

      <button 
        onClick={toggleFullscreen} 
        aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
        className="btn rounded-3 shadow-sm border border-secondary border-opacity-25 p-2 d-flex align-items-center justify-content-center d-none d-md-flex hover-shadow transition-all text-white"
        title="Toggle Fullscreen"
        style={{ width: "36px", height: "36px", backgroundColor: "var(--card-bg)" }}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}
