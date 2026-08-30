"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreInstance } from "maplibre-gl";
import type { FeatureCollection, Geometry, Polygon } from "geojson";
import { Download, Filter, Loader2, Search, X } from "lucide-react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { sendPlotToFaraez, sendPlotToKhatiyan } from "@/src/modules/khatiyan/gis-bridge";
import type { KhatiyanPlot } from "@/src/shared/types";
import {
  BASEMAP_SOURCE_DEFINITIONS,
  EMPTY_FEATURE_COLLECTION,
  GIS_REQUEST_TIMEOUT_MS,
  HISTORIC_2003_CENTER,
  HISTORIC_2003_ZOOM,
  VECTOR_SOURCES,
} from "./types";
import { BASEMAP_RASTER_LAYERS, VECTOR_LAYER_STYLES } from "./layers";
import { bindMapViewport } from "./mapViewport";
import { exportMouzaClippedPng } from "./mouzaClipExport";

const EMPTY_GEOJSON = EMPTY_FEATURE_COLLECTION as FeatureCollection<Geometry>;
const SATELLITE_LAYER = BASEMAP_RASTER_LAYERS.satellite;
const SEARCH_DEBOUNCE_MS = 320;
const MIN_SEARCH_CHARS = 2;

type ApiFeatureCollection = { features?: RajukPlotFeature[] };
type MouzaSuggestion = {
  mauza: string;
  jl_no: string;
  m_guid?: string;
  upazila_ps?: string;
  m_district?: string;
};

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function toGeoJson(feature: RajukPlotFeature) {
  const rings = feature.geometry?.rings;
  if (!Array.isArray(rings) || rings.length === 0) return null;
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: rings },
    properties: feature.attributes ?? {},
  };
}

function featuresToFc(features: RajukPlotFeature[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: features.map(toGeoJson).filter((feature): feature is NonNullable<typeof feature> => Boolean(feature)),
  };
}

/** Strict attribute association: only exact mauza name (case-insensitive). */
function featureBelongsToMouza(feature: RajukPlotFeature, mauzaName: string): boolean {
  const target = mauzaName.trim().toLowerCase();
  if (!target) return false;
  const a = feature.attributes as Record<string, unknown>;
  const names = [a.rs_mauza_name, a.mauza, a.ms_mauza_name, a.ms_mauza]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter(Boolean);
  return names.includes(target);
}

function splitMouzaFeatures(features: RajukPlotFeature[]) {
  const rs: RajukPlotFeature[] = [];
  const ms: RajukPlotFeature[] = [];
  for (const feature of features) {
    const attrs = feature.attributes as Record<string, unknown>;
    const isMs = attrs._layer_source === "ms" || attrs.plot_kind === "ms" || present(attrs.ms_plot_no);
    if (isMs) ms.push(feature);
    else rs.push(feature);
  }
  return { rs, ms };
}

