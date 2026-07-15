"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { MapController } from "../services/MapController";

interface MapContextValue {
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
  controller: MapController;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  const controller: MapController = {
    zoomToBounds: useCallback((bounds: LatLngBoundsExpression) => {
      if (map) {
        map.fitBounds(bounds);
      }
    }, [map]),

    flyToLocation: useCallback((latLng: LatLngExpression, zoom?: number) => {
      if (map) {
        map.flyTo(latLng, zoom || map.getZoom());
      }
    }, [map]),

    fitVisibleLayers: useCallback(() => {
      // Stub for now. Requires querying active layers' bounds.
    }, [map]),

    invalidateSize: useCallback(() => {
      if (map) {
        map.invalidateSize();
      }
    }, [map]),
  };

  return (
    <MapContext.Provider value={{ map, setMap, controller }}>
      {children}
    </MapContext.Provider>
  );
}

export const useMapEngine = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapEngine must be used within MapProvider");
  }
  return context;
};
