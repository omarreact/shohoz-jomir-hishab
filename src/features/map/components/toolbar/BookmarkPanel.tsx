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
      icon={<Bookmark size={18} className="text-blue-600" />} 
      onClose={() => setActivePanel("none")}
      className="absolute z-3 shadow-lg bg-white dark:bg-slate-900"
    >
      <div className="flex gap-2 mb-6">
        <button 
          onClick={handleSaveView}
          className="px-3 py-1.5 text-sm grow flex items-center justify-center gap-1 border border-blue-600 text-blue-600 hover-bg-dark transition-colors bg-slate-50 dark:bg-slate-950"
        >
          <Plus size={14} /> Save View
        </button>
        <button 
          onClick={exportBookmarks}
          className="px-3 py-1.5 text-sm border border-slate-500 text-slate-500 hover:bg-slate-500 hover:text-white flex items-center justify-center border-slate-500 border-opacity-50 text-white hover-bg-dark transition-colors"
          title="Export Bookmarks"
        >
          <Download size={14} />
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-sm border border-slate-500 text-slate-500 hover:bg-slate-500 hover:text-white flex items-center justify-center border-slate-500 border-opacity-50 text-white hover-bg-dark transition-colors"
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

      <div className="flex flex-col gap-2 overflow-auto pr-1" style={{ maxHeight: "300px" }}>
        {bookmarks.length === 0 ? (
          <div className="text-center text-slate-500 py-4 text-sm">
            No bookmarks saved yet.
          </div>
        ) : (
          bookmarks.map(bookmark => (
            <div 
              key={bookmark.id} 
              className="p-2 border border-slate-500 border-opacity-25 rounded-lg flex items-center justify-between gap-3 cursor-pointer hover-bg-dark transition-colors group bg-slate-50 dark:bg-slate-950"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full border border-slate-500 border-opacity-25 text-blue-600 bg-white dark:bg-slate-900">
                  {bookmark.type === 'search' ? <Search size={14} /> : <MapPin size={14} />}
                </div>
                <div>
                  <div className="font-bold text-sm text-white text-truncate" style={{ maxWidth: "160px" }}>{bookmark.title}</div>
                  <div className="text-sm text-slate-500" style={{ fontSize: "0.70rem" }}>
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeBookmark(bookmark.id); }}
                className="text-blue-600 hover:underline bg-transparent border-0 text-slate-500 p-1 border-0 hover-text-danger transition-colors"
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
