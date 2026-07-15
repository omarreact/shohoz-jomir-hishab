"use client";

import React, { createContext, useContext, useState } from "react";
import { LayerRegistry } from "../layers/registry";

interface LayerContextValue {
  activeBasemap: string;
  activeOverlays: string[];
  setActiveBasemap: (id: string) => void;
  toggleOverlay: (id: string, visible: boolean) => void;
}

const LayerContext = createContext<LayerContextValue | undefined>(undefined);

export function LayerProvider({ children }: { children: React.ReactNode }) {
  const [activeBasemap, setActiveBasemap] = useState<string>(
    LayerRegistry.getBasemaps().find(b => b.defaultVisible)?.id || ""
  );

  const [activeOverlays, setActiveOverlays] = useState<string[]>(
    LayerRegistry.getOverlays().filter(o => o.defaultVisible).map(o => o.id)
  );

  const toggleOverlay = (id: string, visible: boolean) => {
    setActiveOverlays((prev) => 
      visible 
        ? [...prev.filter(x => x !== id), id]
        : prev.filter(x => x !== id)
    );
  };

  return (
    <LayerContext.Provider value={{ activeBasemap, activeOverlays, setActiveBasemap, toggleOverlay }}>
      {children}
    </LayerContext.Provider>
  );
}

export const useLayers = () => {
  const context = useContext(LayerContext);
  if (!context) throw new Error("useLayers must be used within LayerProvider");
  return context;
};