/** Collect exterior rings for exact polygon clip (all plots of the selected mouza). */
function collectClipRings(features: RajukPlotFeature[]): number[][][] {
  const rings: number[][][] = [];
  for (const feature of features) {
    const plotRings = feature.geometry?.rings;
    if (!Array.isArray(plotRings)) continue;
    for (const ring of plotRings) {
      if (Array.isArray(ring) && ring.length >= 3) rings.push(ring as number[][]);
    }
  }
  return rings;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GIS_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getSelectedKind(feature: RajukPlotFeature): "rs" | "ms" {
  const attrs = feature.attributes as Record<string, unknown>;
  return attrs._layer_source === "ms" || attrs.plot_kind === "ms" || present(attrs.ms_plot_no) ? "ms" : "rs";
}

export default function MouzaExportMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const [mouzaSearch, setMouzaSearch] = useState("");
  const [mouzaModalOpen, setMouzaModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MouzaSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [loadedMouza, setLoadedMouza] = useState<string | null>(null);
  const loadedMouzaRef = useRef<string | null>(null);
  loadedMouzaRef.current = loadedMouza;
  const [loadedFeatures, setLoadedFeatures] = useState<RajukPlotFeature[]>([]);
  const [isLoadingMouza, setIsLoadingMouza] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportPhase, setExportPhase] = useState("");
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const updateSourceData = useCallback((sourceId: string, data: FeatureCollection<Geometry>) => {
    const source = mapRef.current?.getSource(sourceId) as GeoJSONSource | undefined;
    source?.setData(data);
  }, []);

  const runMouzaSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (q.length < MIN_SEARCH_CHARS) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ action: "search-mouza", q, limit: "20" });
      const response = await fetch(`/api/rajuk/query?${params.toString()}`, { signal: controller.signal });
      const payload = (await response.json()) as { features?: MouzaSuggestion[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "মৌজা খোঁজা যায়নি");
      if (controller.signal.aborted) return;
      setSuggestions(Array.isArray(payload.features) ? payload.features : []);
      setHighlightIndex(-1);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setSuggestions([]);
      setError(cause instanceof Error ? cause.message : "মৌজা খোঁজা যায়নি");
    } finally {
      if (!controller.signal.aborted) setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (mouzaSearch.trim().length < MIN_SEARCH_CHARS) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = window.setTimeout(() => {
      void runMouzaSearch(mouzaSearch);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [mouzaSearch, runMouzaSearch]);

  const loadMouzaPolygons = useCallback(
    async (mouzaName: string, jlHint?: string) => {
      const normalized = mouzaName.trim();
      if (!normalized) {
        setError("মৌজার নাম লিখুন");
        return;
      }
      setIsLoadingMouza(true);
      setError("");
      setStatus("মৌজা প্রস্তুত হচ্ছে…");
      setSelected(null);
      try {
        const params = new URLSearchParams({
          action: "plots",
          mouza: normalized,
          kind: "all",
          limit: "800",
        });
        if (jlHint) params.set("jl", jlHint);
        const response = await fetchWithTimeout(`/api/rajuk/query?${params.toString()}`);
        const payload = (await response.json()) as ApiFeatureCollection & { error?: string };
        if (!response.ok) throw new Error(payload.error || "মৌজার ডাটা লোড করা যায়নি");
        const raw = Array.isArray(payload.features) ? payload.features : [];
        const features = raw.filter((f) => featureBelongsToMouza(f, normalized));
        const { rs, ms } = splitMouzaFeatures(features);
        if (!features.length) {
          updateSourceData(VECTOR_SOURCES.rsBoundary, EMPTY_GEOJSON);
          updateSourceData(VECTOR_SOURCES.msBoundary, EMPTY_GEOJSON);
          updateSourceData(VECTOR_SOURCES.selectedPlot, EMPTY_GEOJSON);
          setLoadedMouza(null);
          setLoadedFeatures([]);
          setStatus("এই নামে কোনো মৌজা পাওয়া যায়নি");
          return;
        }
        updateSourceData(VECTOR_SOURCES.rsBoundary, featuresToFc(rs) as FeatureCollection<Geometry>);
        updateSourceData(VECTOR_SOURCES.msBoundary, featuresToFc(ms) as FeatureCollection<Geometry>);
        updateSourceData(VECTOR_SOURCES.selectedPlot, EMPTY_GEOJSON);
        setLoadedMouza(normalized);
        setLoadedFeatures(features);
        setMouzaModalOpen(false);
        setSuggestions([]);
        setStatus(`${normalized}: RS ${rs.length} · MS ${ms.length} প্লট (শুধু নির্বাচিত মৌজা)`);

        const map = mapRef.current;
        if (map) {
          const bounds = new maplibregl.LngLatBounds();
          let any = false;
          for (const feature of features) {
            for (const ring of feature.geometry?.rings ?? []) {
              for (const coord of ring) {
                const lng = Number(coord[0]);
                const lat = Number(coord[1]);
                if (Number.isFinite(lng) && Number.isFinite(lat)) {
                  bounds.extend([lng, lat]);
                  any = true;
                }
              }
            }
          }
          if (any) map.fitBounds(bounds, { padding: 56, maxZoom: 18, duration: 700 });
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "মৌজার ডাটা লোড করা যায়নি");
      } finally {
        setIsLoadingMouza(false);
      }
    },
    [updateSourceData],
  );

  const selectSuggestion = useCallback(
    (item: MouzaSuggestion) => {
      setMouzaSearch(item.mauza);
      void loadMouzaPolygons(item.mauza, item.jl_no);
    },
    [loadMouzaPolygons],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: { version: 8, sources: {}, layers: [] },
      center: HISTORIC_2003_CENTER,
      zoom: HISTORIC_2003_ZOOM,
      minZoom: 8,
      maxZoom: 21,
      renderWorldCopies: false,
      canvasContextAttributes: {
        preserveDrawingBuffer: true,
      },
    });
    mapRef.current = map;
    const unbindViewport = bindMapViewport(map, containerRef.current!);

    const onLoad = () => {
      if (!map.getSource("basemap-satellite")) {
        map.addSource("basemap-satellite", BASEMAP_SOURCE_DEFINITIONS.satellite);
      }
      if (!map.getLayer(SATELLITE_LAYER.id)) map.addLayer(SATELLITE_LAYER);

      const vectorSourceIds = [VECTOR_SOURCES.rsBoundary, VECTOR_SOURCES.msBoundary, VECTOR_SOURCES.selectedPlot];
      for (const sourceId of vectorSourceIds) {
        if (!map.getSource(sourceId)) map.addSource(sourceId, { type: "geojson", data: EMPTY_GEOJSON });
      }

      const vectorLayers = [
        VECTOR_LAYER_STYLES.rsBoundaryFill,
        VECTOR_LAYER_STYLES.rsBoundaryLine,
        VECTOR_LAYER_STYLES.rsPlotLabels,
        VECTOR_LAYER_STYLES.msBoundaryFill,
        VECTOR_LAYER_STYLES.msBoundaryLine,
        VECTOR_LAYER_STYLES.msPlotLabels,
        VECTOR_LAYER_STYLES.selectedPlotFill,
        VECTOR_LAYER_STYLES.selectedPlotLine,
      ];
      for (const layer of vectorLayers) {
        if (!map.getLayer(layer.id)) map.addLayer(layer);
      }
    };

    const onClick = async (event: maplibregl.MapMouseEvent) => {
      try {
        const params = new URLSearchParams({
          action: "identify",
          lat: String(event.lngLat.lat),
          lng: String(event.lngLat.lng),
        });
        const response = await fetchWithTimeout(`/api/rajuk/query?${params.toString()}`);
        const payload = (await response.json()) as ApiFeatureCollection & { error?: string };
        if (!response.ok) throw new Error(payload.error || "দাগের তথ্য পাওয়া যায়নি");
        const features = Array.isArray(payload.features) ? payload.features : [];
        const activeMouza = loadedMouzaRef.current;
        const scoped = activeMouza
          ? features.filter((f) => featureBelongsToMouza(f, activeMouza))
          : features;
        const feature = scoped[0] ?? null;
        setSelected(feature);
        if (!feature) {
          updateSourceData(VECTOR_SOURCES.selectedPlot, EMPTY_GEOJSON);
          setStatus(activeMouza ? "নির্বাচিত মৌজার বাইরে দাগ নেই" : "এই অবস্থানে কোনো দাগ পাওয়া যায়নি");
          return;
        }
        const kind = getSelectedKind(feature);
        updateSourceData(VECTOR_SOURCES.selectedPlot, featuresToFc([feature]) as FeatureCollection<Geometry>);
        setStatus(`${kind === "ms" ? "এমএস" : "আরএস"} দাগ ${feature.attributes.plot_no ?? "—"}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "দাগ শনাক্ত করা যায়নি");
      }
    };

    map.on("load", onLoad);
    map.on("click", onClick);
    return () => {
      unbindViewport();
      map.off("load", onLoad);
      map.off("click", onClick);
      map.remove();
      mapRef.current = null;
    };
  }, [updateSourceData]);

  const routeSelectedPlot = useCallback(async (destination: "khatiyan" | "faraez") => {
    if (!selected) return;
    setError("");
    try {
      const response = await fetchWithTimeout("/api/rajuk/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "adapt-for-khatiyan", feature: selected, shapeAreaUnit: "square-feet" }),
      });
      const payload = (await response.json()) as { plot?: KhatiyanPlot; error?: string };
      if (!response.ok || !payload.plot) throw new Error(payload.error || "দাগটি ক্যালকুলেটরের জন্য প্রস্তুত করা যায়নি");
      if (destination === "khatiyan") sendPlotToKhatiyan(payload.plot);
      else sendPlotToFaraez(payload.plot);
      window.location.assign(destination === "khatiyan" ? "/khatiyan" : "/faraez");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "দাগটি ক্যালকুলেটরে পাঠানো যায়নি");
    }
  }, [selected]);

  const handleExport = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !loadedMouza || isExporting) return;
    const clipRings = collectClipRings(loadedFeatures);
    if (!clipRings.length) {
      setError("মৌজার সীমানা পাওয়া যায়নি");
      return;
    }
    setIsExporting(true);
    setError("");
    try {
      setExportPhase("মৌজা সীমানায় জুম…");
      setExportPhase("উচ্চ রেজোলিউশন রেন্ডার…");
      setExportPhase("মৌজা বহুভুজে ক্লিপ…");
      await exportMouzaClippedPng(map, {
        width: 3840,
        height: 2160,
        clipRings,
        filename: `landbd-${loadedMouza.replace(/[^\p{L}\p{N}]+/gu, "-")}-mouza-only.png`,
      });
      setStatus(`${loadedMouza}: শুধু নির্বাচিত মৌজা ডাউনলোড হয়েছে`);
      setExportPhase("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ম্যাপ ডাউনলোড করা যায়নি");
      setExportPhase("");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, loadedFeatures, loadedMouza]);

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        selectSuggestion(suggestions[highlightIndex]);
      } else {
        void loadMouzaPolygons(mouzaSearch);
      }
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setHighlightIndex(-1);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--background)]">
      <div
        ref={containerRef}
        className="absolute inset-0 [&_.maplibregl-map]:!h-full [&_.maplibregl-map]:!w-full [&_.maplibregl-canvas]:!h-full [&_.maplibregl-canvas]:!w-full"
        style={{ width: "100%", height: "100%" }}
        aria-label="মৌজা মানচিত্র"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto rounded-2xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/90">
          <button
            type="button"
            onClick={() => setMouzaModalOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Filter className="h-4 w-4" />
            মৌজা ফিল্টার
          </button>
        </div>

        {loadedMouza ? (
          <div className="pointer-events-auto rounded-2xl border border-white/60 bg-white/90 p-2 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-950/90">
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70 dark:bg-white dark:text-slate-900"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? exportPhase || "ম্যাপ তৈরি হচ্ছে…" : "শুধু এই মৌজা ডাউনলোড (4K)"}
            </button>
          </div>
        ) : null}
      </div>

      {mouzaModalOpen ? (
        <div className="absolute left-3 top-20 z-20 w-[min(92vw,360px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">মৌজা নির্বাচন</h2>
              <p className="mt-1 text-xs text-slate-500">শুধু নির্বাচিত মৌজার RS/MS প্লট লোড হবে।</p>
            </div>
            <button type="button" onClick={() => setMouzaModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="বন্ধ করুন">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="mouza-search">
              মৌজার নাম
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="mouza-search"
                    value={mouzaSearch}
                    onChange={(event) => setMouzaSearch(event.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder="যেমন: Patira"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    autoFocus
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={suggestions.length > 0}
                    aria-controls="mouza-suggestions"
                    aria-autocomplete="list"
                  />
                </div>
                <button
                  type="button"
                  disabled={isLoadingMouza}
                  onClick={() => void loadMouzaPolygons(mouzaSearch)}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
                >
                  {isLoadingMouza ? <Loader2 className="h-4 w-4 animate-spin" /> : "লোড"}
                </button>
              </div>
              {(searchLoading || suggestions.length > 0 || (mouzaSearch.trim().length >= MIN_SEARCH_CHARS && !searchLoading)) && (
                <ul
                  id="mouza-suggestions"
                  ref={listRef}
                  role="listbox"
                  className="absolute left-0 right-12 z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  {searchLoading ? (
                    <li className="px-3 py-2 text-xs text-slate-500">খোঁজা হচ্ছে…</li>
                  ) : suggestions.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-slate-500">কোনো মৌজা পাওয়া যায়নি</li>
                  ) : (
                    suggestions.map((item, index) => (
                      <li key={`${item.mauza}-${item.jl_no}-${index}`} role="option" aria-selected={index === highlightIndex}>
                        <button
                          type="button"
                          className={`flex w-full flex-col px-3 py-2 text-left text-sm ${index === highlightIndex ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                          onMouseEnter={() => setHighlightIndex(index)}
                          onClick={() => selectSuggestion(item)}
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{item.mauza}</span>
                          <span className="text-[11px] text-slate-500">
                            JL {item.jl_no || "—"}
                            {item.upazila_ps ? ` · ${item.upazila_ps}` : ""}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 w-[min(92vw,520px)] -translate-x-1/2 space-y-2">
        {error ? (
          <div className="pointer-events-auto rounded-xl border border-red-200 bg-white/95 px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-900 dark:bg-slate-950/95 dark:text-red-300">
            {error}
          </div>
        ) : null}
        {status ? (
          <div className="rounded-xl border border-white/60 bg-white/90 px-4 py-2.5 text-center text-xs font-medium text-slate-700 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200">
            {status}
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="absolute bottom-4 right-3 z-20 w-[min(92vw,340px)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">দাগের তথ্য</h2>
            <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="বন্ধ করুন">
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">দাগ নং</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{selected.attributes.plot_no ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">আরএস</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{selected.attributes.rs_plot_no ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">এমএস</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">{selected.attributes.ms_plot_no ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">মৌজা</dt>
              <dd className="font-semibold text-slate-900 dark:text-white">
                {String(selected.attributes.rs_mauza_name ?? selected.attributes.mauza ?? loadedMouza ?? "—")}
              </dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void routeSelectedPlot("khatiyan")} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
              খতিয়ান
            </button>
            <button type="button" onClick={() => void routeSelectedPlot("faraez")} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
              ফারায়েজ
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
