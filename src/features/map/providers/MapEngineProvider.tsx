"use client";

import React from "react";
import { MapProvider } from "./MapProvider";
import { LayerProvider } from "./LayerProvider";
import { SelectionProvider } from "./SelectionProvider";
import { PopupProvider } from "./PopupProvider";
import { ToolbarProvider } from "./ToolbarProvider";
import { CoordinateProvider } from "./CoordinateProvider";

export function MapEngineProvider({ children }: { children: React.ReactNode }) {
  return (
    <MapProvider>
      <LayerProvider>
        <SelectionProvider>
          <PopupProvider>
            <ToolbarProvider>
              <CoordinateProvider>
                {children}
              </CoordinateProvider>
            </ToolbarProvider>
          </PopupProvider>
        </SelectionProvider>
      </LayerProvider>
    </MapProvider>
  );
}
