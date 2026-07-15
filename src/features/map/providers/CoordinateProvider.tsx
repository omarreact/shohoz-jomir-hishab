"use client";

import React, { createContext, useContext, useState } from "react";
import { LatLngBounds } from "leaflet";

interface CoordinateContextValue {
  cursorPosition: { lat: number; lng: number } | null;
  setCursorPosition: (pos: { lat: number; lng: number } | null) => void;
  mapBounds: LatLngBounds | null;
  setMapBounds: (bounds: LatLngBounds | null) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
}

const CoordinateContext = createContext<CoordinateContextValue | undefined>(undefined);

export function CoordinateProvider({ children }: { children: React.ReactNode }) {
  const [cursorPosition, setCursorPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [zoomLevel, setZoomLevel] = useState(13); // Default zoom

  return (
    <CoordinateContext.Provider value={{
      cursorPosition, setCursorPosition,
      mapBounds, setMapBounds,
      zoomLevel, setZoomLevel
    }}>
      {children}
    </CoordinateContext.Provider>
  );
}

export const useCoordinates = () => {
  const context = useContext(CoordinateContext);
  if (!context) throw new Error("useCoordinates must be used within CoordinateProvider");
  return context;
};
