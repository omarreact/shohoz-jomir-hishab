"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Layers3,
  Map as MapIcon,
  PanelRight,
  Search,
  LocateFixed,
  MousePointer2,
  Database,
  X,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { Map as LeafletMap, TileLayer, GeoJSON as LeafletGeoJSON, Circle, CircleMarker } from "leaflet";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import styles from "./GeospatialMap.module.css";

type Tab = "layers" | "basemap" | "results";
type BasemapKey = "osm" | "light" | "satellite" | "satellite2003";
type LayerKey = "dap" | "rs" | "ms" | "flood" | "boundary" | "transport";
type LayerDef = {
  key: LayerKey;
  label: string;
  description: string;
  color: string;
  /** Default for authenticated Present View */
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

/** Public visitor: only RS + MS MapServer tiles at full opacity */
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

const ADVANCED_LAYER_VISIBILITY = Object.fromEntries(
  LAYERS.map((l) => [l.key, l.defaultVisible]),
) as Record<LayerKey, boolean>;

const ADVANCED_LAYER_OPACITY = Object.fromEntries(
  LAYERS.map((l) => [l.key, l.key === "ms" ? 0.72 : 0.78]),
) as Record<LayerKey, number>;

const DAP_BOUNDS: [[number, number], [number, number]] = [
  [23.5527, 90.2079],
  [24.1033, 90.6041],
];

const HISTORIC_2003_CENTER: [number, number] = [23.82810618, 90.48911986];
const HISTORIC_2003_ZOOM = 11;
const GOOGLE_EARTH_2003_URL =
  "https://earth.google.com/web/@23.82810618,90.48911986,3.60010157a,3337.57801622d,35y,-0h,0t,0r/data=ChYqEAgBEgoyMDAzLTAxLTE3GAFCAggBOgMKATBCAggASg0I____________ARAA?authuser=0";

const MIN_ZOOM_FOR_VECTOR = 15;
const EMPTY_FC = { type: "FeatureCollection" as const, features: [] as never[] };

type BasemapDef = {
  label: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  maxNativeZoom?: number;
  subdomains?: string;
};

const BASEMAPS: Record<BasemapKey, BasemapDef> = {
  osm: {
    label: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 21,
  },
  light: {
    label: "Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap © CARTO",
    maxZoom: 21,
  },
  satellite: {
    label: "স্যাটেলাইট",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri",
    maxZoom: 21,
  },
  satellite2003: {
    label: "স্যাটেলাইট ২০০৩",
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2003-01-17/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    attribution: "© NASA GIBS / MODIS Terra · 2003-01-17",
    maxZoom: 18,
    maxNativeZoom: 9,
  },
};

/** Basemaps available without login */
const PUBLIC_BASEMAP_KEYS: BasemapKey[] = ["osm", "satellite"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletNS = any;

async function loadLeaflet(): Promise<LeafletNS> {
  const mod = await import("leaflet");
  const L = (mod as { default?: LeafletNS }).default ?? mod;
  if (!L || typeof L.map !== "function") {
    throw new Error("Leaflet failed to load (no L.map)");
  }
  return L;
}

function present(v: unknown) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("en-US")
      : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return String(value);
}

function isMsFeature(f: RajukPlotFeature): boolean {
  const a = f.attributes as Record<string, unknown>;
  return a._layer_source === "ms" || a.plot_kind === "ms" || present(a.ms_plot_no);
}

function isRsFeature(f: RajukPlotFeature): boolean {
  const a = f.attributes as Record<string, unknown>;
  return a._layer_source === "rs" || a.plot_kind === "rs" || (present(a.rs_plot_no) && !present(a.ms_plot_no));
}

function rsNumber(f: RajukPlotFeature): string {
  const a = f.attributes as Record<string, unknown>;
  if (present(a.rs_plot_no)) return String(a.rs_plot_no);
  if (isRsFeature(f) && present(a.plot_no)) return `RS-${a.plot_no}`;
  return "—";
}

function msNumber(f: RajukPlotFeature): string {
  const a = f.attributes as Record<string, unknown>;
  if (present(a.ms_plot_no)) return String(a.ms_plot_no);
  if (isMsFeature(f) && present(a.plot_no)) return `MS-${a.plot_no}`;
  return "—";
}

function detailRows(f: RajukPlotFeature, kind: "rs" | "ms") {
  const a = f.attributes as Record<string, unknown>;
  if (kind === "ms") {
    return [
      ["MS Plot Number", msNumber(f)],
      ["Plot No", formatValue(a.plot_no)],
      ["JL No", formatValue(a.jl_no ?? a.rs_jl_no)],
      ["Area (katha)", formatValue(a.ms_plot_area ?? a.area_katha)],
      ["Mauza", formatValue(a.mauza ?? a.rs_mauza_name)],
      ["Thana/Upazila", formatValue(a.thana_upazila ?? a.upazila_ps)],
      ["District", formatValue(a.m_district ?? a.district)],
      ["Address", formatValue(a.address_search)],
    ] as const;
  }
  return [
    ["RS Plot Number", rsNumber(f)],
    ["Plot No", formatValue(a.plot_no)],
    ["JL No", formatValue(a.rs_jl_no ?? a.jl_no)],
    ["Area (katha)", formatValue(a.rs_plot_area ?? a.area_katha)],
    ["Mauza", formatValue(a.rs_mauza_name ?? a.mauza)],
    ["Thana/Upazila", formatValue(a.thana_upazila ?? a.upazila_ps)],
    ["District", formatValue(a.m_district ?? a.district)],
    ["Address", formatValue(a.address_search)],
  ] as const;
}

function basemapIcon(key: BasemapKey): string {
  if (key === "satellite" || key === "satellite2003") return "◈";
  if (key === "light") return "□";
  return "⊕";
}

function hasRings(f: RajukPlotFeature): boolean {
  const rings = f?.geometry?.rings;
  return Array.isArray(rings) && rings.length > 0;
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

function featuresToFc(features: RajukPlotFeature[]) {
  const list = Array.isArray(features) ? features : [];
  return {
    type: "FeatureCollection" as const,
    features: list.map(toGeoJson).filter(Boolean),
  };
}

function createBasemapLayer(L: LeafletNS, key: BasemapKey): TileLayer {
  const def = BASEMAPS[key];
  if (!def?.url) throw new Error(`Unknown basemap: ${key}`);
  const opts: Record<string, unknown> = {
    attribution: def.attribution,
    maxZoom: def.maxZoom ?? 21,
    crossOrigin: true,
    errorTileUrl:
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  };
  if (def.maxNativeZoom != null) opts.maxNativeZoom = def.maxNativeZoom;
  if (def.subdomains) opts.subdomains = def.subdomains;
  return L.tileLayer(def.url, opts);
}

export default function GeospatialMap() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  /** Full Present View only when authenticated */
  const isAdvanced = isLoggedIn;

  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const basemapRef = useRef<TileLayer | null>(null);
  const layerRefs = useRef<Partial<Record<LayerKey, TileLayer>>>({});
  const highlightRef = useRef<LeafletGeoJSON | null>(null);
  const rsVectorRef = useRef<LeafletGeoJSON | null>(null);
  const msVectorRef = useRef<LeafletGeoJSON | null>(null);
  const extentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const identifyModeRef = useRef(true);
  const locationMarkerRef = useRef<CircleMarker | null>(null);
  const accuracyCircleRef = useRef<Circle | null>(null);
  const loadExtentRef = useRef<() => void>(() => undefined);
  const isAdvancedRef = useRef(false);

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

  identifyModeRef.current = identifyMode;
  isAdvancedRef.current = isAdvanced;

  const rsResults = useMemo(() => results.filter(isRsFeature), [results]);
  const msResults = useMemo(() => results.filter(isMsFeature), [results]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4000);
  }, []);

  /** Switch public ↔ advanced defaults when auth settles (no fake login). */
  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn) {
      setLayers({ ...ADVANCED_LAYER_VISIBILITY });
      setOpacity({ ...ADVANCED_LAYER_OPACITY });
      setShowRsBoundary(true);
      setShowMsBoundary(true);
      setPanelOpen(true);
      setBasemap((b) => (b === "osm" ? "satellite" : b));
    } else {
      setLayers({ ...PUBLIC_LAYER_VISIBILITY });
      setOpacity({ ...PUBLIC_LAYER_OPACITY });
      setShowRsBoundary(false);
      setShowMsBoundary(false);
      setPanelOpen(false);
      setBasemap((b) => (PUBLIC_BASEMAP_KEYS.includes(b) ? b : "osm"));
    }
  }, [isLoggedIn, authLoading]);

  const selectBasemap = useCallback(
    (key: BasemapKey) => {
      if (!isAdvancedRef.current && !PUBLIC_BASEMAP_KEYS.includes(key)) return;
      setBasemap(key);
      if (key === "satellite2003") {
        const map = mapRef.current;
        if (map) map.setView(HISTORIC_2003_CENTER, HISTORIC_2003_ZOOM, { animate: true });
        notify("স্যাটেলাইট ২০০৩ · NASA MODIS Terra (2003-01-17)");
      }
    },
    [notify],
  );

  const paintHighlight = useCallback((features: RajukPlotFeature[]) => {
    const map = mapRef.current;
    const highlight = highlightRef.current;
    if (!map || !highlight) return;
    try {
      highlight.clearLayers();
      const withGeom = (Array.isArray(features) ? features : []).filter(hasRings);
      if (!withGeom.length) return;
      highlight.addData(featuresToFc(withGeom) as never);
      try {
        (highlight as unknown as { bringToFront: () => void }).bringToFront();
      } catch {
        /* ignore */
      }
      const bounds = highlight.getBounds();
      if (bounds?.isValid?.()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
    } catch {
      /* ignore */
    }
  }, []);

  const loadExtentVectors = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !rsVectorRef.current || !msVectorRef.current) return;
    // Public mode: no FeatureServer boundary overlays (tiles + identify only)
    if (!isAdvancedRef.current) {
      rsVectorRef.current.clearLayers();
      msVectorRef.current.clearLayers();
      setVectorStatus("");
      return;
    }
    if (map.getZoom() < MIN_ZOOM_FOR_VECTOR) {
      rsVectorRef.current.clearLayers();
      msVectorRef.current.clearLayers();
      setVectorStatus(`Zoom ≥ ${MIN_ZOOM_FOR_VECTOR} for FeatureServer boundaries`);
      return;
    }
    if (!showRsBoundary && !showMsBoundary) {
      rsVectorRef.current.clearLayers();
      msVectorRef.current.clearLayers();
      setVectorStatus("");
      return;
    }

    const b = map.getBounds();
    const kind = showRsBoundary && showMsBoundary ? "all" : showRsBoundary ? "rs" : "ms";
    setVectorStatus("Loading plot boundaries…");
    try {
      const q = new URLSearchParams({
        action: "extent",
        kind,
        xmin: String(b.getWest()),
        ymin: String(b.getSouth()),
        xmax: String(b.getEast()),
        ymax: String(b.getNorth()),
        limit: "500",
      });
      const response = await fetch(`/api/rajuk/query?${q}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Extent query failed");
      const features = (Array.isArray(data.features) ? data.features : []) as RajukPlotFeature[];
      const rs = features.filter(isRsFeature);
      const ms = features.filter(isMsFeature);
      rsVectorRef.current.clearLayers();
      msVectorRef.current.clearLayers();
      if (showRsBoundary) rsVectorRef.current.addData(featuresToFc(rs) as never);
      if (showMsBoundary) msVectorRef.current.addData(featuresToFc(ms) as never);
      setVectorStatus(`FS boundaries: ${rs.length} RS · ${ms.length} MS`);
    } catch (error) {
      setVectorStatus(error instanceof Error ? error.message : "Boundary load failed");
    }
  }, [showRsBoundary, showMsBoundary]);

  loadExtentRef.current = () => {
    void loadExtentVectors();
  };

  useEffect(() => {
    let disposed = false;
    const init = async () => {
      if (!mapElement.current || mapRef.current) return;
      try {
        const L = await loadLeaflet();
        try {
          await import("leaflet/dist/leaflet.css");
        } catch {
          /* optional */
        }
        if (disposed || !mapElement.current) return;

        const el = mapElement.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((el as any)._leaflet_id) {
          el.innerHTML = "";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (el as any)._leaflet_id;
        }

        const map = L.map(el, {
          zoomControl: true,
          preferCanvas: false,
          minZoom: 8,
          maxZoom: 21,
        });
        map.fitBounds(DAP_BOUNDS, { padding: [25, 25] });
        mapRef.current = map;

        // Public default basemap: OpenStreetMap
        const base = createBasemapLayer(L, "osm").addTo(map);
        try {
          base.bringToBack();
        } catch {
          /* ignore */
        }
        basemapRef.current = base;

        // Create all MapServer tile layers; only RS+MS start on the map (public)
        LAYERS.forEach((definition) => {
          const tile = L.tileLayer(`/api/rajuk/tile/${definition.key}/{z}/{y}/{x}`, {
            maxZoom: 21,
            opacity: PUBLIC_LAYER_OPACITY[definition.key],
            crossOrigin: true,
            attribution: "LandBD / RAJUK",
            errorTileUrl:
              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          });
          layerRefs.current[definition.key] = tile;
          if (PUBLIC_LAYER_VISIBILITY[definition.key]) tile.addTo(map);
        });

        const rsVector = L.geoJSON(EMPTY_FC, {
          style: { color: "#2563eb", weight: 1.5, fillColor: "#3b82f6", fillOpacity: 0.08 },
          onEachFeature: (feature: { properties?: Record<string, unknown> }, layer: { bindPopup: (h: string) => void }) => {
            const p = feature.properties || {};
            const label = present(p.rs_plot_no)
              ? String(p.rs_plot_no)
              : present(p.plot_no)
                ? `RS-${p.plot_no}`
                : "RS";
            layer.bindPopup(`<strong>${label}</strong><br/>${p.address_search || ""}`);
          },
        }).addTo(map);

        const msVector = L.geoJSON(EMPTY_FC, {
          style: { color: "#7c3aed", weight: 1.5, fillColor: "#a78bfa", fillOpacity: 0.08 },
          onEachFeature: (feature: { properties?: Record<string, unknown> }, layer: { bindPopup: (h: string) => void }) => {
            const p = feature.properties || {};
            const label = present(p.ms_plot_no)
              ? String(p.ms_plot_no)
              : present(p.plot_no)
                ? `MS-${p.plot_no}`
                : "MS";
            layer.bindPopup(`<strong>${label}</strong><br/>${p.address_search || ""}`);
          },
        }).addTo(map);

        rsVectorRef.current = rsVector;
        msVectorRef.current = msVector;

        const highlight = L.geoJSON(EMPTY_FC, {
          style: (feat: { properties?: Record<string, unknown> } | undefined) => {
            const p = feat?.properties || {};
            const ms = p._layer_source === "ms" || p.plot_kind === "ms" || present(p.ms_plot_no);
            return ms
              ? { color: "#6d28d9", weight: 3, fillColor: "#a78bfa", fillOpacity: 0.3 }
              : { color: "#1d4ed8", weight: 3, fillColor: "#93c5fd", fillOpacity: 0.3 };
          },
        }).addTo(map);
        highlightRef.current = highlight;

        const scheduleExtent = () => {
          if (extentTimer.current) clearTimeout(extentTimer.current);
          extentTimer.current = setTimeout(() => loadExtentRef.current(), 400);
        };
        map.on("moveend", scheduleExtent);
        map.on("zoomend", scheduleExtent);

        // Plot click → identify RS (FS/0) + MS (FS/5) — available to everyone
        map.on("click", async (event: { latlng: { lat: number; lng: number } }) => {
          if (!identifyModeRef.current) return;
          setSearching(true);
          try {
            const response = await fetch(
              `/api/rajuk/query?action=identify&lat=${encodeURIComponent(event.latlng.lat)}&lng=${encodeURIComponent(event.latlng.lng)}`,
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Identify failed");
            const features = (Array.isArray(data.features) ? data.features : []) as RajukPlotFeature[];
            setResults(features);
            setPublicResultsOpen(true);
            setTab("results");
            if (isAdvancedRef.current) setPanelOpen(true);
            if (features.length) {
              setSelected(features[0]);
              paintHighlight(features);
              const rsN = features.filter(isRsFeature).length;
              const msN = features.filter(isMsFeature).length;
              notify(`ফলাফল — ${rsN} RS · ${msN} MS`);
            } else {
              highlight.clearLayers();
              notify("এই অবস্থানে কোনো RS/MS প্লট পাওয়া যায়নি");
            }
          } catch (error) {
            notify(error instanceof Error ? error.message : "Identify ব্যর্থ হয়েছে");
          } finally {
            setSearching(false);
          }
        });

        requestAnimationFrame(() => {
          try {
            map.invalidateSize();
          } catch {
            /* ignore */
          }
          scheduleExtent();
        });
        window.setTimeout(() => {
          try {
            map.invalidateSize();
          } catch {
            /* ignore */
          }
        }, 250);

        if (!disposed) {
          setInitError(null);
          setMapReady(true);
        }
      } catch (error) {
        if (!disposed) {
          setInitError(error instanceof Error ? error.message : "ম্যাপ লোড ব্যর্থ হয়েছে");
        }
      }
    };
    void init();
    return () => {
      disposed = true;
      if (extentTimer.current) clearTimeout(extentTimer.current);
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapReady) void loadExtentVectors();
  }, [loadExtentVectors, mapReady, isAdvanced]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let cancelled = false;
    void loadLeaflet().then((Leaflet) => {
      if (cancelled || !mapRef.current) return;
      try {
        const prev = basemapRef.current;
        if (prev) map.removeLayer(prev);
        const next = createBasemapLayer(Leaflet, basemap).addTo(map);
        try {
          next.bringToBack();
        } catch {
          /* ignore */
        }
        basemapRef.current = next;
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [basemap, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    LAYERS.forEach(({ key }) => {
      const layer = layerRefs.current[key];
      if (!layer) return;
      layer.setOpacity(opacity[key] ?? 1);
      const want = !!layers[key];
      if (want && !map.hasLayer(layer)) layer.addTo(map);
      if (!want && map.hasLayer(layer)) map.removeLayer(layer);
    });
  }, [layers, opacity, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !rsVectorRef.current || !msVectorRef.current) return;
    if (showRsBoundary && !map.hasLayer(rsVectorRef.current)) rsVectorRef.current.addTo(map);
    if (!showRsBoundary && map.hasLayer(rsVectorRef.current)) map.removeLayer(rsVectorRef.current);
    if (showMsBoundary && !map.hasLayer(msVectorRef.current)) msVectorRef.current.addTo(map);
    if (!showMsBoundary && map.hasLayer(msVectorRef.current)) map.removeLayer(msVectorRef.current);
  }, [showMsBoundary, showRsBoundary, mapReady]);

  const runSearch = async () => {
    const value = Number(plotNo);
    if (!Number.isInteger(value) || value < 0) {
      notify("একটি বৈধ প্লট / দাগ নম্বর দিন");
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/rajuk/query?action=plots&plot_no=${encodeURIComponent(value)}&limit=50`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Plot search failed");
      const features = (Array.isArray(data.features) ? data.features : []) as RajukPlotFeature[];
      setResults(features);
      setTab("results");
      setPanelOpen(true);
      setPublicResultsOpen(true);
      if (!features.length) {
        notify("কোনো RS/MS প্লট পাওয়া যায়নি");
        return;
      }
      setSelected(features[0]);
      paintHighlight(features);
      notify(`ফলাফল — ${features.filter(isRsFeature).length} RS · ${features.filter(isMsFeature).length} MS`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "প্লট সার্চ ব্যর্থ হয়েছে");
    } finally {
      setSearching(false);
    }
  };

  const selectFeature = (feature: RajukPlotFeature) => {
    setSelected(feature);
    paintHighlight([feature]);
  };

  const resetMap = () => {
    mapRef.current?.fitBounds(DAP_BOUNDS, { padding: [25, 25] });
    highlightRef.current?.clearLayers();
    setSelected(null);
    setResults([]);
  };

  const clearLocationLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (locationMarkerRef.current) {
      map.removeLayer(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }
  }, []);

  const goToMyLocation = useCallback(() => {
    if (!mapRef.current) {
      notify("ম্যাপ এখনো প্রস্তুত নয়");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      notify("এই ডিভাইসে লোকেশন সাপোর্ট নেই");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const map = mapRef.current;
        if (!map) {
          setLocating(false);
          return;
        }
        try {
          const L = await loadLeaflet();
          clearLocationLayers();
          map.setView([latitude, longitude], Math.max(map.getZoom(), 17), { animate: true });
          const marker = L.circleMarker([latitude, longitude], {
            radius: 9,
            color: "#006a4e",
            weight: 3,
            fillColor: "#22c55e",
            fillOpacity: 0.9,
          }).addTo(map);
          marker.bindPopup(`<strong>আপনার অবস্থান</strong><br/>±${Math.round(accuracy || 0)} মিটার`).openPopup();
          locationMarkerRef.current = marker;
          const circle = L.circle([latitude, longitude], {
            radius: Math.max(accuracy || 30, 15),
            color: "#006a4e",
            weight: 1,
            fillColor: "#22c55e",
            fillOpacity: 0.12,
          }).addTo(map);
          accuracyCircleRef.current = circle;
          notify("আপনার বর্তমান অবস্থানে নিয়ে যাওয়া হয়েছে");
        } catch {
          notify("লোকেশন মার্কার সেট করতে ব্যর্থ");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) notify("লোকেশন অনুমতি দিন (browser permission)");
        else if (err.code === 2) notify("লোকেশন পাওয়া যায়নি");
        else notify("লোকেশন টাইমআউট — আবার চেষ্টা করুন");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }, [notify, clearLocationLayers]);

  function PlotCard({
    feature,
    kind,
  }: {
    feature: RajukPlotFeature;
    kind: "rs" | "ms";
  }) {
    const active =
      selected &&
      Number(selected.attributes.objectid) === Number(feature.attributes.objectid) &&
      (selected.attributes as { _layer_source?: string })._layer_source ===
        (feature.attributes as { _layer_source?: string })._layer_source;
    const title = kind === "ms" ? msNumber(feature) : rsNumber(feature);
    return (
      <button
        type="button"
        className={styles.resultCard}
        style={{
          textAlign: "left",
          borderColor: active ? (kind === "ms" ? "#7c3aed" : "#2563eb") : undefined,
          boxShadow: active ? "0 0 0 1px currentColor" : undefined,
        }}
        onClick={() => selectFeature(feature)}
      >
        <div className={styles.resultTitle}>
          <span
            style={{
              display: "inline-block",
              marginRight: 6,
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              background: kind === "ms" ? "#7c3aed" : "#2563eb",
            }}
          >
            {kind.toUpperCase()}
          </span>
          {title}
        </div>
        <div className={styles.resultMeta} style={{ marginTop: 6 }}>
          {detailRows(feature, kind).map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 11,
                padding: "3px 0",
                borderTop: "1px solid rgba(148,163,184,.2)",
              }}
            >
              <span style={{ opacity: 0.75 }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </button>
    );
  }

  function ResultsBody() {
    return (
      <>
        {!results.length && (
          <div className={styles.empty}>ম্যাপে ক্লিক করুন — RS (FS/0) ও MS (FS/5) ফলাফল দেখাবে।</div>
        )}
        {results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" }}>
            <div className={styles.publicResultsSection}>
              <div className={styles.publicResultsSectionTitle} style={{ color: "#2563eb" }}>
                RS (FS/0)
              </div>
              {rsResults.length ? (
                rsResults.map((f) => (
                  <PlotCard key={`rs-${f.attributes.objectid}-${f.attributes.p_guid}`} feature={f} kind="rs" />
                ))
              ) : (
                <div className={styles.empty} style={{ fontSize: 12 }}>
                  এই অবস্থানে RS নেই
                </div>
              )}
            </div>
            <div className={styles.publicResultsSection}>
              <div className={styles.publicResultsSectionTitle} style={{ color: "#7c3aed" }}>
                MS (FS/5)
              </div>
              {msResults.length ? (
                msResults.map((f) => (
                  <PlotCard key={`ms-${f.attributes.objectid}-${f.attributes.p_guid}`} feature={f} kind="ms" />
                ))
              ) : (
                <div className={styles.empty} style={{ fontSize: 12 }}>
                  এই অবস্থানে MS নেই
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  if (initError) {
    return (
      <div className={styles.mapShell} style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>ম্যাপ লোড হয়নি</p>
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>{initError}</p>
          <button type="button" className={styles.searchButton} onClick={() => window.location.reload()}>
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.mapShell} aria-label="নগর পরিকল্পনা মানচিত্র">
      <div ref={mapElement} className={styles.mapCanvas} />

      {/* —— PUBLIC: compact basemap (OSM | Satellite) —— */}
      {!isAdvanced && (
        <div className={styles.publicBasemap} role="group" aria-label="বেসম্যাপ">
          <span className={styles.publicBasemapLabel}>বেসম্যাপ</span>
          {PUBLIC_BASEMAP_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`${styles.publicBasemapBtn} ${basemap === key ? styles.publicBasemapBtnActive : ""}`}
              onClick={() => selectBasemap(key)}
            >
              {BASEMAPS[key].label}
            </button>
          ))}
        </div>
      )}

      {/* PUBLIC locate */}
      {!isAdvanced && (
        <button
          type="button"
          className={`${styles.locateButton} ${styles.publicLocate} ${locating ? styles.locateButtonActive : ""}`}
          onClick={goToMyLocation}
          disabled={locating || !mapReady}
          title="বর্তমান অবস্থান"
          aria-label="বর্তমান অবস্থানে যান"
        >
          {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
        </button>
      )}

      {/* PUBLIC floating results */}
      {!isAdvanced && results.length > 0 && publicResultsOpen && (
        <div className={styles.publicResults} role="dialog" aria-label="প্লট ফলাফল">
          <div className={styles.publicResultsHeader}>
            <div>
              <div className={styles.publicResultsTitle}>ফলাফল</div>
              <div className={styles.publicResultsSub}>
                {rsResults.length} RS · {msResults.length} MS
              </div>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setPublicResultsOpen(false)}
              aria-label="ফলাফল বন্ধ"
            >
              <X size={16} />
            </button>
          </div>
          <div className={styles.publicResultsBody}>
            <ResultsBody />
          </div>
        </div>
      )}

      {!isAdvanced && !results.length && (
        <div className={styles.publicHint}>
          <strong>RS + MS মৌজা মানচিত্র</strong>
          <br />
          বেসম্যাপ বদলান · প্লটে ক্লিক করে ফলাফল দেখুন
        </div>
      )}

      {/* —— AUTHENTICATED Present View —— */}
      {isAdvanced && (
        <>
          <form
            className={styles.topSearch}
            onSubmit={(event) => {
              event.preventDefault();
              void runSearch();
            }}
          >
            <Search size={16} aria-hidden="true" />
            <input
              className={styles.searchInput}
              value={plotNo}
              onChange={(e) => setPlotNo(e.target.value.replace(/\D/g, ""))}
              placeholder="প্লট নম্বর (RS + MS)…"
              inputMode="numeric"
              aria-label="প্লট নম্বর"
            />
            <button className={styles.searchButton} type="submit" disabled={searching}>
              <Search size={15} />
              <span>{searching ? "খুঁজছি" : "খুঁজুন"}</span>
            </button>
          </form>

          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobilePanelButton}`}
            onClick={() => setPanelOpen((v) => !v)}
            aria-label={panelOpen ? "প্যানেল বন্ধ" : "প্যানেল খুলুন"}
          >
            <PanelRight size={17} />
          </button>

          <button
            type="button"
            className={`${styles.locateButton} ${locating ? styles.locateButtonActive : ""}`}
            onClick={goToMyLocation}
            disabled={locating || !mapReady}
            title="বর্তমান অবস্থান"
          >
            {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
          </button>

          {identifyMode && (
            <div className={styles.identifyBanner}>
              <MousePointer2 size={15} /> ম্যাপে ক্লিক করুন — RS ও MS একসাথে দেখাবে{" "}
              <button type="button" className={styles.iconButton} onClick={() => setIdentifyMode(false)} aria-label="Identify বন্ধ">
                <X size={14} />
              </button>
            </div>
          )}

          <aside className={`${styles.panel} ${!panelOpen ? styles.panelHidden : ""}`}>
            <div className={styles.tabs} role="tablist">
              <button type="button" className={`${styles.tab} ${tab === "layers" ? styles.tabActive : ""}`} onClick={() => setTab("layers")}>
                <Layers3 size={14} /> লেয়ার
              </button>
              <button type="button" className={`${styles.tab} ${tab === "basemap" ? styles.tabActive : ""}`} onClick={() => setTab("basemap")}>
                <MapIcon size={14} /> বেসম্যাপ
              </button>
              <button type="button" className={`${styles.tab} ${tab === "results" ? styles.tabActive : ""}`} onClick={() => setTab("results")}>
                <Database size={14} /> ফলাফল
              </button>
            </div>
            <div className={styles.panelBody}>
              {tab === "layers" && (
                <>
                  <div className={styles.sectionTitle}>MapServer tiles</div>
                  {LAYERS.map((layer) => (
                    <div className={styles.layerCard} key={layer.key}>
                      <div className={styles.layerRow}>
                        <span className={styles.layerSwatch} style={{ background: layer.color }} />
                        <div className={styles.layerInfo}>
                          <div className={styles.layerName}>{layer.label}</div>
                          <div className={styles.layerMeta}>{layer.description}</div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={layers[layer.key]}
                            onChange={(e) => setLayers((c) => ({ ...c, [layer.key]: e.target.checked }))}
                          />
                          <span className={styles.toggleTrack} />
                        </label>
                      </div>
                      <div className={styles.opacityRow}>
                        <span>অপাসিটি</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step=".05"
                          value={opacity[layer.key]}
                          onChange={(e) => setOpacity((c) => ({ ...c, [layer.key]: Number(e.target.value) }))}
                        />
                        <span>{Math.round(opacity[layer.key] * 100)}%</span>
                      </div>
                    </div>
                  ))}
                  <div className={styles.sectionTitle} style={{ marginTop: 16 }}>
                    FeatureServer boundaries
                  </div>
                  <div className={styles.layerCard}>
                    <div className={styles.layerRow}>
                      <span className={styles.layerSwatch} style={{ background: "#2563eb" }} />
                      <div className={styles.layerInfo}>
                        <div className={styles.layerName}>RS polygons (FS/0)</div>
                      </div>
                      <label className={styles.toggle}>
                        <input type="checkbox" checked={showRsBoundary} onChange={(e) => setShowRsBoundary(e.target.checked)} />
                        <span className={styles.toggleTrack} />
                      </label>
                    </div>
                  </div>
                  <div className={styles.layerCard}>
                    <div className={styles.layerRow}>
                      <span className={styles.layerSwatch} style={{ background: "#7c3aed" }} />
                      <div className={styles.layerInfo}>
                        <div className={styles.layerName}>MS polygons (FS/5)</div>
                      </div>
                      <label className={styles.toggle}>
                        <input type="checkbox" checked={showMsBoundary} onChange={(e) => setShowMsBoundary(e.target.checked)} />
                        <span className={styles.toggleTrack} />
                      </label>
                    </div>
                  </div>
                  {vectorStatus && <p style={{ margin: "8px 0 0", fontSize: 11, opacity: 0.7 }}>{vectorStatus}</p>}
                </>
              )}

              {tab === "basemap" && (
                <>
                  <div className={styles.sectionTitle}>বেসম্যাপ</div>
                  <div className={styles.basemapGrid}>
                    {(Object.entries(BASEMAPS) as [BasemapKey, (typeof BASEMAPS)[BasemapKey]][]).map(([key, value]) => (
                      <button
                        type="button"
                        key={key}
                        className={`${styles.baseButton} ${basemap === key ? styles.baseActive : ""}`}
                        onClick={() => selectBasemap(key)}
                      >
                        <span className={styles.baseIcon}>{basemapIcon(key)}</span>
                        {value.label}
                      </button>
                    ))}
                  </div>
                  {basemap === "satellite2003" && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        borderRadius: 8,
                        fontSize: 11,
                        lineHeight: 1.45,
                        background: "rgba(15,23,42,.06)",
                        border: "1px solid rgba(148,163,184,.35)",
                      }}
                    >
                      <strong>NASA MODIS Terra · ১৭ জানুয়ারি ২০০৩</strong>
                      <br />
                      <a href={GOOGLE_EARTH_2003_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, color: "#2563eb", fontWeight: 600 }}>
                        <ExternalLink size={12} /> Google Earth ২০০৩
                      </a>
                    </div>
                  )}
                  <div className={styles.sectionTitle}>ইন্টার‌্যাকশন</div>
                  <button
                    type="button"
                    className={`${styles.baseButton} ${identifyMode ? styles.baseActive : ""}`}
                    onClick={() => setIdentifyMode((v) => !v)}
                  >
                    <MousePointer2 size={17} />
                    <br />
                    {identifyMode ? "Identify চালু" : "Identify বন্ধ"}
                  </button>
                </>
              )}

              {tab === "results" && (
                <>
                  <div className={styles.sectionTitle}>
                    ফলাফল — {rsResults.length} RS · {msResults.length} MS
                  </div>
                  <ResultsBody />
                </>
              )}
            </div>
          </aside>

          <div className={styles.bottomBar}>
            <span>
              <strong>Present View</strong>
            </span>
            <span className={styles.separator} />
            <span>
              RS:{" "}
              <strong>
                {selected && isRsFeature(selected) ? rsNumber(selected) : rsResults[0] ? rsNumber(rsResults[0]) : "—"}
              </strong>
            </span>
            <span className={styles.separator} />
            <span>
              MS:{" "}
              <strong>
                {selected && isMsFeature(selected) ? msNumber(selected) : msResults[0] ? msNumber(msResults[0]) : "—"}
              </strong>
            </span>
            <button type="button" className={styles.iconButton} onClick={resetMap} title="রিসেট">
              <RefreshCw size={14} />
            </button>
            <button type="button" className={styles.iconButton} onClick={goToMyLocation} disabled={locating || !mapReady}>
              {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            </button>
            <button type="button" className={styles.iconButton} onClick={() => setIdentifyMode((v) => !v)}>
              <MousePointer2 size={14} />
            </button>
          </div>
        </>
      )}

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
