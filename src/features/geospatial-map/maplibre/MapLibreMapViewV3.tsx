"use client";

import RajukStyleMapHeader from "./RajukStyleMapHeader";
import RajukPlotFinder, { type PlotSearchOptions } from "./RajukPlotFinder";
import OfficialLandSourceDock from "../components/OfficialLandSourceDock";
import { LEGAL_SURVEY_NOTE } from "../lib/officialLandSources";
import {
  Compass,
  Copy,
  Download,
  Expand,
  ExternalLink,
  History,
  Home,
  Layers3,
  List,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  Minus,
  Plus,
  Printer,
  Satellite,
  Search,
  Settings2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Map as MapLibreInstance } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { formatBanglaNumber } from "@/src/shared/i18n/bangla";
import {
  FREE_IMAGERY_OPTIONS,
  GOOGLE_EARTH_2003_URL,
  GOOGLE_EARTH_HISTORICAL_DOCS_URL,
  LAYERS,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import { DAP_BOUNDS, type BasemapKey } from "./types";
import {
  canToggleRasterLayer,
  defaultRasterLayerVisibility,
  hideAvailableRasterLayers,
  setRasterLayerVisibility,
} from "./layerControlPolicy";
import { detailRows, isMsFeature, msNumber, rsNumber } from "./mapUtils";

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<MapLibreInstance | null>;
  initError: string | null;
  mapReady: boolean;
  vectorStatus: string;
  basemap: BasemapKey;
  setBasemap: (key: BasemapKey) => void;
  plotNo: string;
  setPlotNo: (value: string) => void;
  searching: boolean;
  searchPlots: (options?: PlotSearchOptions) => void;
  goToMyLocation: () => void;
  locating: boolean;
  panelOpen: boolean;
  setPanelOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  tab: Tab;
  setTab: (tab: Tab) => void;
  layers: Record<LayerKey, boolean>;
  setLayers: (
    value:
      | Record<LayerKey, boolean>
      | ((current: Record<LayerKey, boolean>) => Record<LayerKey, boolean>),
  ) => void;
  opacity: Record<LayerKey, number>;
  setOpacity: (
    value:
      | Record<LayerKey, number>
      | ((current: Record<LayerKey, number>) => Record<LayerKey, number>),
  ) => void;
  setShowRsBoundary: (value: boolean | ((current: boolean) => boolean)) => void;
  setShowMsBoundary: (value: boolean | ((current: boolean) => boolean)) => void;
  results: RajukPlotFeature[];
  clearResults: () => void;
  selected: RajukPlotFeature | null;
  selectResult: (feature: RajukPlotFeature) => void;
  toast: string;
  isAdvanced: boolean;
  routingCalculator: "khatiyan" | "faraez" | null;
  validateAndRoute: (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => void;
};

type ToolDef = {
  id: Tab;
  label: string;
  Icon: LucideIcon;
};

const TOOLS: ToolDef[] = [
  { id: "search", label: "দাগ ও মৌজা খুঁজুন", Icon: Search },
  { id: "layers", label: "লেয়ার", Icon: Layers3 },
  { id: "basemap", label: "বেসম্যাপ", Icon: Satellite },
  { id: "history", label: "ঐতিহাসিক স্যাটেলাইট", Icon: History },
  { id: "legend", label: "লেজেন্ড", Icon: List },
  { id: "settings", label: "মানচিত্র সেটিংস", Icon: Settings2 },
];

const TOOL_LABELS: Record<Tab, string> = {
  search: "দাগ ও মৌজা অনুসন্ধান",
  layers: "লেয়ার নিয়ন্ত্রণ",
  basemap: "বেসম্যাপ",
  history: "ঐতিহাসিক স্যাটেলাইট",
  legend: "লেজেন্ড",
  settings: "মানচিত্র সেটিংস",
};

function bn(value: number, digits = 0): string {
  return formatBanglaNumber(value, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

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
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        active
          ? "border-[var(--primary)] bg-[var(--brand-green-faint)] shadow-sm"
          : "border-[var(--border-color)] bg-white hover:bg-[var(--brand-green-faint)]",
      ].join(" ")}
      aria-pressed={active}
    >
      <span className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-[#15535a] px-2.5 py-1 text-base font-bold text-white">
          {kind === "rs" ? "আরএস" : "এমএস"}
        </span>
        <span className="text-base font-bold text-[var(--foreground)]">{title}</span>
      </span>
      <span className="space-y-2">
        {rows.slice(0, 5).map(([label, value]) => (
          <span key={label} className="flex items-start justify-between gap-3 text-base">
            <span className="shrink-0 text-[var(--muted-foreground)]">{label}</span>
            <span className="max-w-[58%] break-words text-right font-semibold text-[var(--foreground)]">
              {value === "—" ? "তথ্য পাওয়া যায়নি" : value}
            </span>
          </span>
        ))}
      </span>
    </button>
  );
}

