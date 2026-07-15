"use client";

import React, { createContext, useContext, useState } from "react";

interface SelectionContextValue {
  selectedRsId: number | null;
  setSelectedRsId: (id: number | null) => void;
  hoveredFeatureId: number | null;
  setHoveredFeatureId: (id: number | null) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedRsId, setSelectedRsId] = useState<number | null>(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<number | null>(null);

  const clearSelection = () => {
    setSelectedRsId(null);
    setHoveredFeatureId(null);
  };

  return (
    <SelectionContext.Provider value={{
      selectedRsId,
      setSelectedRsId,
      hoveredFeatureId,
      setHoveredFeatureId,
      clearSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("useSelection must be used within SelectionProvider");
  return context;
};
