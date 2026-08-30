"use client";

import type { RefObject, Dispatch, SetStateAction } from "react";
import type { BasemapKey } from "./types";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import type { LayerKey, Tab } from "./mapConstants";
import {
  BASemap_LABELS,
  GOOGLE_EARTH_2003_URL,
  LAYERS,
  PUBLIC_BASEMAP_KEYS,
} from "./mapConstants";
import {
  Database,
  Layers3,
  LocateFixed,
  Loader2,
  Map as MapIcon,
  MousePointer2,
  PanelRight,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  detailRows,
  formatValue,
  isMsFeature,
  msNumber,
  rsNumber,
} from "./mapUtils";
import { BASEMAP_SOURCE_DEFINITIONS } from "./types";

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  initError: string | null;
  mapReady: boolean;
  vectorStatus: string;
  basemap: BasemapKey;
  setBasemap: Dispatch<SetStateAction<BasemapKey>>;
  plotNo: string;
  setPlotNo: Dispatch<SetStateAction<string>>;
  searching: boolean;
  searchPlots: () => void;
  goToMyLocation: () => void;
  locating: boolean;
  identifyMode: boolean;
  setIdentifyMode: Dispatch<SetStateAction<boolean>>;
  panelOpen: boolean;
  setPanelOpen: Dispatch<SetStateAction<boolean>>;
  tab: Tab;
  setTab: Dispatch<SetStateAction<Tab>>;
  layers: Record<LayerKey, boolean>;
  setLayers: Dispatch<SetStateAction<Record<LayerKey, boolean>>>;
  opacity: Record<LayerKey, number>;
  setOpacity: Dispatch<SetStateAction<Record<LayerKey, number>>>;
  showRsBoundary: boolean;
  setShowRsBoundary: Dispatch<SetStateAction<boolean>>;
  showMsBoundary: boolean;
  setShowMsBoundary: Dispatch<SetStateAction<boolean>>;
  results: RajukPlotFeature[];
  setResults: Dispatch<SetStateAction<RajukPlotFeature[]>>;
  selected: RajukPlotFeature | null;
  selectResult: (feature: RajukPlotFeature) => void;
  toast: string;
  isAdvanced: boolean;
  publicResultsOpen: boolean;
  routingCalculator: "khatiyan" | "faraez" | null;
  validateAndRoute: (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => void;
  activeDetails: ReadonlyArray<readonly [string, string]>;
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
    <div className="relative h-full min-h-[min(70vh,720px)] w-full overflow-hidden bg-background md:min-h-[min(75vh,900px)]">
      <div ref={containerRef} className="absolute inset-0 [&_.maplibregl-map]:!h-full [&_.maplibregl-map]:!w-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full" style={{ width: "100%", height: "100%" }} aria-label="ভূমি তথ্য মানচিত্র" />

      <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] items-center gap-2">
        <div className="flex min-w-0 items-center rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur">
          <MapIcon className="ml-3 shrink-0 text-primary" size={18} />
          <input value={plotNo} onChange={(event) => setPlotNo(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchPlots(); }} placeholder="দাগ নম্বর" className="w-32 bg-transparent px-3 py-2.5 text-sm outline-none sm:w-44" aria-label="দাগ নম্বর" />
          <button onClick={() => void searchPlots()} disabled={searching} className="border-l border-border p-2.5 text-primary hover:bg-muted disabled:opacity-50" aria-label="দাগ খুঁজুন">{searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}</button>
        </div>
        <button onClick={goToMyLocation} disabled={locating} className="rounded-xl border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur hover:bg-muted" aria-label="আমার অবস্থান">{locating ? <Loader2 className="animate-spin" size={19} /> : <LocateFixed size={19} />}</button>
      </div>

      <div className="absolute right-4 top-4 z-20 flex gap-2">
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
          <div className="flex items-center justify-between border-b border-border p-4">
            <div><h2 className="font-bold">জিআইএস ভূমি তথ্য</h2><p className="text-xs text-muted-foreground">MapLibre WebGL</p></div>
            <button onClick={() => setPanelOpen(false)} className="rounded-lg p-2 hover:bg-muted"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-3 border-b border-border">
            {(["layers", "basemap", "results"] as Tab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`flex items-center justify-center gap-1.5 px-2 py-3 text-xs font-bold ${tab === item ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
                {item === "layers" ? <Layers3 size={15} /> : item === "basemap" ? <MapIcon size={15} /> : <Database size={15} />}
                {item === "layers" ? "লেয়ার" : item === "basemap" ? "বেসম্যাপ" : `ফলাফল (${results.length})`}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "layers" && (
              <div className="space-y-3">
                {LAYERS.map((layer) => (
                  <div key={layer.key} className="rounded-xl border border-border p-3">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={Boolean(layers[layer.key])} onChange={(event) => setLayers((current) => ({ ...current, [layer.key]: event.target.checked }))} className="mt-1 h-4 w-4" />
                      <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }} />{layer.label}</div><p className="mt-1 text-xs text-muted-foreground">{layer.description}</p></div>
                    </div>
                    {layers[layer.key] && <div className="mt-3"><label className="mb-1 block text-[11px] text-muted-foreground">অপাসিটি {Math.round(opacity[layer.key] * 100)}%</label><input type="range" min="0" max="100" value={Math.round(opacity[layer.key] * 100)} onChange={(event) => setOpacity((current) => ({ ...current, [layer.key]: Number(event.target.value) / 100 }))} className="w-full" /></div>}
                  </div>
                ))}
                <div className="rounded-xl border border-border p-3">
                  <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={showRsBoundary} onChange={(event) => setShowRsBoundary(event.target.checked)} /> RS polygon boundary</label>
                  <label className="mt-3 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={showMsBoundary} onChange={(event) => setShowMsBoundary(event.target.checked)} /> MS polygon boundary</label>
                </div>
              </div>
            )}

            {tab === "basemap" && (
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(BASEMAP_SOURCE_DEFINITIONS) as BasemapKey[]).map((key) => {
                  const locked = !isAdvanced && !PUBLIC_BASEMAP_KEYS.includes(key);
                  return <button key={key} disabled={locked} onClick={() => setBasemap(key)} className={`rounded-xl border p-4 text-left ${basemap === key ? "border-primary bg-primary/5" : "border-border"} ${locked ? "cursor-not-allowed opacity-40" : "hover:bg-muted"}`}><div className="text-lg">{key === "satellite" || key === "satellite2003" ? "◈" : key === "light" ? "□" : "⊕"}</div><div className="mt-2 text-sm font-bold">{BASemap_LABELS[key]}</div>{locked && <div className="mt-1 text-[10px] text-muted-foreground">অ্যাডভান্সড অ্যাক্সেস</div>}</button>;
                })}
              </div>
            )}

            {tab === "results" && (
              <div className="space-y-4">
                {!results.length && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">কোনো দাগ নির্বাচন বা অনুসন্ধান করুন।</div>}
                {results.length > 0 && <button onClick={() => setResults([])} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><RefreshCw size={14} /> ফলাফল পরিষ্কার</button>}
                {results.map((feature, index) => {
                  const ms = isMsFeature(feature);
                  return (
                    <div key={`${feature.attributes.objectid}-${index}`} className={`rounded-xl border p-3 ${selected?.attributes.objectid === feature.attributes.objectid ? "border-primary bg-primary/5" : "border-border"}`}>
                      <button className="w-full text-left" onClick={() => selectResult(feature)}>
                        <div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ms ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>{ms ? "MS" : "RS"}</span><span className="text-xs text-muted-foreground">#{feature.attributes.objectid}</span></div>
                        <div className="mt-2 text-sm font-bold">{ms ? msNumber(feature) : rsNumber(feature)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatValue(feature.attributes.address_search)}</div>
                      </button>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">{detailRows(feature, ms ? "ms" : "rs").slice(0, 4).map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-2"><div className="text-muted-foreground">{label}</div><div className="mt-0.5 font-semibold">{value}</div></div>)}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button disabled={routingCalculator !== null} onClick={() => void validateAndRoute("khatiyan", feature)} className="rounded-lg bg-primary px-2 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50">{routingCalculator === "khatiyan" ? <Loader2 className="mx-auto animate-spin" size={15} /> : "খতিয়ান হিসাব করুন"}</button>
                        <button disabled={routingCalculator !== null} onClick={() => void validateAndRoute("faraez", feature)} className="rounded-lg border border-primary px-2 py-2 text-xs font-bold text-primary disabled:opacity-50">{routingCalculator === "faraez" ? <Loader2 className="mx-auto animate-spin" size={15} /> : "ফারায়েজ হিসাব করুন"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected && tab !== "results" && (
            <div className="border-t border-border p-4">
              <div className="mb-2 text-sm font-bold">নির্বাচিত প্লট</div>
              <div className="grid grid-cols-2 gap-2 text-xs">{activeDetails.slice(0, 4).map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-2"><div className="text-muted-foreground">{label}</div><div className="font-semibold">{value}</div></div>)}</div>
            </div>
          )}
        </aside>
      )}

      {toast && <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-xl" role="status">{toast}</div>}
      {isAdvanced && <div className="absolute left-1/2 top-4 z-10 hidden -translate-x-1/2 rounded-full border border-primary/20 bg-background/90 px-3 py-1.5 text-xs font-bold text-primary shadow backdrop-blur sm:block">Advanced GIS</div>}
      {!isAdvanced && publicResultsOpen && results.length > 0 && !panelOpen && <button onClick={() => { setPanelOpen(true); setTab("results"); }} className="absolute bottom-24 right-4 z-20 rounded-xl border border-border bg-background/95 px-4 py-3 text-sm font-bold shadow-lg md:bottom-16">ফলাফল দেখুন ({results.length})</button>}
    </div>
  );
}
