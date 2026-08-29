"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as maplibregl from "maplibre-gl";
import type {
  GeoJSONSource,
  Map as MapLibreInstance,
  MapGeoJSONFeature,
} from "maplibre-gl";
import type { FeatureCollection, Geometry, Polygon } from "geojson";
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
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { sendPlotToFaraez, sendPlotToKhatiyan } from "@/src/modules/khatiyan/gis-bridge";
import {
  BASEMAP_SOURCE_DEFINITIONS,
  EMPTY_FEATURE_COLLECTION,
  GIS_REQUEST_TIMEOUT_MS,
  HISTORIC_2003_CENTER,
  HISTORIC_2003_ZOOM,
  MIN_ZOOM_FOR_VECTOR,
  RAJUK_RASTER_SOURCE_DEFINITIONS,
  RASTER_LAYERS,
  RASTER_SOURCES,
  VECTOR_LAYERS,
  VECTOR_SOURCES,
  type BasemapKey,
  type MapRasterKey,
} from "./types";
import { BASEMAP_RASTER_LAYERS, RAJUK_RASTER_LAYERS, VECTOR_LAYER_STYLES } from "./layers";

const EMPTY_GEOJSON = EMPTY_FEATURE_COLLECTION as FeatureCollection<Geometry>;

type Tab = "layers" | "basemap" | "results";
type LayerKey = MapRasterKey;
type LayerDef = {
  key: LayerKey;
  label: string;
  description: string;
  color: string;
  defaultVisible: boolean;
};

const LAYERS: LayerDef[] = [
  { key: "dap", label: "DAP Proposed Landuse", description: "Proposed land-use zones", color: "#16a34a", defaultVisible: true },
  { key: "rs", label: "RS Mauza tiles", description: "Hosted/RS_Mauza_282Scale MapServer", color: "#2563eb", defaultVisible: true },
  { key: "ms", label: "MS Mauza tiles", description: "Hosted/MS_Mauza_Tiles_Final MapServer", color: "#7c3aed", defaultVisible: true },
  { key: "flood", label: "Flood Overlay", description: "Flood susceptibility overlay", color: "#0891b2", defaultVisible: false },
  { key: "boundary", label: "Overlay Boundary", description: "Planning boundary tiles", color: "#ea580c", defaultVisible: false },
  { key: "transport", label: "Transport Network", description: "Transport network tiles", color: "#dc2626", defaultVisible: false },
];

const PUBLIC_LAYER_VISIBILITY: Record<LayerKey, boolean> = {
  dap: false,
  rs: true,
  ms: true,
  flood: false,
  boundary: false,
  transport: false,
};

const PUBLIC_LAYER_OPACITY: Record<LayerKey, number> = {
  dap: 1,
  rs: 1,
  ms: 1,
  flood: 1,
  boundary: 1,
  transport: 1,
};

const ADVANCED_LAYER_VISIBILITY = Object.fromEntries(LAYERS.map((layer) => [layer.key, layer.defaultVisible])) as Record<LayerKey, boolean>;
const ADVANCED_LAYER_OPACITY = Object.fromEntries(LAYERS.map((layer) => [layer.key, layer.key === "ms" ? 0.72 : 0.78])) as Record<LayerKey, number>;

const PUBLIC_BASEMAP_KEYS: BasemapKey[] = ["osm", "satellite"];
const BASemap_LABELS: Record<BasemapKey, string> = {
  osm: "রাস্তার মানচিত্র",
  light: "Light",
  satellite: "স্যাটেলাইট",
  satellite2003: "স্যাটেলাইট ২০০৩",
};

const GOOGLE_EARTH_2003_URL = "https://earth.google.com/web/@23.82810618,90.48911986,3.60010157a,3337.57801622d,35y,-0h,0t,0r/data=ChYqEAgBEgoyMDAzLTAxLTE3GAFCAggBOgMKATBCAggASg0I____________ARAA?authuser=0";
const EMPTY_FEATURES = { type: "FeatureCollection" as const, features: [] as RajukPlotFeature[] };

function present(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return String(value);
}

function isMsFeature(feature: RajukPlotFeature): boolean {
  const a = feature.attributes as Record<string, unknown>;
  return a._layer_source === "ms" || a.plot_kind === "ms" || present(a.ms_plot_no);
}

