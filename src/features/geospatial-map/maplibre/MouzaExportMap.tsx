"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useRef, useState } from "react";
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
  VECTOR_LAYERS,
  VECTOR_SOURCES,
} from "./types";
import { BASEMAP_RASTER_LAYERS, VECTOR_LAYER_STYLES } from "./layers";
import { exportMapAsHighResolutionPng } from "./exportMap";

const EMPTY_GEOJSON = EMPTY_FEATURE_COLLECTION as FeatureCollection<Geometry>;
const SATELLITE_LAYER = BASEMAP_RASTER_LAYERS.satellite;

type ApiFeatureCollection = { features?: RajukPlotFeature[] };

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

function toFeatureCollection(features: RajukPlotFeature[]): FeatureCollection<Polygon> {
  return featuresToFc(features);
}

export default function MouzaExportMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const [mouzaSearch, setMouzaSearch] = useState("");
  const [mouzaModalOpen, setMouzaModalOpen] = useState(false);
  const [loadedMouza, setLoadedMouza] = useState<string | null>(null);
  const [isLoadingMouza, setIsLoadingMouza] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const updateSourceData = useCallback((sourceId: string, data: FeatureCollection<Geometry>) => {
    const source = mapRef.current?.getSource(sourceId) as GeoJSONSource | undefined;
    source?.setData(data);
  }, []);

  const loadMouzaPolygons = useCallback(async (mouzaName: string) => {
    const normalized = mouzaName.trim();
    if (!normalized) {
      setError("মৌজার নাম লিখুন");
      return;
    }
    setIsLoadingMouza(true);
    setError("");
    setStatus("");
    try {
      const params = new URLSearchParams({ action: "plots", mouza: normalized, kind: "all", limit: "800" });
      const response = await fetchWithTimeout(`/api/rajuk/query?${params.toString()}`);
      const payload = (await response.json()) as ApiFeatureCollection & { error?: string };
      if (!response.ok) throw new Error(payload.error || "মৌজার ডাটা লোড করা যায়নি");
      const features = Array.isArray(payload.features) ? payload.features : [];
      const { rs, ms } = splitMouzaFeatures(features);
      if (!features.length) {
        updateSourceData(VECTOR_SOURCES.rsBoundary, EMPTY_GEOJSON);
        updateSourceData(VECTOR_SOURCES.msBoundary, EMPTY_GEOJSON);
        setLoadedMouza(null);
        setStatus("এই নামে কোনো মৌজা পাওয়া যায়নি");
        return;
      }
      updateSourceData(VECTOR_SOURCES.rsBoundary, toFeatureCollection(rs) as FeatureCollection<Geometry>);
      updateSourceData(VECTOR_SOURCES.msBoundary, toFeatureCollection(ms) as FeatureCollection<Geometry>);
      setLoadedMouza(normalized);
      setMouzaModalOpen(false);
      setStatus(`${normalized}: ${features.length.toLocaleString("en-US")} টি প্লট লোড হয়েছে`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "মৌজার ডাটা লোড করা যায়নি");
    } finally {
      setIsLoadingMouza(false);
    }
  }, [updateSourceData]);

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
      preserveDrawingBuffer: true,
    });
    mapRef.current = map;

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
        const params = new URLSearchParams({ action: "identify", lat: String(event.lngLat.lat), lng: String(event.lngLat.lng) });
        const response = await fetchWithTimeout(`/api/rajuk/query?${params.toString()}`);
        const payload = (await response.json()) as ApiFeatureCollection & { error?: string };
        if (!response.ok) throw new Error(payload.error || "দাগের তথ্য পাওয়া যায়নি");
        const features = Array.isArray(payload.features) ? payload.features : [];
        const feature = features[0] ?? null;
        setSelected(feature);
        if (!feature) {
          updateSourceData(VECTOR_SOURCES.selectedPlot, EMPTY_GEOJSON);
          setStatus("এই অবস্থানে কোনো দাগ পাওয়া যায়নি");
          return;
        }
        const kind = getSelectedKind(feature);
        const selectedGeoJson = toFeatureCollection([feature]) as FeatureCollection<Geometry>;
        updateSourceData(VECTOR_SOURCES.selectedPlot, selectedGeoJson);
        setStatus(`${kind === "ms" ? "এমএস" : "আরএস"} দাগ ${feature.attributes.plot_no ?? "—"}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "দাগ শনাক্ত করা যায়নি");
      }
    };

    map.on("load", onLoad);
    map.on("click", onClick);
    return () => {
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
    setIsExporting(true);
    setError("");
    try {
      await exportMapAsHighResolutionPng(map, {
        width: 3840,
        height: 2160,
        filename: `landbd-${loadedMouza.replace(/[^\p{L}\p{N}]+/gu, "-")}-4k.png`,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ম্যাপ ডাউনলোড করা যায়নি");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, loadedMouza]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--background)]">
      <div ref={containerRef} className="absolute inset-0" aria-label="মৌজা মানচিত্র" />

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
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70 dark:bg-white dark:text-slate-900"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? "ম্যাপ তৈরি হচ্ছে…" : "ম্যাপ ডাউনলোড (4K)"}
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
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadMouzaPolygons(mouzaSearch);
            }}
            className="space-y-3"
          >
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="mouza-search">মৌজার নাম</label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="mouza-search"
                  value={mouzaSearch}
                  onChange={(event) => setMouzaSearch(event.target.value)}
                  placeholder="যেমন: Patira"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-offset-2 focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={isLoadingMouza} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">
                {isLoadingMouza ? <Loader2 className="h-4 w-4 animate-spin" /> : "লোড"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 w-[min(92vw,520px)] -translate-x-1/2 space-y-2">
        {error ? <div className="pointer-events-auto rounded-xl border border-red-200 bg-white/95 px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-900 dark:bg-slate-950/95 dark:text-red-300">{error}</div> : null}
        {status ? <div className="rounded-xl border border-white/60 bg-white/90 px-4 py-2.5 text-center text-xs font-medium text-slate-700 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200">{status}</div> : null}
      </div>

      {selected ? (
        <div className="absolute bottom-4 right-3 z-20 w-[min(92vw,340px)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">দাগের তথ্য</h2>
            <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="বন্ধ করুন"><X className="h-4 w-4" /></button>
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">দাগ নং</dt><dd className="font-semibold text-slate-900 dark:text-white">{selected.attributes.plot_no ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">আরএস</dt><dd className="font-semibold text-slate-900 dark:text-white">{selected.attributes.rs_plot_no ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">এমএস</dt><dd className="font-semibold text-slate-900 dark:text-white">{selected.attributes.ms_plot_no ?? "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">মৌজা</dt><dd className="font-semibold text-slate-900 dark:text-white">{String(selected.attributes.rs_mauza_name ?? selected.attributes.mauza ?? loadedMouza ?? "—")}</dd></div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void routeSelectedPlot("khatiyan")} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">খতিয়ান</button>
            <button type="button" onClick={() => void routeSelectedPlot("faraez")} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">ফারায়েজ</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
