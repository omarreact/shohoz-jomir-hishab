"use client";

import {
  Loader2,
  LocateFixed,
  MousePointer2,
  PanelRight,
  Search,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import {
  GOOGLE_EARTH_2003_URL,
  LAYERS,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import type { BasemapKey } from "./types";
import {
  detailRows,
  isMsFeature,
  msNumber,
  rsNumber,
} from "./mapUtils";

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

function PlotCard({
  kind,
  feature,
  active,
  onSelect,
}: {
  kind: "rs" | "ms";
  feature: RajukPlotFeature;
  active: boolean;
  onSelect: () => void;
}) {
  const rows = detailRows(feature, kind);
  const title = kind === "rs" ? rsNumber(feature) : msNumber(feature);
  const badgeClass = kind === "rs" ? "bg-blue-600 text-white" : "bg-violet-600 text-white";
  const ringClass = active
    ? kind === "rs"
      ? "border-blue-500 ring-2 ring-blue-400/40"
      : "border-violet-500 ring-2 ring-violet-400/40"
    : "border-white/10";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border bg-slate-900/80 p-3 text-left shadow-lg backdrop-blur ${ringClass}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${badgeClass}`}>{kind.toUpperCase()}</span>
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <div className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs">
            <span className="shrink-0 text-slate-400">{label}</span>
            <span className="text-right font-semibold text-slate-100">{value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

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
  routingCalculator,
  validateAndRoute,
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

  const rsResults = results.filter((f) => !isMsFeature(f));
  const msResults = results.filter((f) => isMsFeature(f));
  const showResults = results.length > 0;
  const streetActive = basemap === "light" || basemap === "osm";
  const satActive = basemap === "satellite" || basemap === "satellite2003";

  return (
    <div className="relative h-[100dvh] min-h-screen w-full overflow-hidden bg-slate-900 [&_.maplibregl-ctrl-bottom-right]:!bottom-16 [&_.maplibregl-ctrl-bottom-right]:!left-3 [&_.maplibregl-ctrl-bottom-right]:!right-auto [&_.maplibregl-ctrl-bottom-right]:!z-40">
      <div
        ref={containerRef}
        className="absolute inset-0 h-[100dvh] w-full [&_.maplibregl-map]:!h-full [&_.maplibregl-map]:!w-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full"
        style={{ width: "100%", height: "100dvh", minHeight: "100vh" }}
        aria-label="ভূমি তথ্য মানচিত্র"
      />

      <div className="pointer-events-none absolute left-3 top-3 z-40 flex max-w-[min(100%-1.5rem,20rem)] flex-col gap-2 sm:left-4 sm:top-4">
        <div className="pointer-events-auto flex min-w-0 items-center rounded-2xl border border-white/15 bg-slate-950/90 shadow-xl backdrop-blur">
          <input
            value={plotNo}
            onChange={(e) => setPlotNo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void searchPlots();
            }}
            placeholder="দাগ নম্বর"
            className="w-28 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-400 sm:w-40"
            aria-label="দাগ নম্বর"
          />
          <button
            onClick={() => void searchPlots()}
            disabled={searching}
            className="border-l border-white/10 p-2.5 text-emerald-400 hover:bg-white/5 disabled:opacity-50"
            aria-label="দাগ খুঁজুন"
          >
            {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-3 z-40 -translate-x-1/2 sm:top-4">
        <div className="pointer-events-auto flex items-center rounded-full border border-white/15 bg-slate-950/90 p-1 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => setBasemap("light")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
              streetActive ? "bg-white text-slate-900 shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            রাস্তার মানচিত্র
          </button>
          <button
            type="button"
            onClick={() => setBasemap("satellite")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
              satActive ? "bg-white text-slate-900 shadow" : "text-slate-300 hover:text-white"
            }`}
          >
            স্যাটেলাইট
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-3 z-40 sm:left-4">
        <button
          type="button"
          onClick={goToMyLocation}
          disabled={locating}
          className="rounded-xl border border-white/15 bg-slate-950/90 p-2.5 text-white shadow-xl backdrop-blur hover:bg-white/10 disabled:opacity-60"
          aria-label="বর্তমান অবস্থান"
          title="বর্তমান অবস্থান"
        >
          {locating ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
        </button>
      </div>

      {isAdvanced && (
        <div className="absolute right-3 top-3 z-40 flex gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
          <button
            onClick={() => setIdentifyMode((v) => !v)}
            className={`rounded-xl border border-white/15 p-2.5 shadow-lg backdrop-blur ${
              identifyMode ? "bg-emerald-600 text-white" : "bg-slate-950/90 text-white hover:bg-white/10"
            }`}
            aria-label="দাগ শনাক্ত করুন"
          >
            <MousePointer2 size={19} />
          </button>
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="rounded-xl border border-white/15 bg-slate-950/90 p-2.5 text-white shadow-lg backdrop-blur hover:bg-white/10"
            aria-label="প্যানেল"
          >
            {panelOpen ? <X size={19} /> : <PanelRight size={19} />}
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-20 z-20 flex max-w-[45%] items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-200 shadow backdrop-blur sm:left-20">
        <span className={`h-2 w-2 shrink-0 rounded-full ${mapReady ? "bg-emerald-400" : "bg-amber-400"}`} />
        {mapReady ? vectorStatus || "MapLibre" : "মানচিত্র প্রস্তুত হচ্ছে…"}
      </div>

      {basemap === "satellite2003" && (
        <a
          href={GOOGLE_EARTH_2003_URL}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-4 right-3 z-20 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-200 shadow backdrop-blur hover:bg-white/10 sm:right-4"
        >
          ২০০৩ ঐতিহাসিক উৎস ↗
        </a>
      )}

      {showResults && (
        <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[48vh] overflow-hidden rounded-t-3xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur sm:bottom-4 sm:left-4 sm:right-auto sm:max-h-[70vh] sm:w-full sm:max-w-lg sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-sm font-bold text-white">ফলাফল</div>
              <div className="text-xs text-slate-400">
                {rsResults.length} RS · {msResults.length} MS
              </div>
            </div>
            <button type="button" onClick={() => setResults([])} className="rounded-full p-1.5 text-slate-300 hover:bg-white/10" aria-label="বন্ধ">
              <X size={18} />
            </button>
          </div>
          <div className="grid max-h-[40vh] gap-3 overflow-y-auto p-3 sm:max-h-[60vh] sm:grid-cols-2">
            {rsResults.map((feature, i) => (
              <PlotCard
                key={`rs-${feature.plotId ?? i}`}
                kind="rs"
                feature={feature}
                active={selected?.plotId === feature.plotId}
                onSelect={() => selectResult(feature)}
              />
            ))}
            {msResults.map((feature, i) => (
              <PlotCard
                key={`ms-${feature.plotId ?? i}`}
                kind="ms"
                feature={feature}
                active={selected?.plotId === feature.plotId}
                onSelect={() => selectResult(feature)}
              />
            ))}
          </div>
          {selected && (
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
              <button
                disabled={routingCalculator !== null}
                onClick={() => void validateAndRoute("khatiyan", selected)}
                className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {routingCalculator === "khatiyan" ? <Loader2 className="mx-auto animate-spin" size={15} /> : "খতিয়ান হিসাব"}
              </button>
              <button
                disabled={routingCalculator !== null}
                onClick={() => void validateAndRoute("faraez", selected)}
                className="rounded-xl border border-white/15 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {routingCalculator === "faraez" ? <Loader2 className="mx-auto animate-spin" size={15} /> : "ফারায়েজ"}
              </button>
            </div>
          )}
        </div>
      )}

      {panelOpen && isAdvanced && (
        <aside className="absolute bottom-0 right-0 top-0 z-40 flex w-full max-w-sm flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur md:bottom-4 md:right-4 md:top-16 md:rounded-2xl md:border">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="text-sm font-bold text-white">মানচিত্র নিয়ন্ত্রণ</div>
            <button onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10" aria-label="বন্ধ">
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-1 border-b border-white/10 p-2">
            {(["layers", "basemap", "results"] as Tab[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold ${
                  tab === item ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {item === "layers" ? "লেয়ার" : item === "basemap" ? "বেসম্যাপ" : `ফলাফল (${results.length})`}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-slate-100">
            {tab === "layers" && (
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm font-semibold">
                  <span>RS সীমানা + লেবেল</span>
                  <input type="checkbox" checked={showRsBoundary} onChange={(e) => setShowRsBoundary(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm font-semibold">
                  <span>MS সীমানা + লেবেল</span>
                  <input type="checkbox" checked={showMsBoundary} onChange={(e) => setShowMsBoundary(e.target.checked)} />
                </label>
                {LAYERS.map((layer) => {
                  const locked =
                    !isAdvanced && (layer.key === "dap" || layer.key === "flood" || layer.key === "boundary" || layer.key === "transport");
                  return (
                    <div key={layer.key} className={`rounded-xl border border-white/10 p-3 ${locked ? "opacity-45" : ""}`}>
                      <label className="flex items-center justify-between gap-3 text-sm font-semibold">
                        <span>{layer.label}</span>
                        <input
                          type="checkbox"
                          checked={layers[layer.key]}
                          disabled={locked}
                          onChange={(e) => setLayers((c) => ({ ...c, [layer.key]: e.target.checked }))}
                        />
                      </label>
                      <p className="mt-1 text-xs text-slate-400">{layer.description}</p>
                      {layers[layer.key] && !locked && (
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={opacity[layer.key]}
                          onChange={(e) => setOpacity((c) => ({ ...c, [layer.key]: Number(e.target.value) }))}
                          className="mt-2 w-full"
                        />
                      )}
                      {locked && <div className="mt-1 text-[10px] text-slate-500">স্টাফ লগইন প্রয়োজন</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {tab === "basemap" && (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["light", "রাস্তার মানচিত্র"],
                    ["satellite", "স্যাটেলাইট"],
                    ...(isAdvanced ? ([["satellite2003", "স্যাটেলাইট ২০০৩"]] as const) : []),
                  ] as Array<[BasemapKey, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBasemap(key)}
                    className={`rounded-xl border p-4 text-left text-sm font-bold ${
                      basemap === key ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            {tab === "results" && (
              <p className="text-sm text-slate-400">মানচিত্রে ক্লিক করুন বা দাগ খুঁজুন — ফলাফল নিচে দেখাবে।</p>
            )}
          </div>
        </aside>
      )}

      {toast && (
        <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-xl" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