function CoordinateReadout({
  mapRef,
  mapReady,
}: {
  mapRef: RefObject<MapLibreInstance | null>;
  mapReady: boolean;
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    let frame: number | null = null;
    const updateCenter = () => {
      const center = map.getCenter();
      setPosition({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    };
    const onPointer = (event: { lngLat: { lat: number; lng: number } }) => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setPosition({ lat: event.lngLat.lat, lng: event.lngLat.lng, zoom: map.getZoom() });
      });
    };
    updateCenter();
    map.on("mousemove", onPointer);
    map.on("zoomend", updateCenter);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      map.off("mousemove", onPointer);
      map.off("zoomend", updateCenter);
    };
  }, [mapReady, mapRef]);

  if (!position) return null;

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--brand-green-faint)] p-4">
      <h3 className="text-lg font-black text-[var(--foreground)]">স্থানাঙ্ক</h3>
      <p className="mt-2 break-words text-base leading-7 tabular-nums text-[var(--foreground)]">
        Lat {position.lat.toFixed(6)} · Lon {position.lng.toFixed(6)} · Zoom {position.zoom.toFixed(1)}
      </p>
      <button
        type="button"
        onClick={() => {
          if (!navigator.clipboard?.writeText) {
            setCopied(false);
            return;
          }
          void navigator.clipboard
            .writeText(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`)
            .then(() => setCopied(true))
            .catch(() => setCopied(false));
        }}
        className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-3 text-base font-bold text-[var(--primary)]"
      >
        <Copy size={19} />
        স্থানাঙ্ক কপি
      </button>
      {copied ? <span role="status" className="ml-3 text-base font-semibold text-[var(--primary)]">কপি হয়েছে</span> : null}
    </section>
  );
}

function SettingsButton({
  Icon,
  label,
  onClick,
  pressed,
  disabled,
}: {
  Icon: LucideIcon;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={[
        "flex min-h-12 items-center gap-2 rounded-xl border px-3 text-left text-base font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40",
        pressed
          ? "border-[var(--primary)] bg-[var(--brand-green-soft)] text-[var(--primary)]"
          : "border-[var(--border-color)] bg-white text-[var(--foreground)] hover:bg-[var(--brand-green-faint)]",
      ].join(" ")}
    >
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default function MapLibreMapViewV3({
  containerRef,
  mapRef,
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
  panelOpen,
  setPanelOpen,
  tab,
  setTab,
  layers,
  setLayers,
  opacity,
  setOpacity,
  setShowRsBoundary,
  setShowMsBoundary,
  results,
  clearResults,
  selected,
  selectResult,
  toast,
  isAdvanced,
  routingCalculator,
  validateAndRoute,
}: Props) {
  const [threeD, setThreeD] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const rsResults = useMemo(() => results.filter((feature) => !isMsFeature(feature)), [results]);
  const msResults = useMemo(() => results.filter((feature) => isMsFeature(feature)), [results]);
  const activeLayers = useMemo(() => LAYERS.filter((layer) => layers[layer.key]), [layers]);

  const selectedSearchResult = selected && results.includes(selected) ? selected : null;

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    requestAnimationFrame(() => document.getElementById(`atlas-map-tool-${tab}`)?.focus());
  }, [setPanelOpen, tab]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !panelOpen) return;
      event.preventDefault();
      closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePanel, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [panelOpen, tab]);

  const openTool = (next: Tab) => {
    if (panelOpen && tab === next) {
      setPanelOpen(false);
      return;
    }
    setTab(next);
    setPanelOpen(true);
  };

  const fullExtent = () => {
    mapRef.current?.fitBounds(
      [
        [DAP_BOUNDS[0][1], DAP_BOUNDS[0][0]],
        [DAP_BOUNDS[1][1], DAP_BOUNDS[1][0]],
      ],
      { padding: 50, maxZoom: 13, duration: 450 },
    );
  };

  const resetNorth = () => {
    mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 300 });
    setThreeD(false);
  };

  const toggleThreeD = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !threeD;
    setThreeD(next);
    map.easeTo({ pitch: next ? 55 : 0, duration: 350 });
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const element = mapRef.current?.getContainer().closest("main");
        if (!element) throw new Error("Map container unavailable");
        await element.requestFullscreen();
      }
      window.setTimeout(() => mapRef.current?.resize(), 120);
      setFeedback("");
    } catch {
      setFeedback("এই ব্রাউজারে পূর্ণপর্দা চালু করা যায়নি।");
    }
  };

  const savePng = () => {
    try {
      const canvas = mapRef.current?.getCanvas();
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      if (!url.startsWith("data:image/png")) throw new Error("Export failed");
      const link = document.createElement("a");
      link.download = "landbd-gis-map.png";
      link.href = url;
      link.click();
      setFeedback("");
    } catch {
      setFeedback("বর্তমান বেসম্যাপ উৎস PNG সংরক্ষণের অনুমতি দেয় না।");
    }
  };

  if (initError) {
    return (
      <div className="grid h-full place-items-center bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
        <div className="max-w-md rounded-[28px] border border-[var(--border-color)] bg-white p-8 shadow-xl">
          <MapIcon className="mx-auto text-[var(--primary)]" size={30} />
          <h2 className="mt-3 text-xl font-black">মানচিত্র চালু হয়নি</h2>
          <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">{initError}</p>
          <button
            type="button"
            className="mt-5 min-h-12 rounded-full bg-[var(--primary)] px-6 text-base font-bold text-white"
            onClick={() => window.location.reload()}
          >
            পুনরায় চেষ্টা
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-full min-h-0 w-full overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)] [&_.maplibregl-ctrl-group]:!hidden">
      <div
        ref={containerRef}
        aria-label="বাংলাদেশের GIS মানচিত্র · আরএস এমএস ও স্যাটেলাইট"
        className="absolute inset-0 h-full w-full [&_.maplibregl-map]:!h-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full"
      />

      <div className="absolute inset-x-0 top-0 z-[90]">
        <RajukStyleMapHeader />
      </div>

      <nav
        aria-label="GIS মানচিত্র সাইডবার"
        aria-orientation="vertical"
        className="absolute left-2 top-[92px] z-[82] flex flex-col gap-2 sm:left-3"
      >
        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/97 p-1.5 shadow-[0_12px_40px_rgba(11,45,30,.16)] backdrop-blur-sm">
          {TOOLS.map(({ id, label, Icon }) => {
            const active = panelOpen && tab === id;
            return (
              <button
                key={id}
                id={`atlas-map-tool-${id}`}
                type="button"
                onClick={() => openTool(id)}
                aria-label={label}
                title={label}
                aria-expanded={active}
                aria-controls="atlas-map-workspace-panel"
                className={[
                  "grid h-12 w-12 place-items-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  active
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--primary)] hover:bg-[var(--brand-green-faint)]",
                ].join(" ")}
              >
                <Icon size={21} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setPanelOpen(false);
            goToMyLocation();
          }}
          disabled={!mapReady || locating}
          aria-label="আমার অবস্থান"
          title="আমার অবস্থান"
          className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/97 text-[var(--primary)] shadow-lg transition hover:bg-[var(--brand-green-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locating ? <Loader2 size={21} className="animate-spin" /> : <LocateFixed size={21} />}
        </button>
      </nav>

      <aside
        id="atlas-map-workspace-panel"
        aria-label={TOOL_LABELS[tab]}
        aria-hidden={!panelOpen}
        className={[
          "absolute bottom-2 left-2 right-2 z-[78] max-h-[72dvh] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white/98 shadow-[0_20px_70px_rgba(11,45,30,.18)] backdrop-blur-md sm:bottom-3 sm:left-[76px] sm:right-auto sm:top-[92px] sm:max-h-none sm:w-[min(390px,calc(100vw-92px))]",
          panelOpen ? "flex flex-col" : "hidden",
        ].join(" ")}
      >
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--border-color)] bg-[var(--brand-green-faint)] px-4 py-3">
          <h2 className="text-lg font-black text-[var(--foreground)]">{TOOL_LABELS[tab]}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePanel}
            aria-label="প্যানেল বন্ধ"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[var(--primary)] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-width:thin]">
          {tab === "search" ? (
            <div className="space-y-4">
              <RajukPlotFinder
                plotNo={plotNo}
                setPlotNo={setPlotNo}
                searching={searching}
                searchPlots={searchPlots}
                vectorStatus={vectorStatus}
              />

              {results.length ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold">
                      আরএস {bn(rsResults.length)} · এমএস {bn(msResults.length)}
                    </p>
                    <button
                      type="button"
                      onClick={clearResults}
                      className="min-h-11 rounded-xl border border-[var(--border-color)] px-3 text-base font-bold text-[var(--primary)]"
                    >
                      ফলাফল মুছুন
                    </button>
                  </div>
                  <div className="space-y-2">
                    {rsResults.map((feature, index) => (
                      <PlotCard
                        key={"rs-" + String(feature.plotId ?? index)}
                        kind="rs"
                        feature={feature}
                        active={selected === feature}
                        onSelect={() => selectResult(feature)}
                      />
                    ))}
                    {msResults.map((feature, index) => (
                      <PlotCard
                        key={"ms-" + String(feature.plotId ?? index)}
                        kind="ms"
                        feature={feature}
                        active={selected === feature}
                        onSelect={() => selectResult(feature)}
                      />
                    ))}
                  </div>
                  {selectedSearchResult ? (
                    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--brand-green-faint)] p-3">
                      <p className="mb-3 text-base font-black text-[var(--primary)]">নির্বাচিত দাগের কাজ</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={routingCalculator !== null}
                          onClick={() => void validateAndRoute("khatiyan", selectedSearchResult)}
                          className="min-h-12 rounded-xl bg-[var(--primary)] px-3 text-base font-bold text-white disabled:opacity-50"
                        >
                          খতিয়ান হিসাব
                        </button>
                        <button
                          type="button"
                          disabled={routingCalculator !== null}
                          onClick={() => void validateAndRoute("faraez", selectedSearchResult)}
                          className="min-h-12 rounded-xl border border-[var(--border-color)] bg-white px-3 text-base font-bold disabled:opacity-50"
                        >
                          ফারায়েজ
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--border-color)] bg-white p-4 text-base leading-7 text-[var(--muted-foreground)]">
                  দাগ নম্বর, জেলা, উপজেলা বা মৌজা দিয়ে খুঁজুন। ম্যাপে সরাসরি দাগে ক্লিক করলে শুধু দাগের তথ্য popup-এ দেখাবে।
                </p>
              )}
            </div>
          ) : tab === "layers" ? (
            <div className="space-y-3">
              <p className="text-base leading-7 text-[var(--muted-foreground)]">
                RS (কালো) ও MS (লাল) সহ উপলভ্য লেয়ার চালু বা বন্ধ করুন। বন্ধ করলে সংশ্লিষ্ট vector boundary ও label-ও লুকাবে।
              </p>
              {LAYERS.map((layer) => (
                <section key={layer.key} className="rounded-2xl border border-[var(--border-color)] bg-white p-4">
                  <label className="flex cursor-pointer items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-base font-extrabold">
                        <i
                          aria-hidden="true"
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: layer.color }}
                        />
                        {layer.label}
                      </span>
                      <span className="mt-1 block text-base leading-7 text-[var(--muted-foreground)]">
                        {layer.description}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers[layer.key]}
                      disabled={!canToggleRasterLayer(layer.key, isAdvanced)}
                      onChange={(event) =>
                        setLayers((current) =>
                          setRasterLayerVisibility(
                            current,
                            layer.key,
                            event.target.checked,
                            isAdvanced,
                          ),
                        )
                      }
                      className="mt-1 h-6 w-6 shrink-0 accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </label>
                  {canToggleRasterLayer(layer.key, isAdvanced) ? (
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-base font-bold text-[var(--muted-foreground)]">
                        <span>স্বচ্ছতা</span>
                        <span>{bn(opacity[layer.key] * 100)}%</span>
                      </div>
                      <input
                        aria-label={layer.label + " স্বচ্ছতা"}
                        type="range"
                        min="0"
                        max="1"
                        step=".05"
                        value={opacity[layer.key]}
                        onChange={(event) =>
                          setOpacity((current) => ({
                            ...current,
                            [layer.key]: Number(event.target.value),
                          }))
                        }
                        className="w-full accent-[var(--primary)]"
                      />
                    </div>
                  ) : null}
                </section>
              ))}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setLayers((current) => hideAvailableRasterLayers(current, isAdvanced))}
                  className="min-h-12 rounded-xl border border-[var(--border-color)] bg-white px-3 text-base font-bold text-[var(--primary)]"
                >
                  দৃশ্যমান লেয়ার বন্ধ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayers(defaultRasterLayerVisibility(isAdvanced));
                    setShowRsBoundary(true);
                    setShowMsBoundary(true);
                  }}
                  className="min-h-12 rounded-xl bg-[var(--primary)] px-3 text-base font-bold text-white"
                >
                  ডিফল্ট লেয়ার
                </button>
              </div>
            </div>
          ) : tab === "basemap" ? (
            <div className="space-y-3">
              {([
                ["satellite", "সাম্প্রতিক স্যাটেলাইট", "Esri World Imagery · উৎসভেদে তারিখ ও resolution ভিন্ন"],
                ["light", "রাস্তার মানচিত্র", "CARTO / OpenStreetMap"],
              ] as const).map(([key, label, detail]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={basemap === key}
                  onClick={() => setBasemap(key)}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                    basemap === key
                      ? "border-[var(--primary)] bg-[var(--brand-green-faint)]"
                      : "border-[var(--border-color)] bg-white hover:bg-[var(--brand-green-faint)]",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2 text-base font-black">
                    <MapIcon size={20} className="text-[var(--primary)]" />
                    {label}
                  </span>
                  <span className="mt-2 block text-base leading-7 text-[var(--muted-foreground)]">{detail}</span>
                </button>
              ))}
            </div>
          ) : tab === "history" ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--brand-green-faint)] p-4">
                <p className="text-base leading-7 text-[var(--muted-foreground)]">
                  Google Earth historical imagery archive-এ ২০০৩ বা অন্য বছর স্থানভেদে থাকতে পারে, কিন্তু Google Maps Platform কোনো supported historical raster-tile API দেয় না। LandBD তাই Google Earth tiles scrape করে না। নিচের ২০০৩ layer হলো NASA MODIS, Google Earth নয়।
                </p>
              </div>
              {FREE_IMAGERY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={basemap === option.key}
                  onClick={() => setBasemap(option.key)}
                  className={[
                    "block w-full rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                    basemap === option.key
                      ? "border-[var(--primary)] bg-[var(--brand-green-faint)]"
                      : "border-[var(--border-color)] bg-white hover:border-[var(--primary)]",
                  ].join(" ")}
                >
                  <span className="block text-base font-black">{option.label}</span>
                  <span className="mt-2 block text-base leading-7 text-[var(--muted-foreground)]">
                    {option.description}
                  </span>
                  <span className="mt-1 block text-base leading-7 text-[var(--muted-foreground)]">{option.detail}</span>
                </button>
              ))}
              <a
                href={GOOGLE_EARTH_2003_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-white px-4 text-base font-bold text-[var(--primary)]"
              >
                Google Earth historical imagery খুলুন
                <ExternalLink size={19} />
              </a>
              <a
                href={GOOGLE_EARTH_HISTORICAL_DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-white px-4 text-base font-bold text-[var(--primary)]"
              >
                Google-এর historical imagery নির্দেশিকা
                <ExternalLink size={19} />
              </a>
            </div>
          ) : tab === "legend" ? (
            <div className="space-y-3">
              {activeLayers.length ? (
                activeLayers.map((layer) => (
                  <div
                    key={layer.key}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-white p-3 text-base font-semibold"
                  >
                    <i
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span>{layer.label}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-[var(--border-color)] p-4 text-base text-[var(--muted-foreground)]">
                  কোনো optional layer সক্রিয় নেই।
                </p>
              )}
              <p className="text-base leading-7 text-[var(--muted-foreground)]">
                RS boundary কালো এবং MS boundary লাল। রঙ layer শনাক্তকরণের জন্য; এটি সরকারি শ্রেণিবিন্যাসের বিকল্প নয়।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <SettingsButton
                  Icon={Plus}
                  label="জুম বাড়ান"
                  disabled={!mapReady}
                  onClick={() => mapRef.current?.zoomIn({ duration: 180 })}
                />
                <SettingsButton
                  Icon={Minus}
                  label="জুম কমান"
                  disabled={!mapReady}
                  onClick={() => mapRef.current?.zoomOut({ duration: 180 })}
                />
                <SettingsButton Icon={Home} label="পূর্ণ এলাকা" disabled={!mapReady} onClick={fullExtent} />
                <SettingsButton Icon={Compass} label="উত্তর দিক" disabled={!mapReady} onClick={resetNorth} />
                <SettingsButton
                  Icon={MapIcon}
                  label="3D ভিউ"
                  disabled={!mapReady}
                  pressed={threeD}
                  onClick={toggleThreeD}
                />
                <SettingsButton
                  Icon={Expand}
                  label="পূর্ণপর্দা"
                  disabled={!mapReady}
                  pressed={fullscreen}
                  onClick={() => void toggleFullscreen()}
                />
                <SettingsButton Icon={Download} label="PNG সংরক্ষণ" disabled={!mapReady} onClick={savePng} />
                <SettingsButton Icon={Printer} label="প্রিন্ট" disabled={!mapReady} onClick={() => window.print()} />
              </div>

              {feedback ? (
                <p role="alert" className="rounded-xl bg-[#fff1ed] p-3 text-base leading-7 text-[#a73a28]">
                  {feedback}
                </p>
              ) : null}

              <CoordinateReadout mapRef={mapRef} mapReady={mapReady} />
              <OfficialLandSourceDock detailed />
              <p className="text-base leading-7 text-[var(--muted-foreground)]">{LEGAL_SURVEY_NOTE}</p>
            </div>
          )}
        </div>
      </aside>

      {toast ? (
        <div
          role="status"
          className="pointer-events-none absolute left-[70px] right-3 top-[92px] z-[95] mx-auto max-w-[520px] rounded-xl bg-[var(--primary)] px-4 py-3 text-center text-base font-bold text-white shadow-xl"
        >
          {toast}
        </div>
      ) : null}

      {!mapReady ? (
        <div className="pointer-events-none absolute inset-0 z-[28] grid place-items-center bg-[var(--background)]/70">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-black shadow-xl">
            <Loader2 size={20} className="animate-spin" />
            GIS মানচিত্র তৈরি হচ্ছে…
          </div>
        </div>
      ) : null}
    </main>
  );
}
