"use client";

import React from "react";
import { FloatingCard } from "@/src/components/ui/gis/FloatingCard";
import { useToolbar } from "@/src/features/map/providers/ToolbarProvider";
import { Bookmark, MapPin, Plus } from "lucide-react";

export function BookmarkPanel() {
  const { activePanel, setActivePanel } = useToolbar();

  if (activePanel !== "bookmarks") return null;

  return (
    <FloatingCard 
      title="Bookmarks" 
      icon={<Bookmark size={18} />} 
      onClose={() => setActivePanel("none")}
      className="position-absolute z-3"
      style={{
        top: "90px",
        left: "86px",
        width: "320px",
      }}
    >
      <button className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 mb-3">
        <Plus size={16} /> Save Current View
      </button>

      <div className="d-flex flex-column gap-2">
        <div className="p-2 border rounded-3 bg-light d-flex align-items-center gap-3 cursor-pointer hover-bg-white transition-all">
          <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
            <MapPin size={16} />
          </div>
          <div>
            <div className="fw-bold small text-dark">Gulshan 1, Dhaka</div>
            <div className="small text-muted" style={{ fontSize: "0.75rem" }}>Saved 2 days ago</div>
          </div>
        </div>

        <div className="p-2 border rounded-3 bg-light d-flex align-items-center gap-3 cursor-pointer hover-bg-white transition-all">
          <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success">
            <MapPin size={16} />
          </div>
          <div>
            <div className="fw-bold small text-dark">Plot RS-1234</div>
            <div className="small text-muted" style={{ fontSize: "0.75rem" }}>Saved last week</div>
          </div>
        </div>
      </div>
    </FloatingCard>
  );
}