function isRsFeature(feature: RajukPlotFeature): boolean {
  const a = feature.attributes as Record<string, unknown>;
  return a._layer_source === "rs" || a.plot_kind === "rs" || (present(a.rs_plot_no) && !present(a.ms_plot_no));
}

function rsNumber(feature: RajukPlotFeature): string {
  const a = feature.attributes as Record<string, unknown>;
  if (present(a.rs_plot_no)) return String(a.rs_plot_no);
  if (isRsFeature(feature) && present(a.plot_no)) return `RS-${a.plot_no}`;
  return "—";
}

function msNumber(feature: RajukPlotFeature): string {
  const a = feature.attributes as Record<string, unknown>;
  if (present(a.ms_plot_no)) return String(a.ms_plot_no);
  if (isMsFeature(feature) && present(a.plot_no)) return `MS-${a.plot_no}`;
  return "—";
}

function detailRows(feature: RajukPlotFeature, kind: "rs" | "ms") {
  const a = feature.attributes as Record<string, unknown>;
  if (kind === "ms") {
    return [
      ["এমএস দাগ নম্বর", msNumber(feature)],
      ["দাগ নং", formatValue(a.plot_no)],
      ["জেএল নং", formatValue(a.jl_no ?? a.rs_jl_no)],
      ["আয়তন (কাঠা)", formatValue(a.ms_plot_area ?? a.area_katha)],
      ["মৌজা", formatValue(a.mauza ?? a.rs_mauza_name)],
      ["থানা/উপজেলা", formatValue(a.thana_upazila ?? a.upazila_ps)],
      ["জেলা", formatValue(a.m_district ?? a.district)],
      ["ঠিকানা", formatValue(a.address_search)],
    ] as const;
  }
  return [
    ["আরএস দাগ নম্বর", rsNumber(feature)],
    ["দাগ নং", formatValue(a.plot_no)],
    ["জেএল নং", formatValue(a.rs_jl_no ?? a.jl_no)],
    ["আয়তন (কাঠা)", formatValue(a.rs_plot_area ?? a.area_katha)],
    ["মৌজা", formatValue(a.rs_mauza_name ?? a.mauza)],
    ["থানা/উপজেলা", formatValue(a.thana_upazila ?? a.upazila_ps)],
    ["জেলা", formatValue(a.m_district ?? a.district)],
    ["ঠিকানা", formatValue(a.address_search)],
  ] as const;
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

function renderedFeatureToRajuk(feature: MapGeoJSONFeature, sourceKind: "rs" | "ms"): RajukPlotFeature | null {
  if (!feature.geometry || feature.geometry.type !== "Polygon") return null;
  const geometry = feature.geometry as GeoJSON.Polygon;
  if (!geometry.coordinates.length) return null;
  return {
    attributes: {
      ...(feature.properties ?? {}),
      objectid: Number(feature.properties?.objectid ?? 0),
      plot_no: feature.properties?.plot_no == null ? null : Number(feature.properties.plot_no),
      p_guid: feature.properties?.p_guid == null ? null : String(feature.properties.p_guid),
      rs_plot_no: feature.properties?.rs_plot_no == null ? null : String(feature.properties.rs_plot_no),
      ms_plot_no: feature.properties?.ms_plot_no == null ? null : String(feature.properties.ms_plot_no),
      address_search: feature.properties?.address_search == null ? null : String(feature.properties.address_search),
      Shape__Area: feature.properties?.Shape__Area == null ? null : Number(feature.properties.Shape__Area),
      Shape__Length: feature.properties?.Shape__Length == null ? null : Number(feature.properties.Shape__Length),
      plot_kind: sourceKind,
      _layer_source: sourceKind,
    },
    geometry: { rings: geometry.coordinates as number[][][] },
  };
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), GIS_REQUEST_TIMEOUT_MS);
  const abortFromExternal = () => controller.abort();
  externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}

