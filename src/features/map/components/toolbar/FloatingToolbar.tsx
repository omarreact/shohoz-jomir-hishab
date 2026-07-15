"use client";

import React from "react";
import { Search, Layers, Map, Bookmark, Printer, Download, Settings, Navigation2, Ruler } from "lucide-react";
import { useToolbar, ToolbarPanel } from "@/src/features/map/providers/ToolbarProvider";
import { ToolButton } from "@/src/components/ui/gis/ToolButton";

export function FloatingToolbar() {
  const { activePanel, setActivePanel } = useToolbar();

  const handleToggle = (panel: ToolbarPanel) => {
    setActivePanel(activePanel === panel ? "none" : panel);
  };

  return (
    <div 
      role="toolbar"
      aria-label="GIS Tools"
      className="position-absolute z-3 bg-white rounded-4 shadow-lg d-flex flex-column align-items-center py-2 gap-2 animate-fade-in"
      style={{
        top: "90px",
        left: "20px",
        width: "56px",
        border: "1px solid rgba(0,0,0,0.08)",
        pointerEvents: "auto"
      }}
    >
      <ToolButton 
        icon={<Search size={20} />} 
        label="Search Plots" 
        isActive={activePanel === "none"} // In this app, Search is default or a different panel
        onClick={() => {
          // We can handle search panel visibility specifically if needed
          setActivePanel("none"); 
        }} 
      />
      <ToolButton 
        icon={<Layers size={20} />} 
        label="Map Layers" 
        isActive={activePanel === "layers"} 
        onClick={() => handleToggle("layers")} 
      />
      <ToolButton 
        icon={<Map size={20} />} 
        label="Basemap" 
        isActive={activePanel === "basemap"} 
        onClick={() => handleToggle("basemap")} 
      />
      
      <hr className="w-75 my-1 border-secondary opacity-25" />
      
      <ToolButton 
        icon={<Bookmark size={20} />} 
        label="Bookmarks" 
        isActive={activePanel === "bookmarks"} 
        onClick={() => handleToggle("bookmarks")} 
      />
      
      <hr className="w-75 my-1 border-secondary opacity-25" />

      {/* Measurement tools (disabled for now or just visually present) */}
      <ToolButton icon={<Ruler size={20} />} label="Measure" onClick={() => {}} className="opacity-50" />
      
      <hr className="w-75 my-1 border-secondary opacity-25" />
      
      <ToolButton icon={<Printer size={20} />} label="Print" onClick={() => {}} className="opacity-50" />
      <ToolButton icon={<Download size={20} />} label="Export" onClick={() => {}} className="opacity-50" />
      
      <hr className="w-75 my-1 border-secondary opacity-25" />
      
      <ToolButton icon={<Settings size={20} />} label="Settings" onClick={() => {}} className="opacity-50" />
    </div>
  );
}
