"use client";

import type { ReactNode, RefObject } from "react";
import {
  LocateFixed,
  MapPin,
  PanelRight,
  Satellite,
  X,
} from "lucide-react";
import type { Map as MapLibreInstance } from "maplibre-gl";

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  mapReady: boolean;
  vectorStatus: string;
  initError: string | null;
  panelOpen: boolean;
  setPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isAdvanced: boolean;
  publicResultsOpen: boolean;
  results: unknown[];
  setTab: (tab: string) => void;
  children?: ReactNode;
  activeDetails?: ReactNode;
};

export default function MapLibreMapView({
  containerRef,
  mapReady,
  vectorStatus,
  initError,
  panelOpen,
  setPanelOpen,
  isAdvanced,
  publicResultsOpen,
  results,
  setTab,
  children,
  activeDetails,
}: Props) {
  if (initError) {
    return (
      <div className="grid h-full min-h-[50vh] place-items-center bg-background p-6 text-center">
        <div>
          <p className="font-bold text-destructive">মানচিত্র চালু করা যায়নি</p>
          <p className="mt-2 text-sm text-muted-foreground">{initError}</p>
          <button className="mt-4 rounded-lg border px-4 py-2" onClick={() => window.location.reload()}>
            পুনরায় চেষ্টা
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full [&_.maplibregl-map]:!h-full [&_.maplibregl-map]:!w-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full"
        style={{ width: "100%", height: "100%", minHeight: 480 }}
        aria-label="ভূমি তথ্য মানচিত্র"
      />

      <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] items-center gap-2">
        <button
          onClick={() => setPanelOpen((value) => !value)}
          className="rounded-xl border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur hover:bg-muted"
          aria-label="প্যানেল"
        >
          {panelOpen ? <X size={19} /> : <PanelRight size={19} />}
        </button>
      </div>

      <div className="absolute bottom-20 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow backdrop-blur md:bottom-4">
        <span className={`h-2 w-2 rounded-full ${mapReady ? "bg-green-500" : "bg-amber-500"}`} />
        {mapReady ? vectorStatus || "MapLibre WebGL" : "মানচিত্র প্রস্তুত হচ্ছে…"}
      </div>

      {children}

      {activeDetails}
    </div>
  );
}