export default function MapLibreMap() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isAdvanced = isLoggedIn;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const extentTimerRef = useRef<number | null>(null);
  const extentControllerRef = useRef<AbortController | null>(null);
  const extentRequestIdRef = useRef(0);
  const mapReadyRef = useRef(false);
  const identifyModeRef = useRef(true);

  const [tab, setTab] = useState<Tab>("layers");
  const [panelOpen, setPanelOpen] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(PUBLIC_LAYER_VISIBILITY);
  const [opacity, setOpacity] = useState<Record<LayerKey, number>>(PUBLIC_LAYER_OPACITY);
  const [showRsBoundary, setShowRsBoundary] = useState(false);
  const [showMsBoundary, setShowMsBoundary] = useState(false);
  const [basemap, setBasemap] = useState<BasemapKey>("osm");
  const [plotNo, setPlotNo] = useState("");
  const [searching, setSearching] = useState(false);
  const [identifyMode, setIdentifyMode] = useState(true);
  const [results, setResults] = useState<RajukPlotFeature[]>([]);
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [toast, setToast] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [vectorStatus, setVectorStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [publicResultsOpen, setPublicResultsOpen] = useState(true);
  const [routingCalculator, setRoutingCalculator] = useState<"khatiyan" | "faraez" | null>(null);

  identifyModeRef.current = identifyMode;

  const rsResults = useMemo(() => results.filter(isRsFeature), [results]);
  const msResults = useMemo(() => results.filter(isMsFeature), [results]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4000);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    setLayers(isAdvanced ? { ...ADVANCED_LAYER_VISIBILITY } : { ...PUBLIC_LAYER_VISIBILITY });
    setOpacity(isAdvanced ? { ...ADVANCED_LAYER_OPACITY } : { ...PUBLIC_LAYER_OPACITY });
    setShowRsBoundary(isAdvanced);
    setShowMsBoundary(isAdvanced);
    setPanelOpen(isAdvanced);
    if (!isAdvanced) {
      setBasemap((current) => PUBLIC_BASEMAP_KEYS.includes(current) ? current : "osm");
    }
  }, [authLoading, isAdvanced]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: { version: 8, sources: {}, layers: [] },
      center: HISTORIC_2003_CENTER,
      zoom: HISTORIC_2003_ZOOM,
      minZoom: 8,
      maxZoom: 21,
      attributionControl: true,
      renderWorldCopies: false,
    });
    mapRef.current = map;

    const addSources = () => {
      (Object.keys(BASEMAP_SOURCE_DEFINITIONS) as BasemapKey[]).forEach((key) => {
        const sourceId = key === "osm" ? RASTER_SOURCES.basemapOsm : key === "light" ? RASTER_SOURCES.basemapLight : key === "satellite" ? RASTER_SOURCES.basemapSatellite : RASTER_SOURCES.basemapSatellite2003;
        if (!map.getSource(sourceId)) map.addSource(sourceId, BASEMAP_SOURCE_DEFINITIONS[key]);
      });
      (Object.keys(RAJUK_RASTER_SOURCE_DEFINITIONS) as MapRasterKey[]).forEach((key) => {
        if (!map.getSource(RASTER_SOURCES[key])) map.addSource(RASTER_SOURCES[key], RAJUK_RASTER_SOURCE_DEFINITIONS[key]);
      });
      (Object.values(VECTOR_SOURCES)).forEach((sourceId) => {
        if (!map.getSource(sourceId)) map.addSource(sourceId, { type: "geojson", data: EMPTY_GEOJSON });
      });
    };

    const addLayers = () => {
      Object.values(BASEMAP_RASTER_LAYERS).forEach((layer) => {
        if (!map.getLayer(layer.id)) map.addLayer({ ...layer, layout: { visibility: layer.id === RASTER_LAYERS.basemapOsm ? "visible" : "none" } });
      });
      Object.values(RAJUK_RASTER_LAYERS).forEach((layer) => {
        if (!map.getLayer(layer.id)) map.addLayer({ ...layer, layout: { visibility: layer.id === RASTER_LAYERS.rs || layer.id === RASTER_LAYERS.ms ? "visible" : "none" } });
      });
      [
        VECTOR_LAYER_STYLES.rsBoundaryFill,
        VECTOR_LAYER_STYLES.rsBoundaryLine,
        VECTOR_LAYER_STYLES.msBoundaryFill,
        VECTOR_LAYER_STYLES.msBoundaryLine,
        VECTOR_LAYER_STYLES.selectedPlotFill,
        VECTOR_LAYER_STYLES.selectedPlotLine,
        VECTOR_LAYER_STYLES.accuracyFill,
        VECTOR_LAYER_STYLES.accuracyLine,
        VECTOR_LAYER_STYLES.locationPoint,
      ].forEach((layer) => {
        if (!map.getLayer(layer.id)) map.addLayer(layer);
      });
    };

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      if (!identifyModeRef.current) return;
      const features = map.queryRenderedFeatures(event.point, {
        layers: [VECTOR_LAYERS.rsBoundaryFill, VECTOR_LAYERS.rsBoundaryLine, VECTOR_LAYERS.msBoundaryFill, VECTOR_LAYERS.msBoundaryLine, RASTER_LAYERS.rs, RASTER_LAYERS.ms],
      });
      const vector = features.find((feature: MapGeoJSONFeature) => feature.geometry?.type === "Polygon");
      if (!vector) return;
      const sourceKind = String(vector.properties?._layer_source ?? "").toLowerCase() === "ms" || String(vector.properties?.plot_kind ?? "").toLowerCase() === "ms" ? "ms" : "rs";
      const parcel = renderedFeatureToRajuk(vector, sourceKind);
      if (!parcel) return;
      setSelected(parcel);
      setResults((current) => {
        const id = parcel.attributes.objectid;
        const filtered = current.filter((item) => item.attributes.objectid !== id);
        return [parcel, ...filtered];
      });
      setTab("results");
      setPanelOpen(true);
      updateSourceData(map, VECTOR_SOURCES.selectedPlot, featuresToFc([parcel]) as FeatureCollection<Geometry>);
    };

    const handleMove = () => {
      if (extentTimerRef.current) window.clearTimeout(extentTimerRef.current);
      extentTimerRef.current = window.setTimeout(() => void loadExtent(), 300);
    };

    map.once("load", () => {
      try {
        addSources();
        addLayers();
        mapReadyRef.current = true;
        setMapReady(true);
        void loadExtent();
      } catch (error) {
        console.error("MapLibre initialization failed:", error);
        setInitError(error instanceof Error ? error.message : "Map initialization failed");
      }
    });

    map.on("click", handleClick);
    map.on("moveend", handleMove);
    map.on("zoomend", handleMove);

    return () => {
      if (extentTimerRef.current) window.clearTimeout(extentTimerRef.current);
      extentControllerRef.current?.abort();
      map.off("click", handleClick);
      map.off("moveend", handleMove);
      map.off("zoomend", handleMove);
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };

    async function loadExtent() {
      if (!mapReadyRef.current || map.getZoom() < MIN_ZOOM_FOR_VECTOR) {
        setVectorStatus(map.getZoom() < MIN_ZOOM_FOR_VECTOR ? `দাগের সীমানা দেখতে জুম ${MIN_ZOOM_FOR_VECTOR}+ করুন` : "");
        if (map.getZoom() < MIN_ZOOM_FOR_VECTOR) {
          updateSourceData(map, VECTOR_SOURCES.rsBoundary, EMPTY_GEOJSON);
          updateSourceData(map, VECTOR_SOURCES.msBoundary, EMPTY_GEOJSON);
        }
        return;
      }

      extentControllerRef.current?.abort();
      const controller = new AbortController();
      extentControllerRef.current = controller;
      const requestId = ++extentRequestIdRef.current;
      const bounds = map.getBounds();
      const query = (kind: "rs" | "ms") => {
        const params = new URLSearchParams({
          action: "extent",
          kind,
          xmin: String(bounds.getWest()),
          ymin: String(bounds.getSouth()),
          xmax: String(bounds.getEast()),
          ymax: String(bounds.getNorth()),
          limit: "400",
        });
        return fetchWithTimeout(`/api/rajuk/query?${params.toString()}`, {}, controller.signal).then(async (response) => {
          if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || `RAJUK ${kind.toUpperCase()} request failed`);
          return (await response.json()) as { features?: RajukPlotFeature[] };
        });
      };

      setVectorStatus("দাগের সীমানা লোড হচ্ছে…");
      try {
        const [rs, ms] = await Promise.all([query("rs"), query("ms")]);
        if (controller.signal.aborted || requestId !== extentRequestIdRef.current) return;
        const rsFeatures = Array.isArray(rs.features) ? rs.features : [];
        const msFeatures = Array.isArray(ms.features) ? ms.features : [];
        updateSourceData(map, VECTOR_SOURCES.rsBoundary, featuresToFc(rsFeatures) as FeatureCollection<Geometry>);
        updateSourceData(map, VECTOR_SOURCES.msBoundary, featuresToFc(msFeatures) as FeatureCollection<Geometry>);
        setVectorStatus(`${rsFeatures.length + msFeatures.length}টি দাগ লোড হয়েছে`);
      } catch (error) {
        if (controller.signal.aborted || requestId !== extentRequestIdRef.current) return;
        console.error("RAJUK extent load failed:", error);
        setVectorStatus(error instanceof Error ? error.message : "দাগের সীমানা লোড করা যায়নি");
      }
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const sourceLayerMap: Record<BasemapKey, string> = {
      osm: RASTER_LAYERS.basemapOsm,
      light: RASTER_LAYERS.basemapLight,
      satellite: RASTER_LAYERS.basemapSatellite,
      satellite2003: RASTER_LAYERS.basemapSatellite2003,
    };
    (Object.entries(sourceLayerMap) as Array<[BasemapKey, string]>).forEach(([key, layerId]) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", key === basemap ? "visible" : "none");
    });
    if (basemap === "satellite2003") map.flyTo({ center: HISTORIC_2003_CENTER, zoom: HISTORIC_2003_ZOOM, duration: 700 });
  }, [basemap, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (Object.keys(layers) as LayerKey[]).forEach((key) => {
      const layerId = RASTER_LAYERS[key];
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", layers[key] ? "visible" : "none");
        map.setPaintProperty(layerId, "raster-opacity", opacity[key]);
      }
    });
    if (map.getLayer(VECTOR_LAYERS.rsBoundaryFill)) map.setLayoutProperty(VECTOR_LAYERS.rsBoundaryFill, "visibility", showRsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.rsBoundaryLine)) map.setLayoutProperty(VECTOR_LAYERS.rsBoundaryLine, "visibility", showRsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.msBoundaryFill)) map.setLayoutProperty(VECTOR_LAYERS.msBoundaryFill, "visibility", showMsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.msBoundaryLine)) map.setLayoutProperty(VECTOR_LAYERS.msBoundaryLine, "visibility", showMsBoundary ? "visible" : "none");
  }, [layers, opacity, showRsBoundary, showMsBoundary, mapReady]);

  const searchPlots = useCallback(async () => {
    const raw = plotNo.trim();
    if (!raw) return notify("দাগ নম্বর লিখুন");
    const numeric = Number(raw);
    if (!Number.isInteger(numeric) || numeric < 0) return notify("দাগ নম্বর সঠিক নয়");
    setSearching(true);
    try {
      const params = new URLSearchParams({ action: "plots", plot_no: String(numeric), kind: "all", limit: "50" });
      const response = await fetchWithTimeout(`/api/rajuk/query?${params.toString()}`);
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "দাগ খোঁজা যায়নি");
      const data = (await response.json()) as { features?: RajukPlotFeature[] };
      const found = Array.isArray(data.features) ? data.features : [];
      setResults(found);
      setSelected(found[0] ?? null);
      setTab("results");
      setPanelOpen(true);
      if (found[0]) {
        const rings = found[0].geometry?.rings ?? [];
        if (rings.length) {
          const bounds = new maplibregl.LngLatBounds();
          rings.flat().forEach(([lng, lat]) => bounds.extend([lng, lat]));
          mapRef.current?.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: 700 });
        }
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "দাগ খোঁজা যায়নি");
    } finally {
      setSearching(false);
    }
  }, [notify, plotNo]);

  const goToMyLocation = useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) return notify("এই ডিভাইসে অবস্থান সেবা পাওয়া যাচ্ছে না");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const point: GeoJSON.Feature<GeoJSON.Point> = { type: "Feature", geometry: { type: "Point", coordinates: [longitude, latitude] }, properties: {} };
        const circle = createAccuracyPolygon(latitude, longitude, accuracy);
        updateSourceData(mapRef.current!, VECTOR_SOURCES.location, { type: "FeatureCollection", features: [point] } as FeatureCollection<Geometry>);
        updateSourceData(mapRef.current!, VECTOR_SOURCES.accuracy, circle);
        mapRef.current!.flyTo({ center: [longitude, latitude], zoom: Math.max(mapRef.current!.getZoom(), 17), duration: 800 });
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation failed:", error);
        setLocating(false);
        notify(error.message || "অবস্থান নির্ণয় করা যায়নি");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, [notify]);

  const validateAndRoute = useCallback(async (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => {
    setRoutingCalculator(calculator);
    try {
      const response = await fetchWithTimeout("/api/rajuk/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adapt-for-khatiyan", feature, shapeAreaUnit: "square-feet" }),
      });
      const data = (await response.json().catch(() => null)) as { plot?: Parameters<typeof sendPlotToKhatiyan>[0]; provenance?: unknown; error?: string } | null;
      if (!response.ok || !data?.plot) throw new Error(data?.error || "RAJUK প্লট যাচাই ব্যর্থ হয়েছে");
      if (calculator === "khatiyan") sendPlotToKhatiyan(data.plot);
      else sendPlotToFaraez(data.plot);
      router.push(calculator === "khatiyan" ? "/khatiyan" : "/faraez");
    } catch (error) {
      notify(error instanceof Error ? error.message : "প্লট যাচাই ব্যর্থ হয়েছে");
    } finally {
      setRoutingCalculator(null);
    }
  }, [notify, router]);

  const selectResult = useCallback((feature: RajukPlotFeature) => {
    setSelected(feature);
    const map = mapRef.current;
    if (map) {
      updateSourceData(map, VECTOR_SOURCES.selectedPlot, featuresToFc([feature]) as FeatureCollection<Geometry>);
      const rings = feature.geometry?.rings ?? [];
      if (rings.length) {
        const bounds = new maplibregl.LngLatBounds();
        rings.flat().forEach(([lng, lat]) => bounds.extend([lng, lat]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 600 });
      }
    }
  }, []);

  const activeDetails = selected ? (isMsFeature(selected) ? detailRows(selected, "ms") : detailRows(selected, "rs")) : [];

  if (initError) {
    return <div className="grid h-full min-h-screen place-items-center bg-background p-6 text-center"><div><p className="font-bold text-destructive">মানচিত্র চালু করা যায়নি</p><p className="mt-2 text-sm text-muted-foreground">{initError}</p><button className="mt-4 rounded-lg border px-4 py-2" onClick={() => window.location.reload()}>পুনরায় চেষ্টা</button></div></div>;
  }

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden bg-background">
      <div ref={containerRef} className="absolute inset-0" aria-label="ভূমি তথ্য মানচিত্র" />

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

      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow backdrop-blur">
        <span className={`h-2 w-2 rounded-full ${mapReady ? "bg-green-500" : "bg-amber-500"}`} />
        {mapReady ? (vectorStatus || "MapLibre WebGL") : "মানচিত্র প্রস্তুত হচ্ছে…"}
      </div>

      {basemap === "satellite2003" && (
        <a href={GOOGLE_EARTH_2003_URL} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 z-20 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow backdrop-blur hover:bg-muted">২০০৩ ঐতিহাসিক উৎস ↗</a>
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
      {!isAdvanced && publicResultsOpen && results.length > 0 && !panelOpen && <button onClick={() => { setPanelOpen(true); setTab("results"); }} className="absolute bottom-16 right-4 z-20 rounded-xl border border-border bg-background/95 px-4 py-3 text-sm font-bold shadow-lg">ফলাফল দেখুন ({results.length})</button>}
    </div>
  );
}

function createAccuracyPolygon(latitude: number, longitude: number, radiusMeters: number): FeatureCollection<Polygon> {
  const points: number[][] = [];
  const earthRadius = 6378137;
  const radius = Math.max(1, radiusMeters);
  const latRadius = (radius / earthRadius) * (180 / Math.PI);
  const lonRadius = latRadius / Math.cos((latitude * Math.PI) / 180);
  for (let i = 0; i <= 48; i += 1) {
    const angle = (i / 48) * Math.PI * 2;
    points.push([longitude + Math.cos(angle) * lonRadius, latitude + Math.sin(angle) * latRadius]);
  }
  return { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [points] }, properties: {} }] };
}

export function updateSourceData(map: MapLibreInstance, sourceId: string, data: FeatureCollection<Geometry>): boolean {
  const source = map.getSource(sourceId);
  if (!source || source.type !== "geojson") return false;
  (source as GeoJSONSource).setData(data);
  return true;
}
