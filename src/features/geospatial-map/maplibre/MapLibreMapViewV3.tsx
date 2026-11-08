"use client";

import Link from "next/link";
import RajukStyleMapHeader from "./RajukStyleMapHeader";
import RajukPlotFinder, { type PlotSearchOptions } from "./RajukPlotFinder";
import RajukMapControls from "./RajukMapControls";
import RajukCoordinateStatus from "./RajukCoordinateStatus";
import RajukParcelInspector from "./RajukParcelInspector";
import RajukLayerSwitcher from "./RajukLayerSwitcher";
import OfficialLandSourceDock from "../components/OfficialLandSourceDock";
import { LEGAL_SURVEY_NOTE } from "../lib/officialLandSources";
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Layers3,
  Loader2,
  Map as MapIcon,
  MapPin,
  MousePointer2,
  Pentagon,
  Ruler,
  Square,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { ScaleControl, type Map as MapLibreInstance } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { formatBanglaNumber } from "@/src/shared/i18n/bangla";
import {
  GOOGLE_EARTH_2003_URL,
  FREE_IMAGERY_OPTIONS,
  LAYERS,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import type { BasemapKey } from "./types";
import { canToggleRasterLayer, setRasterLayerVisibility } from "./layerControlPolicy";
import { detailRows, isMsFeature, msNumber, rsNumber } from "./mapUtils";
import {
  measurementFeatureCollection,
  summarizeMeasurement,
  type LngLatTuple,
  type MeasurementMode,
} from "./mapMeasurement";

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
  identifyMode: boolean;
  setIdentifyMode: (value: boolean | ((current: boolean) => boolean)) => void;
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
  showRsBoundary: boolean;
  setShowRsBoundary: (value: boolean | ((current: boolean) => boolean)) => void;
  showMsBoundary: boolean;
  setShowMsBoundary: (value: boolean | ((current: boolean) => boolean)) => void;
  results: RajukPlotFeature[];
  clearResults: () => void;
  selected: RajukPlotFeature | null;
  selectResult: (feature: RajukPlotFeature) => void;
  toast: string;
  isAdvanced: boolean;
  publicResultsOpen: boolean;
  routingCalculator: "khatiyan" | "faraez" | null;
  validateAndRoute: (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => void;
  activeDetails: Array<{ label: string; value: string }>;
};

const MEASURE_SOURCE_ID = "landbd-user-measurement";
const MEASURE_FILL_LAYER_ID = "landbd-user-measurement-fill";
const MEASURE_LINE_LAYER_ID = "landbd-user-measurement-line";
const MEASURE_POINT_LAYER_ID = "landbd-user-measurement-points";

const EMPTY_MEASUREMENT: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: [],
};

const LAYER_LABELS: Record<LayerKey, { label: string; description: string }> = {
  dap: { label: "ডিএপি প্রস্তাবিত ভূমি ব্যবহার", description: "পরিকল্পিত ভূমি-ব্যবহার অঞ্চল" },
  rs: { label: "আরএস মৌজা টাইলস", description: "বর্তমান আরএস মৌজা মানচিত্র স্তর" },
  ms: { label: "এমএস মৌজা টাইলস", description: "বর্তমান এমএস মৌজা মানচিত্র স্তর" },
  flood: { label: "বন্যা ঝুঁকি স্তর", description: "বন্যা সংবেদনশীলতা ওভারলে" },
  boundary: { label: "পরিকল্পনা সীমানা", description: "ওভারলে সীমানা স্তর" },
  transport: { label: "পরিবহন নেটওয়ার্ক", description: "সড়ক ও পরিবহন নেটওয়ার্ক স্তর" },
};

const MEASURE_TOOLS: Array<{
  mode: MeasurementMode;
  label: string;
  icon: typeof MapPin;
}> = [
  { mode: "point", label: "পয়েন্ট", icon: MapPin },
  { mode: "line", label: "লাইন", icon: Ruler },
  { mode: "polygon", label: "পলিগন", icon: Pentagon },
  { mode: "rectangle", label: "আয়তক্ষেত্র", icon: Square },
  { mode: "distance", label: "দূরত্ব", icon: Crosshair },
];

