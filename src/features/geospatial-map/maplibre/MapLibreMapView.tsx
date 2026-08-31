"use client";

import {
  Database,
  Layers3,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MousePointer2,
  PanelRight,
  Search,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import {
  BASemap_LABELS,
  GOOGLE_EARTH_2003_URL,
  LAYERS,
  PUBLIC_BASEMAP_KEYS,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import type { BasemapKey } from "./types";

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  initError: string | null;
  mapReady: boolean;
  vectorStatus: string;
  basemap: BasemapKey;
  setBasemap: (key: BasemapKey) => void;
  plotNo: string;
  setPlotNo: (value: string) => void;
  searching: boolean;
  searchPlots: () => void;
  goToMyLocation: () => void;
  locating: boolean;
  identifyMode: boolean;
  setIdentifyMode: (value: boolean | ((current: boolean) => boolean)) => void;
  panelOpen: boolean;
  setPanelOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  tab: Tab;
  setTab: (tab: Tab) => void;
  layers: Record<LayerKey, boolean>;
  setLayers: (value: Record<LayerKey, boolean> | ((current: Record<LayerKey, boolean>) => Record<LayerKey, boolean>)) => void;
  opacity: Record<LayerKey, number>;
  setOpacity: (value: Record<LayerKey, number> | ((current: Record<LayerKey, number>) => Record<LayerKey, number>)) => void;
  showRsBoundary: boolean;
  setShowRsBoundary: (value: boolean | ((current: boolean) => boolean)) => void;
  showMsBoundary: boolean;
  setShowMsBoundary: (value: boolean | ((current: boolean) => boolean)) => void;
  results: RajukPlotFeature[];
  setResults: (value: RajukPlotFeature[]) => void;
  selected: RajukPlotFeature | null;
  selectResult: (feature: RajukPlotFeature) => void;
  toast: string;
  isAdvanced: boolean;
  publicResultsOpen: boolean;
  routingCalculator: "khatiyan" | "faraez" | null;
  validateAndRoute: (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => void;
  activeDetails: Array<{ label: string; value: string }>;
};

export default function MapLibreMapView({
  containerRef,
  initError,
  mapReady,
  vectorStatus,
  basemap,
  setBasemap,
  plotNo,
  setPlotNo,
  searching,
  searchPlots,
  goToMyLocation,
  locating,
  identifyMode,
  setIdentifyMode,
  panelOpen,
  setPanelOpen,
  tab,
  setTab,
  layers,
  setLayers,
  opacity,
  setOpacity,
  showRsBoundary,
  setShowRsBoundary,
  showMsBoundary,
  setShowMsBoundary,
  results,
  setResults,
  selected,
  selectResult,
  toast,
  isAdvanced,
  publicResultsOpen,
  routingCalculator,
  validateAndRoute,
  activeDetails,
}: Props) {
  if (initError) {
    return <div className="grid h-full min-h-[50vh] place-items-center bg-background p-6 text-center"><div><p className="font-bold text-destructive">মানচিত্র চালু করা যায়নি</p><p className="mt-2 text-sm text-muted-foreground">{initError}</p><button className="mt-4 rounded-lg border px-4 py-2" onClick={() => window.location.reload()}>পুনরায় চেষ্টা</button></div></div>;
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900">
      <div ref={containerRef} className="absolute inset-0 h-full w-full [&_.maplibregl-map]:!h-full [&_.maplibregl-map]:!w-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full" style={{ width: "100%", height: "100%", minHeight: 480 }} aria-label="ভূমি তথ্য মানচিত্র" />

      <div className="absolute left-2 top-2 z-40 flex max-w-[calc(100%-4.5rem)] items-center gap-1.5 sm:left-4 sm:top-4 sm:max-w-[calc(100%-2rem)] sm:gap-2">
        <div className="flex min-w-0 items-center rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur">
          <MapIcon className="ml-3 shrink-0 text-primary" size={18} />
          <input value={plotNo} onChange={(event) => setPlotNo(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchPlots(); }} placeholder="দাগ নম্বর" className="w-24 bg-transparent px-2 py-2 text-sm outline-none sm:w-44 sm:px-3 sm:py-2.5" aria-label="দাগ নম্বর" />
          <button onClick={() => void searchPlots()} disabled={searching} className="border-l border-border p-2.5 text-primary hover:bg-muted disabled:opacity-50" aria-label="দাগ খুঁজুন">{searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}</button>
        </div>
        <button onClick={goToMyLocation} disabled={locating} className="rounded-xl border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur hover:bg-muted" aria-label="আমার অবস্থান">{locating ? <Loader2 className="animate-spin" size={19} /> : <LocateFixed size={19} />}</button>
      </div>

      <div className="absolute right-2 top-2 z-40 flex gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
        <button onClick={() => setIdentifyMode((value) => !value)} className={`rounded-xl border border-border p-2.5 shadow-lg backdrop-blur ${identifyMode ? "bg-primary text-primary-foreground" : "bg-background/95"}`} aria-label="দাগ শনাক্ত করুন"><MousePointer2 size={19} /></button>
        <button onClick={() => setPanelOpen((value) => !value)} className="rounded-xl border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur hover:bg-muted" aria-label="প্যানেল">{panelOpen ? <X size={19} /> : <PanelRight size={19} />}</button>
      </div>

      <div className="absolute bottom-20 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow backdrop-blur md:bottom-4">
        <span className={`h-2 w-2 rounded-full ${mapReady ? "bg-green-500" : "bg-amber-500"}`} />
        {mapReady ? (vectorStatus || "MapLibre WebGL") : "মানচিত্র প্রস্তুত হচ্ছে…"}
      </div>

      {basemap === "satellite2003" && (
        <a href={GOOGLE_EARTH_2003_URL} target="_blank" rel="noreferrer" className="absolute bottom-20 right-4 z-20 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow backdrop-blur hover:bg-muted md:bottom-4">২০০৩ ঐতিহাসিক উৎস ↗</a>
      )}

      {panelOpen && (
        <aside className="absolute bottom-0 right-0 top-0 z-30 flex w-full max-w-md flex-col border-l border-border bg-background/95 shadow-2xl backdrop-blur md:bottom-4 md:right-4 md:top-4 md:rounded-2xl md:border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-bold">মানচিত্র নিয়ন্ত্রণ</div>
            <button onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 hover:bg-muted" aria-label="বন্ধ"><X size={18} /></button>
          </div>
          <div className="flex gap-1 border-b border-border p-2">
            {(["layers", "basemap", "results"] as Tab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${tab === item ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {item === "layers" ? <Layers3 size={15} /> : item === "basemap" ? <MapIcon size={15} /> : <Database size={15} />}
                {item === "layers" ? "লেয়ার" : item === "basemap" ? "বেসম্যাপ" : `ফলাফল (${results.length})`}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tab === "layers" && (
              <div className="space-y-3">
                {LAYERS.map((layer) => {
                  const locked = !isAdvanced && (layer.key === "dap" || layer.key === "flood" || layer.key === "boundary" || layer.key === "transport");
                  return (
                    <div key={layer.key} className={`rounded-xl border p-3 ${locked ? "opacity-50" : ""}`}>
                      <label className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{layer.label}</span>
                        <input type="checkbox" checked={layers[layer.key]} disabled={locked} onChange={(event) => setLayers((current) => ({ ...current, [layer.key]: event.target.checked }))} />
                      </label>
                      <p className="mt-1 text-xs text-muted-foreground">{layer.description}</p>
                      {layers[layer.key] && !locked && (
                        <input type="range" min={0.1} max={1} step={0.05} value={opacity[layer.key]} onChange={(event) => setOpacity((current) => ({ ...current, [layer.key]: Number(event.target.value) }))} className="mt-2 w-full" />
                      )}
                    </div>
                  );
                })}
                <div className="rounded-xl border p-3">
                  <label className="flex items-center justify-between gap-3 text-sm font-semibold"><span>RS সীমানা</span><input type="checkbox" checked={showRsBoundary} onChange={(event) => setShowRsBoundary(event.target.checked)} /></label>
                  <label className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold"><span>MS সীমানা</span><input type="checkbox" checked={showMsBoundary} onChange={(event) => setShowMsBoundary(event.target.checked)} /></label>
                </div>
              </div>
            )}
            {tab === "basemap" && (
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BASemap_LABELS) as BasemapKey[]).map((key) => {
                  const locked = !PUBLIC_BASEMAP_KEYS.includes(key) && !isAdvanced;
                  return <button key={key} disabled={locked} onClick={() => setBasemap(key)} className={`rounded-xl border p-4 text-left ${basemap === key ? "border-primary bg-primary/5" : "border-border"} ${locked ? "cursor-not-allowed opacity-40" : "hover:bg-muted"}`}><div className="text-lg">{key === "satellite" || key === "satellite2003" ? "◈" : key === "light" ? "□" : "⊕"}</div><div className="mt-2 text-sm font-bold">{BASemap_LABELS[key]}</div>{locked && <div className="mt-1 text-[10px] text-muted-foreground">অ্যাডভান্সড অ্যাক্সেস</div>}</button>;
                })}
              </div>
            )}
            {tab === "results" && (
              <div className="space-y-3">
                {results.length === 0 ? <p className="text-sm text-muted-foreground">কোনো ফলাফল নেই। দাগ খুঁজুন বা মানচিত্রে ক্লিক করুন।</p> : results.map((feature, index) => {
                  const attrs = feature.attributes || {};
                  const label = String(attrs.plot_no ?? attrs.PLOT_NO ?? attrs.dag_no ?? attrs.DAG_NO ?? feature.plotId ?? index + 1);
                  const active = selected?.plotId === feature.plotId;
                  return (
                    <div key={`${feature.plotId}-${index}`} className={`rounded-xl border p-3 ${active ? "border-primary bg-primary/5" : "border-border"}`}>
                      <button type="button" onClick={() => selectResult(feature)} className="w-full text-left">
                        <div className="text-sm font-bold">দাগ {label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{String(attrs.mouza ?? attrs.MOUZA ?? attrs.mauza_name ?? "")} · {feature.layerKind?.toUpperCase() || "RS/MS"}</div>
                      </button>
                      {active && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button disabled={routingCalculator !== null} onClick={() => void validateAndRoute("khatiyan", feature)} className="rounded-lg bg-primary px-2 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{routingCalculator === "khatiyan" ? <Loader2 className="mx-auto animate-spin" size={15} /> : "খতিয়ান হিসাব করুন"}</button>
                          <button disabled={routingCalculator !== null} onClick={() => void validateAndRoute("faraez", feature)} className="rounded-lg border px-2 py-2 text-xs font-bold disabled:opacity-50">{routingCalculator === "faraez" ? <Loader2 className="mx-auto animate-spin" size={15} /> : "ফারায়েজ"}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {results.length > 0 && <button onClick={() => setResults([])} className="w-full rounded-lg border py-2 text-xs font-semibold hover:bg-muted">ফলাফল মুছুন</button>}
              </div>
            )}
          </div>
          {selected && activeDetails.length > 0 && (
            <div className="border-t border-border p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">নির্বাচিত দাগ</div>
              <div className="grid grid-cols-2 gap-2">{activeDetails.map(({ label, value }) => <div key={label} className="rounded-lg bg-muted/50 px-2 py-1.5"><div className="text-[10px] text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>)}</div>
            </div>
          )}
        </aside>
      )}

      {isAdvanced && <div className="absolute left-1/2 top-4 z-10 hidden -translate-x-1/2 rounded-full border border-primary/20 bg-background/90 px-3 py-1.5 text-xs font-bold text-primary shadow backdrop-blur sm:block">Advanced GIS</div>}
      {!isAdvanced && publicResultsOpen && results.length > 0 && !panelOpen && <button onClick={() => { setPanelOpen(true); setTab("results"); }} className="absolute bottom-24 right-4 z-20 rounded-xl border border-border bg-background/95 px-4 py-3 text-sm font-bold shadow-lg md:bottom-16">ফলাফল দেখুন ({results.length})</button>}

      {toast && <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-xl" role="status">{toast}</div>}
    </div>
  );
}
