"use client";

import React, { createContext, useContext, useState } from "react";

export type ToolbarAction = "select" | "measure" | "draw" | "none";
export type ToolbarPanel = "layers" | "basemap" | "bookmarks" | "none";

interface ToolbarContextValue {
  activeAction: ToolbarAction;
  setActiveAction: (action: ToolbarAction) => void;
  activePanel: ToolbarPanel;
  setActivePanel: (panel: ToolbarPanel) => void;
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}

const ToolbarContext = createContext<ToolbarContextValue | undefined>(undefined);

export function ToolbarProvider({ children }: { children: React.ReactNode }) {
  const [activeAction, setActiveAction] = useState<ToolbarAction>("none");
  const [activePanel, setActivePanel] = useState<ToolbarPanel>("none");
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <ToolbarContext.Provider value={{
      activeAction, setActiveAction,
      activePanel, setActivePanel,
      isFullscreen, setIsFullscreen
    }}>
      {children}
    </ToolbarContext.Provider>
  );
}

export const useToolbar = () => {
  const context = useContext(ToolbarContext);
  if (!context) throw new Error("useToolbar must be used within ToolbarProvider");
  return context;
};
