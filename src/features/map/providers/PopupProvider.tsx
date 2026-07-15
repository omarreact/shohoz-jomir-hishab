"use client";

import React, { createContext, useContext, useState } from "react";

interface InferredData {
  rsData: any;
  landuseData: any;
  floodData: any;
}

interface PopupContextValue {
  clickedPos: { lat: number; lng: number } | null;
  setClickedPos: (pos: { lat: number; lng: number } | null) => void;
  isInferring: boolean;
  setIsInferring: (inferring: boolean) => void;
  elevation: number | null;
  setElevation: (elevation: number | null) => void;
  inferredData: InferredData;
  setInferredData: (data: InferredData) => void;
  clearPopup: () => void;
}

const PopupContext = createContext<PopupContextValue | undefined>(undefined);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [elevation, setElevation] = useState<number | null>(null);
  const [inferredData, setInferredData] = useState<InferredData>({
    rsData: null,
    landuseData: null,
    floodData: null,
  });

  const clearPopup = () => {
    setClickedPos(null);
    setIsInferring(false);
    setElevation(null);
    setInferredData({ rsData: null, landuseData: null, floodData: null });
  };

  return (
    <PopupContext.Provider value={{
      clickedPos, setClickedPos,
      isInferring, setIsInferring,
      elevation, setElevation,
      inferredData, setInferredData,
      clearPopup
    }}>
      {children}
    </PopupContext.Provider>
  );
}

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) throw new Error("usePopup must be used within PopupProvider");
  return context;
};
