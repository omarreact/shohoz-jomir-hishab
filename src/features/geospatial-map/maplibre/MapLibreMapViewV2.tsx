"use client";

import Link from "next/link";
import {
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Layers3,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Menu,
  Minus,
  MousePointer2,
  Pentagon,
  Plus,
  Ruler,
  Search,
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
  LAYERS,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import type { BasemapKey } from "./types";
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
          ? "border-[#17663A] bg-emerald-50 shadow-sm dark:border-[#54A878] dark:bg-emerald-950/40"
          : "border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--secondary)]"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-lg bg-[#17663A] px-2 py-0.5 text-xs font-bold text-white">
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
  setResults,
  selected,
  selectResult,
  toast,
  isAdvanced,
  routingCalculator,
  validateAndRoute,
  activeDetails,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [measurePanelOpen, setMeasurePanelOpen] = useState(true);
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
          "fill-color": "#17663A",
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
          "line-color": "#F0A500",
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
          "circle-stroke-color": "#17663A",
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
      <div className="grid h-full min-h-[50vh] place-items-center bg-[var(--background)] p-6 text-center">
        <div>
          <p className="font-bold text-[var(--destructive)]">মানচিত্র চালু করা যায়নি</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{initError}</p>
          <button
            className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 font-semibold"
            onClick={() => window.location.reload()}
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-slate-900 font-sans [&_.maplibregl-ctrl-group]:!hidden [&_.maplibregl-ctrl-bottom-right]:!bottom-44 [&_.maplibregl-ctrl-bottom-right]:!right-3 [&_.maplibregl-ctrl-scale]:!rounded-lg [&_.maplibregl-ctrl-scale]:!border-0 [&_.maplibregl-ctrl-scale]:!bg-slate-950/85 [&_.maplibregl-ctrl-scale]:!px-3 [&_.maplibregl-ctrl-scale]:!py-1.5 [&_.maplibregl-ctrl-scale]:!text-xs [&_.maplibregl-ctrl-scale]:!font-bold [&_.maplibregl-ctrl-scale]:!text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full min-h-0 w-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full [&_.maplibregl-map]:!h-full [&_.maplibregl-map]:!w-full"
        style={{ width: "100%", height: "100%", minHeight: 0 }}
        aria-label="ল্যান্ডবিডি ভূমি তথ্য মানচিত্র"
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-40 flex items-center gap-2 sm:inset-x-4 sm:top-4">
        <div className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[#17663A] text-white shadow-xl backdrop-blur">
          <MapIcon size={22} />
        </div>
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center rounded-2xl border border-white/15 bg-slate-950/88 shadow-xl backdrop-blur-xl sm:max-w-xl">
          <Search className="ml-3 shrink-0 text-slate-300" size={18} />
          <input
            value={plotNo}
            onChange={(event) => setPlotNo(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void searchPlots();
            }}
            placeholder="দাগ নম্বর লিখুন…"
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-400"
            aria-label="দাগ নম্বর"
          />
          <button
            type="button"
            onClick={() => void searchPlots()}
            disabled={searching}
            className="mr-1.5 rounded-xl bg-[#17663A] p-2.5 text-white transition hover:bg-[#125630] disabled:opacity-60"
            aria-label="দাগ খুঁজুন"
          >
            {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/88 text-white shadow-xl backdrop-blur-xl"
          aria-label="মেনু খুলুন"
        >
          <Menu size={22} />
        </button>
      </div>

      {vectorStatus ? (
        <div className="pointer-events-none absolute left-1/2 top-[4.5rem] z-30 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/78 px-3 py-1.5 text-[11px] font-semibold text-slate-200 shadow backdrop-blur sm:top-20">
          {vectorStatus}
        </div>
      ) : null}

      <div className="absolute right-3 top-20 z-40 flex flex-col gap-2 sm:right-4 sm:top-24">
        <button
          type="button"
          onClick={resetNorth}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-slate-950/88 text-white shadow-xl backdrop-blur"
          aria-label="উত্তর দিক ঠিক করুন"
        >
          <Compass size={19} />
        </button>
        <button
          type="button"
          onClick={goToMyLocation}
          disabled={locating}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-slate-950/88 text-white shadow-xl backdrop-blur disabled:opacity-60"
          aria-label="বর্তমান অবস্থান"
        >
          {locating ? <Loader2 className="animate-spin" size={19} /> : <LocateFixed size={19} />}
        </button>
        <button
          type="button"
          onClick={toggleThreeD}
          className={`grid h-11 w-11 place-items-center rounded-2xl border text-sm font-black shadow-xl backdrop-blur ${
            threeD
              ? "border-emerald-300 bg-[#17663A] text-white"
              : "border-white/15 bg-slate-950/88 text-white"
          }`}
          aria-label="ত্রিমাত্রিক ভিউ"
        >
          ৩D
        </button>
        <button
          type="button"
          onClick={() => {
            setPanelOpen(true);
            setTab("layers");
          }}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-slate-950/88 text-white shadow-xl backdrop-blur"
          aria-label="লেয়ারসমূহ"
        >
          <Layers3 size={19} />
        </button>
        <div className="mt-1 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/88 shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn({ duration: 250 })}
            className="grid h-11 w-11 place-items-center border-b border-white/10 text-white"
            aria-label="জুম বাড়ান"
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut({ duration: 250 })}
            className="grid h-11 w-11 place-items-center text-white"
            aria-label="জুম কমান"
          >
            <Minus size={20} />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-2 bottom-2 z-40 mx-auto flex max-w-4xl flex-col gap-2 sm:inset-x-4 sm:bottom-4">
        <div className="overflow-x-auto rounded-2xl border border-white/15 bg-slate-950/92 p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="flex min-w-max items-stretch gap-1">
            {MEASURE_TOOLS.map(({ mode, label, icon: Icon }) => (
              <button
                type="button"
                key={mode}
                onClick={() => startMeasurement(mode)}
                className={`flex min-h-14 min-w-[4.65rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-bold transition sm:min-w-[5.5rem] ${
                  measureMode === mode
                    ? "bg-[#17663A] text-white"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={undoMeasurement}
              disabled={!measurePoints.length}
              className="flex min-h-14 min-w-[4.65rem] flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-bold text-slate-200 hover:bg-white/10 disabled:opacity-35 sm:min-w-[5.5rem]"
            >
              <Undo2 size={19} />
              <span>ফিরিয়ে নিন</span>
            </button>
            <button
              type="button"
              onClick={clearMeasurement}
              className="flex min-h-14 min-w-[4.65rem] flex-col items-center justify-center gap-1 rounded-xl bg-red-600 px-2 text-[11px] font-bold text-white hover:bg-red-700 sm:min-w-[5.5rem]"
            >
              <Trash2 size={19} />
              <span>মুছুন</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <button
            type="button"
            onClick={() => {
              setMeasurePanelOpen((current) => !current);
              setPanelOpen(false);
            }}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#17663A] px-3 text-sm font-bold text-white shadow-xl"
          >
            <Ruler size={18} />
            জমির মাপ
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifyMode((current) => !current);
              setMeasureMode(null);
              restoreIdentify();
            }}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-bold shadow-xl backdrop-blur ${
              identifyMode
                ? "border-emerald-300 bg-emerald-50 text-[#17663A]"
                : "border-white/15 bg-slate-950/88 text-white"
            }`}
          >
            <MousePointer2 size={18} />
            দাগ শনাক্ত
          </button>
          <button
            type="button"
            onClick={() => setMeasurePanelOpen((current) => !current)}
            className="grid min-h-12 min-w-12 place-items-center rounded-2xl border border-white/15 bg-slate-950/88 text-white shadow-xl backdrop-blur"
            aria-label={measurePanelOpen ? "প্যানেল সংকুচিত করুন" : "প্যানেল খুলুন"}
          >
            {measurePanelOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {measurePanelOpen ? (
          <section className="max-h-[34vh] overflow-y-auto rounded-3xl border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_96%,transparent)] p-4 text-[var(--foreground)] shadow-2xl backdrop-blur-xl sm:max-h-[42vh]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-black">
                  <Ruler className="text-[#17663A]" size={20} />
                  জমির মাপ
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  মানচিত্রে পয়েন্ট বসিয়ে জমির ক্ষেত্রফল বা দূরত্ব মাপুন। এই মাপটি আরএস/এমএস সরকারি স্তর পরিবর্তন করে না।
                </p>
              </div>
              {measureMode ? (
                <button
                  type="button"
                  onClick={finishMeasurement}
                  className="shrink-0 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-3 py-2 text-xs font-bold"
                >
                  মাপ শেষ করুন
                </button>
              ) : null}
            </div>

            {!measurePoints.length ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--secondary)]/60 px-4 py-7 text-center text-sm text-[var(--muted-foreground)]">
                উপরের টুল থেকে পলিগন, আয়তক্ষেত্র, লাইন বা দূরত্ব নির্বাচন করে মানচিত্রে আঁকুন।
              </div>
            ) : measureKind === "point" && summary.point ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">অক্ষাংশ</div>
                  <div className="mt-1 font-black">{bn(summary.point[1], 6)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">দ্রাঘিমাংশ</div>
                  <div className="mt-1 font-black">{bn(summary.point[0], 6)}</div>
                </div>
              </div>
            ) : measureKind === "line" || measureKind === "distance" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">মোট দূরত্ব</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.distanceMeters, 2)} মিটার</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">কিলোমিটার</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.distanceMeters / 1000, 4)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">ফুট</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.distanceMeters * 3.28084, 2)}</div>
                </div>
              </div>
            ) : summary.area.isValid ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                  <div className="text-xs text-[var(--muted-foreground)]">বর্গমিটার</div>
                  <div className="mt-1 text-lg font-black text-[#17663A] dark:text-[#54A878]">{bn(summary.areaSquareMeters, 2)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">বর্গফুট</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.area.sqFt, 2)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">শতাংশ</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.area.shotok, 4)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">কাঠা</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.area.katha, 4)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">বিঘা</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.area.bigha, 4)}</div>
                </div>
                <div className="rounded-2xl bg-[var(--secondary)] p-3">
                  <div className="text-xs text-[var(--muted-foreground)]">একর</div>
                  <div className="mt-1 text-lg font-black">{bn(summary.area.acre, 4)}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[var(--secondary)] px-4 py-5 text-center text-sm text-[var(--muted-foreground)]">
                ক্ষেত্রফল পেতে অন্তত তিনটি পয়েন্ট দিন।
              </div>
            )}

            {results.length ? (
              <div className="mt-4 border-t border-[var(--border-color)] pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black">দাগ ফলাফল</div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {bn(rsResults.length, 0)} আরএস · {bn(msResults.length, 0)} এমএস
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResults([])}
                    className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--muted-foreground)]"
                    aria-label="ফলাফল বন্ধ করুন"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {rsResults.map((feature, index) => (
                    <PlotCard
                      key={`rs-${feature.plotId ?? index}`}
                      kind="rs"
                      feature={feature}
                      active={selected?.plotId === feature.plotId}
                      onSelect={() => selectResult(feature)}
                    />
                  ))}
                  {msResults.map((feature, index) => (
                    <PlotCard
                      key={`ms-${feature.plotId ?? index}`}
                      kind="ms"
                      feature={feature}
                      active={selected?.plotId === feature.plotId}
                      onSelect={() => selectResult(feature)}
                    />
                  ))}
                </div>
                {selected ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={routingCalculator !== null}
                      onClick={() => void validateAndRoute("khatiyan", selected)}
                      className="rounded-xl bg-[#17663A] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {routingCalculator === "khatiyan" ? (
                        <Loader2 className="mx-auto animate-spin" size={15} />
                      ) : (
                        "খতিয়ান হিসাব"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={routingCalculator !== null}
                      onClick={() => void validateAndRoute("faraez", selected)}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2.5 text-xs font-bold disabled:opacity-50"
                    >
                      {routingCalculator === "faraez" ? (
                        <Loader2 className="mx-auto animate-spin" size={15} />
                      ) : (
                        "ফারায়েজ"
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {panelOpen ? (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[1px]">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="লেয়ার প্যানেল বন্ধ করুন"
            onClick={() => setPanelOpen(false)}
          />
          <aside className="relative flex h-full w-[min(92vw,24rem)] flex-col border-l border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-4">
              <div>
                <div className="font-black">মানচিত্র নিয়ন্ত্রণ</div>
                <div className="text-xs text-[var(--muted-foreground)]">আরএস/এমএস কনফিগারেশন অপরিবর্তিত</div>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-xl border border-[var(--border-color)] p-2"
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 border-b border-[var(--border-color)] p-2">
              {(["layers", "basemap", "results"] as Tab[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-xl px-2 py-2 text-xs font-bold ${
                    tab === item ? "bg-[#17663A] text-white" : "bg-[var(--secondary)] text-[var(--foreground)]"
                  }`}
                >
                  {item === "layers" ? "লেয়ার" : item === "basemap" ? "বেসম্যাপ" : `ফলাফল (${bn(results.length, 0)})`}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {tab === "basemap" ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setBasemap("satellite")}
                    className={`w-full rounded-2xl border p-4 text-left ${basemap === "satellite" ? "border-[#17663A] bg-emerald-50 dark:bg-emerald-950/40" : "border-[var(--border-color)]"}`}
                  >
                    <div className="font-black">স্যাটেলাইট</div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">উচ্চ রেজোলিউশনের বর্তমান বেসম্যাপ</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemap("light")}
                    className={`w-full rounded-2xl border p-4 text-left ${basemap === "light" ? "border-[#17663A] bg-emerald-50 dark:bg-emerald-950/40" : "border-[var(--border-color)]"}`}
                  >
                    <div className="font-black">রাস্তার মানচিত্র</div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">হালকা রাস্তা ও স্থাননাম বেসম্যাপ</div>
                  </button>
                  {isAdvanced ? (
                    <button
                      type="button"
                      onClick={() => setBasemap("satellite2003")}
                      className={`w-full rounded-2xl border p-4 text-left ${basemap === "satellite2003" ? "border-[#17663A] bg-emerald-50 dark:bg-emerald-950/40" : "border-[var(--border-color)]"}`}
                    >
                      <div className="font-black">ঐতিহাসিক স্যাটেলাইট ২০০৩</div>
                      <div className="mt-1 text-xs text-[var(--muted-foreground)]">ঐতিহাসিক তুলনার জন্য</div>
                    </button>
                  ) : null}
                </div>
              ) : tab === "results" ? (
                results.length ? (
                  <div className="space-y-3">
                    <div className="text-sm font-black">
                      {bn(rsResults.length, 0)} আরএস · {bn(msResults.length, 0)} এমএস ফলাফল
                    </div>
                    {[...rsResults, ...msResults].map((feature, index) => {
                      const kind = isMsFeature(feature) ? "ms" : "rs";
                      return (
                        <PlotCard
                          key={`${kind}-${feature.plotId ?? index}`}
                          kind={kind}
                          feature={feature}
                          active={selected?.plotId === feature.plotId}
                          onSelect={() => selectResult(feature)}
                        />
                      );
                    })}
                    {selected && activeDetails.length ? (
                      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--secondary)] p-3">
                        {activeDetails.map((row) => (
                          <div key={row.label} className="flex justify-between gap-3 border-b border-[var(--border-color)] py-2 text-xs last:border-0">
                            <span className="text-[var(--muted-foreground)]">{row.label}</span>
                            <span className="text-right font-bold">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-6 text-center text-sm text-[var(--muted-foreground)]">
                    এখনো কোনো দাগ ফলাফল নেই। মানচিত্রে দাগে চাপুন অথবা উপরে দাগ নম্বর খুঁজুন।
                  </div>
                )
              ) : isAdvanced ? (
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] p-3 text-sm font-bold">
                    <span>আরএস সীমানা ও লেবেল</span>
                    <input
                      type="checkbox"
                      checked={showRsBoundary}
                      onChange={(event) => setShowRsBoundary(event.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] p-3 text-sm font-bold">
                    <span>এমএস সীমানা ও লেবেল</span>
                    <input
                      type="checkbox"
                      checked={showMsBoundary}
                      onChange={(event) => setShowMsBoundary(event.target.checked)}
                    />
                  </label>
                  {LAYERS.map((layer) => (
                    <div key={layer.key} className="rounded-2xl border border-[var(--border-color)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-black">{LAYER_LABELS[layer.key].label}</div>
                          <div className="mt-1 text-xs text-[var(--muted-foreground)]">{LAYER_LABELS[layer.key].description}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={layers[layer.key]}
                          onChange={(event) =>
                            setLayers((current) => ({ ...current, [layer.key]: event.target.checked }))
                          }
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-xs text-[var(--muted-foreground)]">অপাসিটি</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={opacity[layer.key]}
                          onChange={(event) =>
                            setOpacity((current) => ({ ...current, [layer.key]: Number(event.target.value) }))
                          }
                          className="min-w-0 flex-1 accent-[#17663A]"
                        />
                        <span className="w-12 text-right text-xs font-bold">{bn(opacity[layer.key] * 100, 0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    আরএস ও এমএস মৌজা স্তর বর্তমান ডিফল্ট কনফিগারেশনে সক্রিয় আছে। সাধারণ ব্যবহারকারীর জন্য এই স্তরের সেটিং পরিবর্তন বন্ধ রাখা হয়েছে।
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("basemap")}
                    className="w-full rounded-2xl bg-[#17663A] px-4 py-3 text-sm font-bold text-white"
                  >
                    বেসম্যাপ পরিবর্তন করুন
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm">
          <aside className="flex h-full w-[min(84vw,22rem)] flex-col bg-[#0b1722] p-4 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#17663A]">
                  <MapIcon size={20} />
                </div>
                <div>
                  <div className="font-black">ল্যান্ডবিডি</div>
                  <div className="text-[11px] text-slate-400">স্মার্ট ভূমি সহায়ক</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-300"
                aria-label="মেনু বন্ধ করুন"
              >
                <X size={19} />
              </button>
            </div>

            <nav className="space-y-2">
              <Link href="/geospatial-map" className="flex items-center gap-3 rounded-2xl bg-[#17663A] px-4 py-3 font-bold text-white no-underline">
                <MapIcon size={19} /> মানচিত্র দেখুন
              </Link>
              <Link href="/dlrms-khatian" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-200 no-underline hover:bg-white/5">
                <Box size={19} /> খতিয়ান অনুসন্ধান
              </Link>
              <Link href="/land-measurement" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-200 no-underline hover:bg-white/5">
                <Ruler size={19} /> জমি পরিমাপ ক্যালকুলেটর
              </Link>
              <Link href="/mouza-map" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-200 no-underline hover:bg-white/5">
                <Layers3 size={19} /> মৌজা ম্যাপ ডাউনলোড
              </Link>
              <Link href="/faraez" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-slate-200 no-underline hover:bg-white/5">
                <Pentagon size={19} /> ফারায়েজ হিসাব
              </Link>
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4 text-xs leading-6 text-slate-400">
              মানচিত্রের আরএস/এমএস তথ্য বর্তমান LandBD সরকারি-উৎস সংযোগ থেকেই আসে। মাপজোকের আঁকা স্তরটি আলাদা এবং মূল দাগ ডেটা পরিবর্তন করে না।
            </div>
          </aside>
          <button
            type="button"
            className="absolute inset-y-0 right-0 left-[min(84vw,22rem)]"
            onClick={() => setMenuOpen(false)}
            aria-label="মেনু বন্ধ করুন"
          />
        </div>
      ) : null}

      {basemap === "satellite2003" ? (
        <a
          href={GOOGLE_EARTH_2003_URL}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-44 left-3 z-20 rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-slate-200 shadow backdrop-blur"
        >
          ঐতিহাসিক উৎস দেখুন ↗
        </a>
      ) : null}

      {!mapReady ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-slate-950/35 text-white backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-950/85 px-4 py-3 text-sm font-bold shadow-xl">
            <Loader2 className="animate-spin" size={18} /> মানচিত্র প্রস্তুত হচ্ছে…
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="pointer-events-none absolute left-1/2 top-20 z-[70] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-950/92 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
