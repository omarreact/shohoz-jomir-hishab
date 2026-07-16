"use client";

import React, { useRef } from "react";
import { FloatingCard } from "@/src/components/ui/gis/FloatingCard";
import { useToolbar } from "@/src/features/map/providers/ToolbarProvider";
import { Bookmark, MapPin, Plus, Trash2, Download, Upload, Search } from "lucide-react";
import { useBookmarks } from "@/src/features/map/hooks/useBookmarks";

export function BookmarkPanel() {
  const { activePanel, setActivePanel } = useToolbar();
  const { bookmarks, addBookmark, removeBookmark, exportBookmarks, importBookmarks } = useBookmarks();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (activePanel !== "bookmarks") return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        importBookmarks(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveView = () => {
    addBookmark(`Map View ${new Date().toLocaleTimeString()}`, "position", { lat: 23.81, lng: 90.41, zoom: 12 });
  };

  return (
    <FloatingCard 
      title="Bookmarks" 
      icon={<Bookmark size={18} className="text-primary" />} 
      onClose={() => setActivePanel("none")}
      className="position-absolute z-3 shadow-lg"
      style={{
        top: "90px",
        left: "86px",
        width: "320px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        color: "white"
      }}
    >
      <div className="d-flex gap-2 mb-3">
        <button 
          onClick={handleSaveView}
          className="btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 border border-primary text-primary hover-bg-dark transition-colors"
          style={{ backgroundColor: "var(--card-bg-secondary)" }}
        >
          <Plus size={14} /> Save View
        </button>
        <button 
          onClick={exportBookmarks}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center border-secondary border-opacity-50 text-white hover-bg-dark transition-colors"
          title="Export Bookmarks"
        >
          <Download size={14} />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center border-secondary border-opacity-50 text-white hover-bg-dark transition-colors"
          title="Import Bookmarks"
        >
          <Upload size={14} />
        </button>
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleFileUpload} 
        />
      </div>

      <div className="d-flex flex-column gap-2 overflow-auto pe-1" style={{ maxHeight: "300px" }}>
        {bookmarks.length === 0 ? (
          <div className="text-center text-secondary py-4 small">
            No bookmarks saved yet.
          </div>
        ) : (
          bookmarks.map(bookmark => (
            <div 
              key={bookmark.id} 
              className="p-2 border border-secondary border-opacity-25 rounded-3 d-flex align-items-center justify-content-between gap-3 cursor-pointer hover-bg-dark transition-colors group"
              style={{ backgroundColor: "var(--card-bg-secondary)" }}
            >
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded-circle border border-secondary border-opacity-25 text-primary" style={{ backgroundColor: "var(--card-bg)" }}>
                  {bookmark.type === 'search' ? <Search size={14} /> : <MapPin size={14} />}
                </div>
                <div>
                  <div className="fw-bold small text-white text-truncate" style={{ maxWidth: "160px" }}>{bookmark.title}</div>
                  <div className="small text-secondary" style={{ fontSize: "0.70rem" }}>
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeBookmark(bookmark.id); }}
                className="btn btn-link text-secondary p-1 border-0 hover-text-danger transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </FloatingCard>
  );
}
