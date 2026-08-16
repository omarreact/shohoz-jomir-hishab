"use client";

import React, { useState, useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { MapService } from "@/src/features/map/services/mapService";

export function BottomStatusBar() {
  const map = useMap();
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const [zoom, setZoom] = useState(map.getZoom());
  const [format, setFormat] = useState<"DD" | "DMS">("DD");

  useMapEvents({
    mousemove(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    zoomend() {
      setZoom(map.getZoom());
    }
  });

  const toggleFormat = () => {
    setFormat(prev => prev === "DD" ? "DMS" : "DD");
  };

  const toDMS = (deg: number, isLat: boolean) => {
    const d = Math.floor(Math.abs(deg));
    const minFloat = (Math.abs(deg) - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(2);
    const dir = deg >= 0 ? (isLat ? "N" : "E") : (isLat ? "S" : "W");
    return `${d}°${m}'${s}"${dir}`;
  };

  const displayCoords = format === "DD"
    ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
    : `${toDMS(coords.lat, true)} ${toDMS(coords.lng, false)}`;

  return (
    <div 
      role="contentinfo"
      aria-label="Map Status Bar"
      className="absolute bottom-0 start-0 w-full border-t border-slate-500 border-opacity-25 flex items-center justify-between px-3 z-3 animate-slide-up bg-white dark:bg-slate-900"
    >
      <div className="flex items-center gap-4 text-slate-500 font-bold">
        <button 
          className="text-blue-600 hover:underline bg-transparent border-0 p-0 text-slate-500 text-decoration-none font-bold flex items-center gap-1 hover-text-primary transition-colors"
          onClick={toggleFormat}
          title="Click to toggle DD/DMS"
          aria-label={`Current coordinates: ${displayCoords}. Click to toggle format.`}
        >
          <span>{displayCoords}</span>
        </button>
        <div className="hidden d-md-block">
          Zoom: {zoom}
        </div>
        <div className="hidden d-md-block">
          WGS 84
        </div>
      </div>

      <div className="flex items-center gap-3 text-slate-500 font-bold">
        <span className="flex items-center gap-2">
          <span className="spinner-grow spinner-grow-sm text-blue-600" style={{ width: "8px", height: "8px" }} />
          System Active
        </span>
      </div>
    </div>
  );
}
