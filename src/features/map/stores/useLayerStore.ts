import { create } from "zustand";

interface LayerState {
  activeBasemap: string;
  activeOverlays: string[];
  
  // Actions
  setActiveBasemap: (basemapId: string) => void;
  toggleOverlay: (overlayId: string, visible: boolean) => void;
  resetLayers: () => void;
}

const DEFAULT_BASEMAP = "google-satellite";
const DEFAULT_OVERLAYS = ["rs-plot-vector", "rajuk-boundary", "ms-mouza-red", "rs-mouza-tile"];

export const useLayerStore = create<LayerState>((set) => ({
  activeBasemap: DEFAULT_BASEMAP,
  activeOverlays: DEFAULT_OVERLAYS,

  setActiveBasemap: (basemapId: string) => set({ activeBasemap: basemapId }),
  
  toggleOverlay: (overlayId: string, visible: boolean) => set((state) => ({
    activeOverlays: visible 
      ? [...state.activeOverlays.filter(id => id !== overlayId), overlayId]
      : state.activeOverlays.filter(id => id !== overlayId)
  })),

  resetLayers: () => set({
    activeBasemap: DEFAULT_BASEMAP,
    activeOverlays: DEFAULT_OVERLAYS
  })
}));
