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
} from "lucide-react";
import type { Map as LeafletMap, TileLayer, GeoJSON as LeafletGeoJSON, Circle, CircleMarker } from "leaflet";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import styles from "./GeospatialMap.module.css";

type Tab = "layers" | "basemap" | "results";
type BasemapKey = "osm" | "light" | "satellite" | "satellite2003";
type LayerKey = "dap" | "rs" | "ms" | "flood" | "boundary" | "transport";
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

const DAP_BOUNDS: [[number, number], [number, number]] = [
  [23.5527, 90.2079],
  [24.1033, 90.6041],
];

const MIN_ZOOM_FOR_VECTOR = 15;

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
    url: "https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2003-06-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
    attribution: "© NASA GIBS / MODIS Terra 2003-06-15",
    maxZoom: 21,
    maxNativeZoom: 9,
    subdomains: "abc",
  },
};

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

function toGeoJson(feature: RajukPlotFeature) {
  return {
    type: "Feature" as const,
    geometry: { type: "Polygon" as const, coordinates: feature.geometry.rings },
    properties: feature.attributes,
  };
}

function featuresToFc(features: RajukPlotFeature[]) {
  return {
    type: "FeatureCollection" as const,
    features: features.filter((f) => f.geometry?.rings?.length).map((f) => toGeoJson(f)),
  };
}

function createBasemapLayer(Leaflet: typeof import("leaflet"), key: BasemapKey): TileLayer {
  const def = BASEMAPS[key];
  return Leaflet.tileLayer(def.url, {
    attribution: def.attribution,
    maxZoom: def.maxZoom ?? 21,
    maxNativeZoom: def.maxNativeZoom,
    subdomains: def.subdomains,
    crossOrigin: true,
    errorTileUrl:
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  });
}

function keepHighlightOnTop(highlight: LeafletGeoJSON | null) {
  try {
    if (highlight && typeof (highlight as unknown as { bringToFront?: () => void }).bringToFront === "function") {
      (highlight as unknown as { bringToFront: () => void }).bringToFront();
    }
  } catch {
    /* ignore */
  }
}