function setGeoJsonData(map: MapLibreInstance, data: FeatureCollection<Geometry>): void {
  const source = map.getSource(MEASURE_SOURCE_ID) as
    | { setData: (value: FeatureCollection<Geometry>) => void }
    | undefined;
  source?.setData(data);
}

function bn(value: number, digits = 2): string {
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
      className={`w-full rounded-2xl border p-3 text-left transition ${
        active
          ? "border-[var(--primary)] bg-[var(--brand-green-faint)] shadow-sm"
          : "border-[var(--border-color)] bg-white hover:bg-[var(--brand-green-faint)]"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-lg bg-[#15535a] px-2 py-0.5 text-xs font-bold text-white">
          {kind === "rs" ? "আরএস" : "এমএস"}
        </span>
        <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
      </div>
      <div className="space-y-1.5">
        {rows.slice(0, 5).map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 text-xs">
            <span className="shrink-0 text-[var(--muted-foreground)]">{label}</span>
            <span className="text-right font-semibold text-[var(--foreground)]">{value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

export default function MapLibreMapViewV2({
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
  clearResults,
  selected,
  selectResult,
  toast,
  isAdvanced,
  routingCalculator,
  validateAndRoute,
  activeDetails,
}: Props) {
  const [measurePanelOpen, setMeasurePanelOpen] = useState(false);
  const [measureMode, setMeasureMode] = useState<MeasurementMode | null>(null);
  const [measureKind, setMeasureKind] = useState<MeasurementMode>("polygon");
  const [measurePoints, setMeasurePoints] = useState<LngLatTuple[]>([]);
  const [threeD, setThreeD] = useState(false);
  const previousIdentifyRef = useRef<boolean | null>(null);
  const scaleControlRef = useRef<ScaleControl | null>(null);

  const rsResults = results.filter((feature) => !isMsFeature(feature));
  const msResults = results.filter((feature) => isMsFeature(feature));
  const summary = useMemo(
    () => summarizeMeasurement(measureKind, measurePoints),
    [measureKind, measurePoints],
  );

  const restoreIdentify = useCallback(() => {
    if (previousIdentifyRef.current !== null) {
      setIdentifyMode(previousIdentifyRef.current);
      previousIdentifyRef.current = null;
    }
  }, [setIdentifyMode]);

  const finishMeasurement = useCallback(() => {
    setMeasureMode(null);
    restoreIdentify();
  }, [restoreIdentify]);

  const startMeasurement = useCallback(
    (mode: MeasurementMode) => {
      if (previousIdentifyRef.current === null) {
        previousIdentifyRef.current = identifyMode;
      }
      setIdentifyMode(false);
      setMeasureKind(mode);
      setMeasureMode(mode);
      setMeasurePoints([]);
      setMeasurePanelOpen(true);
      setPanelOpen(false);
    },
    [identifyMode, setIdentifyMode, setPanelOpen],
  );

  const clearMeasurement = useCallback(() => {
    setMeasurePoints([]);
    setMeasureMode(null);
    restoreIdentify();
    const map = mapRef.current;
    if (map) setGeoJsonData(map, EMPTY_MEASUREMENT);
  }, [mapRef, restoreIdentify]);

  const undoMeasurement = useCallback(() => {
    setMeasurePoints((current) => current.slice(0, -1));
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    if (!map.getSource(MEASURE_SOURCE_ID)) {
      map.addSource(MEASURE_SOURCE_ID, {
        type: "geojson",
        data: EMPTY_MEASUREMENT,
      });
    }
    if (!map.getLayer(MEASURE_FILL_LAYER_ID)) {
      map.addLayer({
        id: MEASURE_FILL_LAYER_ID,
        type: "fill",
        source: MEASURE_SOURCE_ID,
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "fill-color": "#d47749",
          "fill-opacity": 0.22,
        },
      });
    }
    if (!map.getLayer(MEASURE_LINE_LAYER_ID)) {
      map.addLayer({
        id: MEASURE_LINE_LAYER_ID,
        type: "line",
        source: MEASURE_SOURCE_ID,
        filter: ["in", ["geometry-type"], ["literal", ["LineString", "Polygon"]]],
        paint: {
          "line-color": "#15535a",
          "line-width": 3,
          "line-opacity": 0.95,
        },
      });
    }
    if (!map.getLayer(MEASURE_POINT_LAYER_ID)) {
      map.addLayer({
        id: MEASURE_POINT_LAYER_ID,
        type: "circle",
        source: MEASURE_SOURCE_ID,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#d47749",
        },
      });
    }

    if (!scaleControlRef.current) {
      const scale = new ScaleControl({ maxWidth: 110, unit: "metric" });
      scaleControlRef.current = scale;
      map.addControl(scale, "bottom-right");
    }
  }, [mapReady, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    setGeoJsonData(map, measurementFeatureCollection(measureKind, measurePoints));
  }, [mapReady, mapRef, measureKind, measurePoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !measureMode) return;

    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    canvas.style.cursor = "crosshair";

    const onClick = (event: { lngLat: { lng: number; lat: number } }) => {
      const point: LngLatTuple = [event.lngLat.lng, event.lngLat.lat];
      setMeasurePoints((current) => {
        if (measureMode === "point") {
          window.setTimeout(finishMeasurement, 0);
          return [point];
        }
        if (measureMode === "rectangle") {
          const next = current.length >= 1 ? [current[0], point] : [point];
          if (next.length === 2) window.setTimeout(finishMeasurement, 0);
          return next;
        }
        if (measureMode === "distance") {
          const next = [...current, point].slice(0, 2);
          if (next.length === 2) window.setTimeout(finishMeasurement, 0);
          return next;
        }
        return [...current, point];
      });
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      canvas.style.cursor = previousCursor;
    };
  }, [finishMeasurement, mapReady, mapRef, measureMode]);

  useEffect(() => {
    return () => {
      restoreIdentify();
    };
  }, [restoreIdentify]);

  const resetNorth = () => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ bearing: 0, pitch: 0, duration: 450 });
    setThreeD(false);
  };

  const toggleThreeD = () => {
    const map = mapRef.current;
    if (!map) return;
    const next = !threeD;
    setThreeD(next);
    map.easeTo({ pitch: next ? 55 : 0, duration: 500 });
  };


  if (initError) {
    return (
      <div className="grid h-full place-items-center bg-[var(--background)] px-6 text-center text-[var(--foreground)]">
        <div className="max-w-md rounded-[28px] border border-[var(--border-color)] bg-white p-8 shadow-xl">
          <MapIcon className="mx-auto text-[var(--primary)]" size={30} />
          <h2 className="mt-3 text-xl font-black">মানচিত্র চালু হয়নি</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{initError}</p>
          <button type="button" className="mt-5 min-h-11 rounded-full bg-[var(--primary)] px-6 text-sm font-bold text-white" onClick={() => window.location.reload()}>
            পুনরায় চেষ্টা
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-full min-h-0 w-full overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)] [&_.maplibregl-ctrl-group]:!hidden [&_.maplibregl-ctrl-scale]:!rounded-full [&_.maplibregl-ctrl-scale]:!border-0 [&_.maplibregl-ctrl-scale]:!bg-white/95 [&_.maplibregl-ctrl-scale]:!px-3 [&_.maplibregl-ctrl-scale]:!py-2 [&_.maplibregl-ctrl-scale]:!font-bold">
      <div
        ref={containerRef}
        aria-label="বাংলাদেশের GIS মানচিত্র · আরএস এমএস ও স্যাটেলাইট"
        className="absolute inset-0 h-full w-full [&_.maplibregl-map]:!h-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[var(--brand-green-soft)]/50 to-transparent pb-24" />
      <div className="absolute inset-x-0 top-0 z-[90]"><RajukStyleMapHeader /></div>

      <div className="absolute left-3 top-[78px] z-[60] lg:hidden">
        <button type="button" onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen} aria-controls="atlas-map-workspace-panel" className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 text-sm font-extrabold text-[var(--primary)] shadow-lg">
          {panelOpen ? <X size={17} /> : <Layers3 size={17} />} {panelOpen ? "প্যানেল বন্ধ" : "ম্যাপ ও তথ্য"}
        </button>
      </div>

      <aside
        id="atlas-map-workspace-panel"
        aria-label="GIS অনুসন্ধান ও লেয়ার নিয়ন্ত্রণ"
        className={["absolute bottom-3 left-3 top-[132px] z-[65] w-[min(92vw,342px)] flex-col overflow-hidden rounded-lg border border-[var(--border-color)] bg-white/98 shadow-[0_20px_70px_rgba(11,45,30,.16)] backdrop-blur-sm lg:top-[79px] lg:bottom-4", panelOpen ? "flex" : "hidden lg:flex"].join(" ")}
      >
        <div className="border-b border-[var(--border-color)] bg-[var(--brand-green-faint)] px-5 pb-3 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-green-soft)] px-3 py-1 text-[10px] font-extrabold tracking-[.1em] text-[var(--primary)]">LANDBD · GIS MASTER PLAN</span>
            <span className="text-[11px] font-bold text-[var(--muted-foreground)]">{isAdvanced ? "GIS PRO" : "PUBLIC VIEW"}</span>
          </div>
          <h1 className="text-[25px] font-black leading-tight tracking-[-.04em] text-[var(--foreground)]">RAJUK-ধাঁচের <span className="text-[var(--primary)]">GIS ম্যাপ</span></h1>
          <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">দাগ অনুসন্ধান, ভূমি-ব্যবহার, জরিপ লেয়ার ও বেসম্যাপ তুলনা।</p>
        </div>

        <RajukPlotFinder
          plotNo={plotNo}
          setPlotNo={setPlotNo}
          searching={searching}
          searchPlots={searchPlots}
          vectorStatus={vectorStatus}
        />

        <div className="grid grid-cols-3 gap-1 border-y border-[var(--border-color)] bg-white px-3 py-2">
          {(["layers", "basemap", "results"] as Tab[]).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} aria-pressed={tab === item}
              className={["min-h-10 rounded-xl px-2 text-xs font-extrabold transition", tab === item ? "bg-[var(--primary)] text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"].join(" ")}>
              {item === "layers" ? "জরিপ স্তর" : item === "basemap" ? "স্যাটেলাইট" : "দাগ তালিকা"}
              {item === "results" && results.length > 0 ? <span className="ml-1 text-[10px]">({bn(results.length,0)})</span> : null}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
          {tab === "layers" ? (
            <>
              <div className="rounded-2xl border border-[var(--border-color)] bg-white p-3.5">
                <h2 className="text-sm font-black text-[var(--foreground)]">ক্যাডাস্ট্রাল লেয়ার</h2>
                <p className="mt-1 text-[11px] leading-5 text-[var(--muted-foreground)]">আরএস ও এমএস স্তর checkbox দিয়ে পৃথকভাবে দেখান/লুকান; ম্যাপের ডান পাশে দ্রুত লেয়ার প্যানেলও রয়েছে।</p>
                {isAdvanced ? (
                  <div className="mt-3 space-y-2">
                    <label className="flex min-h-10 items-center justify-between rounded-xl bg-[var(--secondary)] px-3 text-xs font-bold"><span>আরএস দাগ ও লেবেল</span><input type="checkbox" checked={showRsBoundary} onChange={(e) => setShowRsBoundary(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /></label>
                    <label className="flex min-h-10 items-center justify-between rounded-xl bg-[var(--secondary)] px-3 text-xs font-bold"><span>এমএস দাগ ও লেবেল</span><input type="checkbox" checked={showMsBoundary} onChange={(e) => setShowMsBoundary(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /></label>
                  </div>
                ) : <p className="mt-2 rounded-xl bg-[var(--brand-green-faint)] px-3 py-2 text-[11px] leading-5 text-[var(--muted-foreground)]">দাগ সীমানা উপলব্ধ থাকলে দেখানো হয়। বিস্তারিত লেয়ার নিয়ন্ত্রণ লগইনের পর পাওয়া যাবে।</p>}
              </div>

              {LAYERS.map((layer) => (
                <section key={layer.key} className="rounded-2xl border border-[var(--border-color)] bg-white p-3.5">
                  <label className="flex cursor-pointer items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-extrabold"><i aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:layer.color}} /> {layer.label}</span>
                      <span className="mt-1 block text-[11px] leading-4 text-[var(--muted-foreground)]">{layer.description}</span>
                    </span>
                    <input type="checkbox" checked={layers[layer.key]} disabled={!canToggleRasterLayer(layer.key, isAdvanced)} onChange={(e) => setLayers((v) => setRasterLayerVisibility(v, layer.key, e.target.checked, isAdvanced))} className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40" />
                  </label>
                  {canToggleRasterLayer(layer.key, isAdvanced) && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] font-bold text-[var(--muted-foreground)]"><span>স্বচ্ছতা</span><span>{bn(opacity[layer.key]*100,0)}%</span></div>
                      <input aria-label={layer.label + " স্বচ্ছতা"} type="range" min="0" max="1" step=".05" value={opacity[layer.key]} onChange={(e) => setOpacity((v) => ({...v,[layer.key]:Number(e.target.value)}))} className="w-full accent-[var(--primary)]" />
                    </div>
                  )}
                </section>
              ))}
              <section aria-label="মানচিত্র লেজেন্ড" className="rounded-md border border-[var(--border-color)] bg-[var(--brand-green-faint)] p-3">
                <h3 className="mb-2 text-xs font-black text-[var(--primary)]">Map legend / লেজেন্ড</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[var(--foreground)]">
                  {LAYERS.map((layer) => (
                    <span key={layer.key} className="flex items-center gap-2">
                      <i aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: layer.color }} />
                      {layer.label}
                    </span>
                  ))}
                  <span className="flex items-center gap-2"><i aria-hidden="true" className="h-0.5 w-3 bg-[#dc2626]"/> RS দাগ</span>
                  <span className="flex items-center gap-2"><i aria-hidden="true" className="h-0.5 w-3 bg-[#7c3aed]"/> MS দাগ</span>
                </div>
                <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">রঙ কেবল লেয়ার শনাক্তকরণে সহায়ক; সরকারি শ্রেণিবিন্যাসের বিকল্প নয়।</p>
              </section>
              <Link href="/rajuk-test" className="flex min-h-11 items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--brand-green-soft)] px-4 text-xs font-extrabold text-[var(--primary)]">বিস্তারিত RS/MS অনুসন্ধান <ChevronUp size={17} className="rotate-90" /></Link>
            </>
          ) : tab === "basemap" ? (
            <>
              <h2 className="text-sm font-black">ভিত্তি মানচিত্র</h2>
              {([["satellite","সাম্প্রতিক স্যাটেলাইট","Esri World Imagery · উৎসভেদে তারিখ/রেজোলিউশন ভিন্ন"],["light","রাস্তার মানচিত্র","CARTO / OpenStreetMap রোড বেসম্যাপ"]] as const).map(([key,label,detail]) => (
                <button key={key} onClick={() => setBasemap(key)} aria-pressed={basemap===key} type="button" className={["w-full rounded-2xl border p-4 text-left transition",basemap===key?"border-[var(--primary)] bg-[var(--brand-green-faint)] ring-1 ring-[var(--primary)]":"border-[var(--border-color)] bg-white hover:bg-[var(--brand-green-faint)]"].join(" ")}>
                  <span className="flex items-center gap-2 text-sm font-black"><MapIcon size={16} className="text-[var(--primary)]"/>{label}</span>
                  <span className="mt-1.5 block text-[11px] leading-4 text-[var(--muted-foreground)]">{detail}</span>
                </button>
              ))}
              <div className="border-t border-[var(--border-color)] pt-3">
                <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black">ঐতিহাসিক চিত্র</h3><span className="text-[10px] font-bold text-[var(--muted-foreground)]">FREE DATA</span></div>
                <p className="mb-3 text-[11px] leading-5 text-[var(--muted-foreground)]">উৎস পরিবর্তনে বর্তমান দাগ ও ম্যাপের অবস্থান একই থাকবে। কিছু স্যাটেলাইট চিত্রে খুব কম বিস্তারিত দেখা যায়।</p>
                {FREE_IMAGERY_OPTIONS.map((option) => (
                  <button key={option.key} type="button" aria-pressed={basemap===option.key} onClick={() => setBasemap(option.key)} className={["mb-2 block w-full rounded-xl border p-3 text-left",basemap===option.key?"border-[var(--primary)] bg-[var(--brand-green-faint)]":"border-[var(--border-color)] bg-white hover:border-[var(--primary)]"].join(" ")}>
                    <span className="block text-xs font-black">{option.label}</span>
                    <span className="mt-1 block text-[11px] text-[var(--muted-foreground)]">{option.description}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[var(--muted-foreground)]">{option.detail}</span>
                  </button>
                ))}
              </div>
              {basemap === "satellite2003" && <a href={GOOGLE_EARTH_2003_URL} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-[var(--brand-green-faint)] p-3 text-xs font-bold text-[var(--primary)] underline">Google Earth-এ আলাদা ঐতিহাসিক উৎস দেখুন</a>}
            </>
          ) : (
            <>
              <h2 className="text-sm font-black">ম্যাপে পাওয়া দাগ</h2>
              <p className="text-[11px] leading-5 text-[var(--muted-foreground)]">আরএস: {bn(rsResults.length,0)} · এমএস: {bn(msResults.length,0)}। ফলাফল সরাসরি RAJUK সার্ভিস থেকে আসে।</p>
              {results.length ? <>
                <button type="button" onClick={clearResults} className="text-xs font-bold text-[var(--primary)] underline">ফলাফলের তালিকা মুছুন</button>
                <div className="space-y-2">
                  {rsResults.map((feature,index) => <PlotCard key={"rs-"+(feature.plotId??index)} kind="rs" feature={feature} active={selected === feature} onSelect={() => selectResult(feature)}/>)}
                  {msResults.map((feature,index) => <PlotCard key={"ms-"+(feature.plotId??index)} kind="ms" feature={feature} active={selected === feature} onSelect={() => selectResult(feature)}/>)}
                </div>
              </> : <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-white p-6 text-center text-xs leading-6 text-[var(--muted-foreground)]">দাগ বাছাই করুন বা উপরের অনুসন্ধান থেকে একটি দাগ নম্বর লিখুন।</div>}
              {selected && (
                <div className="xl:hidden">
                  <RajukParcelInspector
                    selected={selected}
                    activeDetails={activeDetails}
                    routingCalculator={routingCalculator}
                    validateAndRoute={validateAndRoute}
                  />
                </div>
              )}
            </>
          )}

          <OfficialLandSourceDock detailed />
          <p className="pb-4 text-[10px] leading-5 text-[var(--muted-foreground)]">{LEGAL_SURVEY_NOTE}</p>
        </div>
      </aside>

      <RajukLayerSwitcher
        layers={layers}
        setLayers={setLayers}
        showRsBoundary={showRsBoundary}
        setShowRsBoundary={setShowRsBoundary}
        showMsBoundary={showMsBoundary}
        setShowMsBoundary={setShowMsBoundary}
        isAdvanced={isAdvanced}
      />

      <RajukMapControls
        mapRef={mapRef}
        mapReady={mapReady}
        locating={locating}
        goToMyLocation={goToMyLocation}
        resetNorth={resetNorth}
        toggleThreeD={toggleThreeD}
        threeD={threeD}
      />

      {selected && (
        <div className="absolute right-[64px] top-[96px] z-[50] hidden max-h-[calc(100dvh-235px)] w-[min(27vw,300px)] overflow-y-auto rounded-lg shadow-2xl xl:block">
          <RajukParcelInspector
            selected={selected}
            activeDetails={activeDetails}
            routingCalculator={routingCalculator}
            validateAndRoute={validateAndRoute}
          />
        </div>
      )}

      <div className="absolute inset-x-3 bottom-4 z-[58] mx-auto max-w-[850px] lg:left-[372px] lg:right-5">
        {measurePanelOpen && (
          <div className="mb-2 rounded-[24px] border border-[var(--border-color)] bg-[var(--card-bg)] p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <div><p className="text-xs font-black">পরিমাপ ও জরিপ টুলস</p><p className="text-[10px] text-[var(--muted-foreground)]">মানচিত্রে ট্যাপ করে বিন্দু বসান</p></div>
              <button type="button" onClick={() => setMeasurePanelOpen(false)} aria-label="পরিমাপ প্যানেল বন্ধ" className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--secondary)]"><ChevronDown size={18}/></button>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {MEASURE_TOOLS.map(({mode,label,icon:Icon}) => (
                <button key={mode} type="button" onClick={() => startMeasurement(mode)} aria-pressed={measureMode===mode}
                  className={["flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold",measureMode===mode?"bg-[#d9784b] text-white":"bg-[var(--secondary)] text-[var(--foreground)]"].join(" ")}>
                  <Icon size={16}/>{label}
                </button>
              ))}
              <button type="button" disabled={!measurePoints.length} onClick={undoMeasurement} className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-[var(--secondary)] px-3 text-xs font-bold disabled:opacity-30"><Undo2 size={16}/>ফেরান</button>
              <button type="button" onClick={clearMeasurement} className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-[var(--brand-green-faint)] px-3 text-xs font-bold text-[var(--muted-foreground)]"><Trash2 size={16}/>মুছুন</button>
            </div>
            {measureMode && (
              <button type="button" onClick={finishMeasurement} className="mt-2 rounded-lg border border-[#b8ccc1] px-3 py-2 text-xs font-bold">মাপ শেষ করুন</button>
            )}
            <div role="status" className="mt-2 rounded-xl bg-[var(--brand-green-faint)] px-3 py-2 text-xs font-bold text-[var(--foreground)]">
              {measureKind==="point" && summary.point ? <>অক্ষাংশ {bn(summary.point[1],6)} · দ্রাঘিমাংশ {bn(summary.point[0],6)}</> :
               (measureKind==="line" || measureKind==="distance") && summary.distanceMeters ? <>দূরত্ব {bn(summary.distanceMeters,2)} মিটার · {bn(summary.distanceMeters*3.28084,2)} ফুট</> :
               summary.area.isValid ? <>আয়তন {bn(summary.area.shotok,4)} শতাংশ · {bn(summary.area.katha,4)} কাঠা · {bn(summary.area.acre,4)} একর</> :
               "মাপ শুরু করতে একটি টুল নির্বাচন করুন।"}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 rounded-[22px] border border-[var(--border-color)] bg-[var(--card-bg)]/98 p-2 shadow-[0_14px_50px_rgba(11,45,30,.14)] backdrop-blur-sm">
          <div className="flex items-center gap-2 pl-1">
            <span className="hidden h-8 w-8 place-items-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--primary)] sm:grid"><MapPin size={17}/></span>
            <div className="hidden sm:block"><p className="text-[11px] font-black">GIS ও দাগ যাচাই</p><p className="text-[10px] text-[var(--muted-foreground)]">{measureMode ? "পরিমাপ চলছে" : identifyMode ? "দাগ শনাক্ত চালু" : "দাগ শনাক্ত বন্ধ"}</p></div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => { if (measureMode) finishMeasurement(); else setIdentifyMode((v) => !v); setMeasurePanelOpen(false); }} aria-pressed={identifyMode}
              className={["inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-black",identifyMode?"bg-[var(--primary)] text-white":"bg-[var(--secondary)]"].join(" ")}><MousePointer2 size={17}/> দাগ</button>
            <button type="button" onClick={() => setMeasurePanelOpen((v) => !v)} aria-expanded={measurePanelOpen} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--brand-green-soft)] px-3 text-xs font-black text-[var(--primary)]"><Ruler size={17}/> মাপ {measurePanelOpen?<ChevronDown size={13}/>:<ChevronUp size={13}/>}</button>
            <button type="button" onClick={() => {setPanelOpen(true);setTab("basemap");}} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#eff2eb] px-3 text-xs font-black"><Layers3 size={16}/><span className="hidden sm:inline">বেসম্যাপ</span></button>
          </div>
        </div>
      </div>

      <RajukCoordinateStatus mapRef={mapRef} mapReady={mapReady} />

      {toast && <div role="status" className="absolute left-1/2 top-[76px] z-[100] w-[min(90vw,390px)] -translate-x-1/2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-xs font-bold text-white shadow-2xl">{toast}</div>}

      {!mapReady && <div className="pointer-events-none absolute inset-0 z-[28] grid place-items-center bg-[var(--background)]/70"><div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black shadow-xl"><Loader2 size={18} className="animate-spin"/> GIS মানচিত্র তৈরি হচ্ছে…</div></div>}
    </main>
  );
}