export default function GeospatialMap() {
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

  const [tab, setTab] = useState<Tab>("layers");
  const [panelOpen, setPanelOpen] = useState(true);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.key, l.defaultVisible])) as Record<LayerKey, boolean>,
  );
  const [opacity, setOpacity] = useState<Record<LayerKey, number>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.key, l.key === "ms" ? 0.72 : 0.78])) as Record<LayerKey, number>,
  );
  // MS polygons (FS/5) on by default; RS polygons (FS/0) off until toggled
  const [showRsBoundary, setShowRsBoundary] = useState(false);
  const [showMsBoundary, setShowMsBoundary] = useState(true);
  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
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

  identifyModeRef.current = identifyMode;

  const rsResults = useMemo(() => results.filter(isRsFeature), [results]);
  const msResults = useMemo(() => results.filter(isMsFeature), [results]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }, []);

  const paintHighlight = useCallback((features: RajukPlotFeature[]) => {
    const map = mapRef.current;
    const highlight = highlightRef.current;
    if (!map || !highlight) return;
    highlight.clearLayers();
    const withGeom = features.filter((f) => f.geometry?.rings?.length);
    if (!withGeom.length) return;
    highlight.addData(featuresToFc(withGeom) as never);
    keepHighlightOnTop(highlight);
    const bounds = highlight.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
  }, []);

  const loadExtentVectors = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !rsVectorRef.current || !msVectorRef.current) return;
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
      const features = (data.features || []) as RajukPlotFeature[];
      const rs = features.filter(isRsFeature);
      const ms = features.filter(isMsFeature);

      rsVectorRef.current.clearLayers();
      msVectorRef.current.clearLayers();
      if (showMsBoundary) msVectorRef.current.addData(featuresToFc(ms) as never);
      if (showRsBoundary) rsVectorRef.current.addData(featuresToFc(rs) as never);
      keepHighlightOnTop(highlightRef.current);

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
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
        if (disposed || !mapElement.current) return;

        const map = L.map(mapElement.current, {
          zoomControl: true,
          preferCanvas: true,
          minZoom: 8,
          maxZoom: 21,
        });
        map.fitBounds(DAP_BOUNDS, { padding: [25, 25] });
        mapRef.current = map;
        basemapRef.current = createBasemapLayer(L, "satellite").addTo(map);

        LAYERS.forEach((definition) => {
          const tile = L.tileLayer(`/api/rajuk/tile/${definition.key}/{z}/{y}/{x}`, {
            maxZoom: 21,
            opacity: definition.key === "ms" ? 0.72 : 0.78,
            crossOrigin: true,
            attribution: "LandBD / RAJUK",
            errorTileUrl:
              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          });
          layerRefs.current[definition.key] = tile;
          if (definition.defaultVisible) tile.addTo(map);
        });

        // MS (FS/5) then RS (FS/0) — both under selected black RS highlight
        const msVector = L.geoJSON(null, {
          style: { color: "#7c3aed", weight: 1.5, fillColor: "#a78bfa", fillOpacity: 0.08 },
          onEachFeature: (feature, layer) => {
            const p = (feature.properties || {}) as Record<string, unknown>;
            const label = present(p.ms_plot_no)
              ? String(p.ms_plot_no)
              : present(p.plot_no)
                ? `MS-${p.plot_no}`
                : "MS";
            layer.bindPopup(`<strong>${label}</strong><br/>${p.address_search || ""}`);
          },
        }).addTo(map);

        const rsVector = L.geoJSON(null, {
          style: { color: "#2563eb", weight: 1.5, fillColor: "#3b82f6", fillOpacity: 0.08 },
          onEachFeature: (feature, layer) => {
            const p = (feature.properties || {}) as Record<string, unknown>;
            const label = present(p.rs_plot_no)
              ? String(p.rs_plot_no)
              : present(p.plot_no)
                ? `RS-${p.plot_no}`
                : "RS";
            layer.bindPopup(`<strong>${label}</strong><br/>${p.address_search || ""}`);
          },
        }).addTo(map);

        msVectorRef.current = msVector;
        rsVectorRef.current = rsVector;

        const highlight = L.geoJSON(null, {
          style: (feat) => {
            const p = (feat?.properties || {}) as Record<string, unknown>;
            const ms = p._layer_source === "ms" || p.plot_kind === "ms" || present(p.ms_plot_no);
            return ms
              ? { color: "#6d28d9", weight: 3, fillColor: "#a78bfa", fillOpacity: 0.3 }
              : { color: "#000000", weight: 3.5, fillColor: "#94a3b8", fillOpacity: 0.12 };
          },
        }).addTo(map);
        highlightRef.current = highlight;

        const scheduleExtent = () => {
          if (extentTimer.current) clearTimeout(extentTimer.current);
          extentTimer.current = setTimeout(() => loadExtentRef.current(), 400);
        };
        map.on("moveend", scheduleExtent);
        map.on("zoomend", scheduleExtent);

        map.on("click", async (event) => {
          if (!identifyModeRef.current) return;
          setSearching(true);
          try {
            const response = await fetch(
              `/api/rajuk/query?action=identify&lat=${encodeURIComponent(event.latlng.lat)}&lng=${encodeURIComponent(event.latlng.lng)}`,
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Identify failed");
            const features = (data.features || []) as RajukPlotFeature[];
            setResults(features);
            setTab("results");
            setPanelOpen(true);
            if (features.length) {
              setSelected(features[0]);
              paintHighlight(features);
              const rsN = features.filter(isRsFeature).length;
              const msN = features.filter(isMsFeature).length;
              notify(`পাওয়া গেছে: ${rsN} RS · ${msN} MS`);
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

        // Leaflet needs a second tick when container size settles
        requestAnimationFrame(() => {
          map.invalidateSize();
          scheduleExtent();
        });
        window.setTimeout(() => map.invalidateSize(), 250);

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
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapReady) void loadExtentVectors();
  }, [loadExtentVectors, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    let cancelled = false;
    import("leaflet").then(({ default: Leaflet }) => {
      if (cancelled || !mapRef.current) return;
      const prev = basemapRef.current;
      if (prev) map.removeLayer(prev);
      basemapRef.current = createBasemapLayer(Leaflet, basemap).addTo(map);
      keepHighlightOnTop(highlightRef.current);
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
      layer.setOpacity(opacity[key]);
      if (layers[key] && !map.hasLayer(layer)) layer.addTo(map);
      if (!layers[key] && map.hasLayer(layer)) map.removeLayer(layer);
    });
  }, [layers, opacity, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !rsVectorRef.current || !msVectorRef.current) return;
    if (showMsBoundary && !map.hasLayer(msVectorRef.current)) msVectorRef.current.addTo(map);
    if (!showMsBoundary && map.hasLayer(msVectorRef.current)) map.removeLayer(msVectorRef.current);
    if (showRsBoundary && !map.hasLayer(rsVectorRef.current)) rsVectorRef.current.addTo(map);
    if (!showRsBoundary && map.hasLayer(rsVectorRef.current)) map.removeLayer(rsVectorRef.current);
    keepHighlightOnTop(highlightRef.current);
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
      const features = (data.features || []) as RajukPlotFeature[];
      setResults(features);
      setTab("results");
      setPanelOpen(true);
      if (!features.length) {
        notify("কোনো RS/MS প্লট পাওয়া যায়নি");
        return;
      }
      setSelected(features[0]);
      paintHighlight(features);
      notify(`${features.filter(isRsFeature).length} RS · ${features.filter(isMsFeature).length} MS`);
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
          const L = (await import("leaflet")).default;
          clearLocationLayers();
          map.setView([latitude, longitude], Math.max(map.getZoom(), 17), { animate: true });
          const marker = L.circleMarker([latitude, longitude], {
            radius: 9,
            color: "#006a4e",
            weight: 3,
            fillColor: "#22c55e",
            fillOpacity: 0.9,
          }).addTo(map);
          marker
            .bindPopup(`<strong>আপনার অবস্থান</strong><br/>±${Math.round(accuracy || 0)} মিটার`)
            .openPopup();
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

  if (initError) {
    return (
      <div className={styles.mapShell} style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>ম্যাপ লোড হয়নি</p>
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 16 }}>{initError}</p>
          <button
            type="button"
            className={styles.searchButton}
            onClick={() => window.location.reload()}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.mapShell} aria-label="নগর পরিকল্পনা মানচিত্র">
      <div ref={mapElement} className={styles.mapCanvas} />
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
        onClick={() => setPanelOpen((value) => !value)}
        aria-label={panelOpen ? "প্যানেল বন্ধ করুন" : "প্যানেল খুলুন"}
      >
        <PanelRight size={17} />
      </button>
      <button
        type="button"
        className={`${styles.locateButton} ${locating ? styles.locateButtonActive : ""}`}
        onClick={goToMyLocation}
        disabled={locating || !mapReady}
        title="বর্তমান অবস্থান"
        aria-label="বর্তমান অবস্থানে যান"
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
                        onChange={(e) => setLayers((current) => ({ ...current, [layer.key]: e.target.checked }))}
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
                      onChange={(e) => setOpacity((current) => ({ ...current, [layer.key]: Number(e.target.value) }))}
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
                  <span className={styles.layerSwatch} style={{ background: "#7c3aed" }} />
                  <div className={styles.layerInfo}>
                    <div className={styles.layerName}>MS polygons (FS/5)</div>
                    <div className={styles.layerMeta}>Default on — under selected RS black line</div>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={showMsBoundary} onChange={(e) => setShowMsBoundary(e.target.checked)} />
                    <span className={styles.toggleTrack} />
                  </label>
                </div>
              </div>
              <div className={styles.layerCard}>
                <div className={styles.layerRow}>
                  <span className={styles.layerSwatch} style={{ background: "#2563eb" }} />
                  <div className={styles.layerInfo}>
                    <div className={styles.layerName}>RS polygons (FS/0)</div>
                    <div className={styles.layerMeta}>Off by default — stays under black RS line</div>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" checked={showRsBoundary} onChange={(e) => setShowRsBoundary(e.target.checked)} />
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
                    onClick={() => setBasemap(key)}
                  >
                    <span className={styles.baseIcon}>{basemapIcon(key)}</span>
                    {value.label}
                  </button>
                ))}
              </div>
              <div className={styles.sectionTitle}>ইন্টার‌্যাকশন</div>
              <button
                type="button"
                className={`${styles.baseButton} ${identifyMode ? styles.baseActive : ""}`}
                onClick={() => setIdentifyMode((v) => !v)}
              >
                <MousePointer2 size={17} />
                <br />
                {identifyMode ? "Identify চালু (ক্লিক = RS+MS)" : "Identify বন্ধ"}
              </button>
            </>
          )}

          {tab === "results" && (
            <>
              <div className={styles.sectionTitle}>
                ফলাফল — {rsResults.length} RS · {msResults.length} MS
              </div>
              {!results.length && (
                <div className={styles.empty}>
                  ম্যাপে ক্লিক করুন অথবা প্লট নম্বর সার্চ করুন। RS ও MS পাশাপাশি দেখাবে।
                </div>
              )}

              {results.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: "#2563eb" }}>RS (FS/0)</div>
                    {rsResults.length ? (
                      rsResults.map((f) => (
                        <PlotCard
                          key={`rs-${f.attributes.objectid}-${f.attributes.p_guid}`}
                          feature={f}
                          kind="rs"
                        />
                      ))
                    ) : (
                      <div className={styles.empty} style={{ fontSize: 12 }}>
                        এই অবস্থানে RS নেই
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: "#7c3aed" }}>MS (FS/5)</div>
                    {msResults.length ? (
                      msResults.map((f) => (
                        <PlotCard
                          key={`ms-${f.attributes.objectid}-${f.attributes.p_guid}`}
                          feature={f}
                          kind="ms"
                        />
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
          )}
        </div>
      </aside>

      <div className={styles.bottomBar}>
        <span>
          <strong>নগর পরিকল্পনা</strong>
        </span>
        <span className={styles.separator} />
        <span>
          RS:{" "}
          <strong>
            {selected && isRsFeature(selected)
              ? rsNumber(selected)
              : rsResults[0]
                ? rsNumber(rsResults[0])
                : "—"}
          </strong>
        </span>
        <span className={styles.separator} />
        <span>
          MS:{" "}
          <strong>
            {selected && isMsFeature(selected)
              ? msNumber(selected)
              : msResults[0]
                ? msNumber(msResults[0])
                : "—"}
          </strong>
        </span>
        <button type="button" className={styles.iconButton} onClick={resetMap} title="রিসেট">
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={goToMyLocation}
          disabled={locating || !mapReady}
          title="বর্তমান অবস্থান"
          aria-label="বর্তমান অবস্থানে যান"
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setIdentifyMode((v) => !v)}
          title="Identify"
          aria-label="Identify টগল"
        >
          <MousePointer2 size={14} />
        </button>
      </div>
      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
