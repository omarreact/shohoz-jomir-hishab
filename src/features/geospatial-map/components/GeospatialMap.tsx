"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layers3, Map as MapIcon, PanelRight, Search, LocateFixed, MousePointer2, Database, X, RefreshCw } from "lucide-react";
import type { Map as LeafletMap, TileLayer, GeoJSON as LeafletGeoJSON } from "leaflet";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import styles from "./GeospatialMap.module.css";

type Tab = "layers" | "basemap" | "results";
type BasemapKey = "osm" | "light" | "satellite" | "satellite2003";
/** Tile keys match /api/rajuk/tile/[layer] */
type LayerKey = "dap" | "rs" | "ms" | "flood" | "boundary" | "transport";
type LayerDef = {
  key: LayerKey;
  label: string;
  description: string;
  color: string;
  defaultVisible: boolean;
};

const LAYERS: LayerDef[] = [
  {
    key: "dap",
    label: "DAP Proposed Landuse",
    description: "Proposed land-use zones",
    color: "#16a34a",
    defaultVisible: true,
  },
  {
    key: "rs",
    label: "RS Mauza tiles",
    description: "Hosted/RS_Mauza_282Scale MapServer",
    color: "#2563eb",
    defaultVisible: true,
  },
  {
    key: "ms",
    label: "MS Mauza tiles",
    description: "Hosted/MS_Mauza_Tiles_Final MapServer",
    color: "#7c3aed",
    defaultVisible: true,
  },
  {
    key: "flood",
    label: "Flood Overlay",
    description: "Flood susceptibility overlay",
    color: "#0891b2",
    defaultVisible: false,
  },
  {
    key: "boundary",
    label: "Overlay Boundary",
    description: "Planning boundary tiles",
    color: "#ea580c",
    defaultVisible: false,
  },
  {
    key: "transport",
    label: "Transport Network",
    description: "Transport network tiles",
    color: "#dc2626",
    defaultVisible: false,
  },
];

const DAP_BOUNDS: [[number, number], [number, number]] = [
  [23.5527, 90.2079],
  [24.1033, 90.6041],
];

const MIN_ZOOM_FOR_VECTOR = 15;

const BASEMAPS: Record<
  BasemapKey,
  { label: string; url: string; attribution: string; maxZoom?: number; maxNativeZoom?: number }
> = {
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
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual/default/2003-12-31/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpg",
    attribution: "© NASA GIBS / Landsat WELD 2003",
    maxZoom: 21,
    maxNativeZoom: 12,
  },
};

const detailValue = (a: Record<string, unknown>, keys: readonly string[]) => {
  for (const key of keys) if (a[key] !== undefined && a[key] !== null && a[key] !== "") return a[key];
  return "—";
};

const DETAIL_FIELDS = [
  ["RS Plot Number", ["rs_plot_no"]],
  ["MS Plot Number", ["ms_plot_no"]],
  ["Survey type", ["plot_kind", "rs_plot_type"]],
  ["JL No", ["rs_jl_no", "jl_no", "jl"]],
  ["Plot Area (Katha Approx.)", ["area_katha", "rs_plot_area", "ms_plot_area"]],
  ["Mauza Name", ["rs_mauza_name", "mauza", "mouza", "mauza_name"]],
  ["Thana/Upazila", ["thana_upazila", "upazila_ps", "upazila", "thana"]],
  ["District", ["m_district", "district", "district_name"]],
  ["Address", ["address_search"]],
] as const;

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString("en-US")
      : value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function surveyLabel(feature: RajukPlotFeature): string {
  const a = feature.attributes as Record<string, unknown>;
  const parts: string[] = [];
  if (a.rs_plot_no) parts.push(String(a.rs_plot_no));
  if (a.ms_plot_no) parts.push(String(a.ms_plot_no));
  if (!parts.length && a.plot_no != null) parts.push(`Plot ${a.plot_no}`);
  const kind = a.plot_kind ? String(a.plot_kind).toUpperCase() : "";
  return kind ? `${parts.join(" · ")} (${kind})` : parts.join(" · ") || "—";
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
    features: features
      .filter((f) => f.geometry?.rings?.length)
      .map((f) => toGeoJson(f)),
  };
}

function createBasemapLayer(Leaflet: typeof import("leaflet"), key: BasemapKey): TileLayer {
  const def = BASEMAPS[key];
  return Leaflet.tileLayer(def.url, {
    attribution: def.attribution,
    maxZoom: def.maxZoom ?? 21,
    maxNativeZoom: def.maxNativeZoom,
    crossOrigin: true,
  });
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

  const [tab, setTab] = useState<Tab>("layers");
  const [panelOpen, setPanelOpen] = useState(true);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.key, l.defaultVisible])) as Record<LayerKey, boolean>,
  );
  const [opacity, setOpacity] = useState<Record<LayerKey, number>>(
    () => Object.fromEntries(LAYERS.map((l) => [l.key, l.key === "ms" ? 0.72 : 0.78])) as Record<LayerKey, number>,
  );
  /** FeatureServer polygon boundaries — on by default */
  const [showRsBoundary, setShowRsBoundary] = useState(true);
  const [showMsBoundary, setShowMsBoundary] = useState(true);
  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
  const [plotNo, setPlotNo] = useState("");
  const [searching, setSearching] = useState(false);
  const [identifyMode, setIdentifyMode] = useState(false);
  const [results, setResults] = useState<RajukPlotFeature[]>([]);
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [toast, setToast] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [vectorStatus, setVectorStatus] = useState("");

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
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
      const rs = features.filter(
        (f) => f.attributes.plot_kind === "rs" || (f.attributes as { _layer_source?: string })._layer_source === "rs",
      );
      const ms = features.filter(
        (f) => f.attributes.plot_kind === "ms" || (f.attributes as { _layer_source?: string })._layer_source === "ms",
      );

      rsVectorRef.current.clearLayers();
      msVectorRef.current.clearLayers();
      if (showRsBoundary) rsVectorRef.current.addData(featuresToFc(rs) as never);
      if (showMsBoundary) msVectorRef.current.addData(featuresToFc(ms) as never);
      setVectorStatus(`FS boundaries: ${rs.length} RS · ${ms.length} MS`);
    } catch (error) {
      setVectorStatus(error instanceof Error ? error.message : "Boundary load failed");
    }
  }, [showRsBoundary, showMsBoundary]);

  useEffect(() => {
    let disposed = false;
    const init = async () => {
      if (!mapElement.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapElement.current) return;
      const map = L.map(mapElement.current, { zoomControl: true, preferCanvas: true, minZoom: 8, maxZoom: 21 });
      map.fitBounds(DAP_BOUNDS, { padding: [25, 25] });
      mapRef.current = map;
      basemapRef.current = createBasemapLayer(L, "satellite").addTo(map);

      // MapServer tile overlays (RS + MS ON by default)
      LAYERS.forEach((definition) => {
        const tile = L.tileLayer(`/api/rajuk/tile/${definition.key}/{z}/{y}/{x}`, {
          maxZoom: 21,
          opacity: definition.key === "ms" ? 0.72 : 0.78,
          crossOrigin: true,
          attribution: "LandBD / RAJUK",
        });
        layerRefs.current[definition.key] = tile;
        if (definition.defaultVisible) tile.addTo(map);
      });

      // FeatureServer polygon boundaries (layer 0 RS, layer 5 MS)
      const rsVector = L.geoJSON(undefined, {
        style: { color: "#2563eb", weight: 1.5, fillColor: "#3b82f6", fillOpacity: 0.08 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          layer.bindPopup(
            `<strong>${p.rs_plot_no || p.plot_no || "RS"}</strong><br/>${p.address_search || ""}`,
          );
        },
      }).addTo(map);
      const msVector = L.geoJSON(undefined, {
        style: { color: "#7c3aed", weight: 1.5, fillColor: "#a78bfa", fillOpacity: 0.08 },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          layer.bindPopup(
            `<strong>${p.ms_plot_no || p.plot_no || "MS"}</strong><br/>${p.address_search || ""}`,
          );
        },
      }).addTo(map);
      rsVectorRef.current = rsVector;
      msVectorRef.current = msVector;

      const highlight = L.geoJSON(undefined, {
        style: { color: "#111827", weight: 3, fillColor: "#facc15", fillOpacity: 0.28 },
      }).addTo(map);
      highlightRef.current = highlight;

      const scheduleExtent = () => {
        if (extentTimer.current) clearTimeout(extentTimer.current);
        extentTimer.current = setTimeout(() => {
          void loadExtentVectors();
        }, 400);
      };
      map.on("moveend", scheduleExtent);
      map.on("zoomend", scheduleExtent);

      map.on("click", async (event) => {
        if (!identifyMode) return;
        setSearching(true);
        try {
          const response = await fetch(
            `/api/rajuk/query?action=identify&lat=${encodeURIComponent(event.latlng.lat)}&lng=${encodeURIComponent(event.latlng.lng)}`,
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Identify failed");
          const features = (data.features || []) as RajukPlotFeature[];
          setResults(features);
          if (features.length) {
            setSelected(features[0]);
            setTab("results");
            highlight.clearLayers().addData(toGeoJson(features[0]) as never);
            const bounds = highlight.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            notify(`${features.length}টি প্লট পাওয়া গেছে (RS/MS)`);
          } else notify("এই অবস্থানে কোনো RS/MS প্লট পাওয়া যায়নি");
        } catch (error) {
          notify(error instanceof Error ? error.message : "Identify ব্যর্থ হয়েছে");
        } finally {
          setSearching(false);
        }
      });

      setMapReady(true);
      scheduleExtent();
    };
    init();
    return () => {
      disposed = true;
      if (extentTimer.current) clearTimeout(extentTimer.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [identifyMode, notify, loadExtentVectors]);

  useEffect(() => {
    void loadExtentVectors();
  }, [loadExtentVectors, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const prev = basemapRef.current;
    if (prev) map.removeLayer(prev);
    import("leaflet").then(({ default: Leaflet }) => {
      basemapRef.current = createBasemapLayer(Leaflet, basemap).addTo(map);
    });
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    LAYERS.forEach(({ key }) => {
      const layer = layerRefs.current[key];
      if (!layer) return;
      layer.setOpacity(opacity[key]);
      if (layers[key] && !map.hasLayer(layer)) layer.addTo(map);
      if (!layers[key] && map.hasLayer(layer)) map.removeLayer(layer);
    });
  }, [layers, opacity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !rsVectorRef.current || !msVectorRef.current) return;
    if (showRsBoundary && !map.hasLayer(rsVectorRef.current)) rsVectorRef.current.addTo(map);
    if (!showRsBoundary && map.hasLayer(rsVectorRef.current)) map.removeLayer(rsVectorRef.current);
    if (showMsBoundary && !map.hasLayer(msVectorRef.current)) msVectorRef.current.addTo(map);
    if (!showMsBoundary && map.hasLayer(msVectorRef.current)) map.removeLayer(msVectorRef.current);
  }, [showRsBoundary, showMsBoundary]);

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
      if (!features.length) {
        notify("কোনো RS/MS প্লট পাওয়া যায়নি");
        return;
      }
      selectFeature(features[0]);
      notify(`${features.length}${data.exceededTransferLimit ? "+" : ""}টি মিল (RS + MS)`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "প্লট সার্চ ব্যর্থ হয়েছে");
    } finally {
      setSearching(false);
    }
  };

  const selectFeature = (feature: RajukPlotFeature) => {
    const map = mapRef.current;
    const highlight = highlightRef.current;
    if (!map || !highlight) return;
    setSelected(feature);
    highlight.clearLayers().addData(toGeoJson(feature) as never);
    const bounds = highlight.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [55, 55], maxZoom: 18 });
  };

  const resetMap = () => {
    mapRef.current?.fitBounds(DAP_BOUNDS, { padding: [25, 25] });
    highlightRef.current?.clearLayers();
    setSelected(null);
    setResults([]);
    setIdentifyMode(false);
  };
  const selectedAttributes = (selected?.attributes ?? {}) as Record<string, unknown>;

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
          placeholder="প্লট / দাগ নম্বর খুঁজুন (RS + MS)…"
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
      {identifyMode && (
        <div className={styles.identifyBanner}>
          <MousePointer2 size={15} /> ম্যাপে একটি প্লটে ক্লিক করে RS/MS তথ্য দেখুন{" "}
          <button type="button" className={styles.iconButton} onClick={() => setIdentifyMode(false)} aria-label="Identify বন্ধ করুন">
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
              <p style={{ margin: "0 0 10px", fontSize: 12, opacity: 0.75 }}>
                RS + MS tiles ডিফল্টে চালু।
              </p>
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
                      onChange={(e) =>
                        setOpacity((current) => ({ ...current, [layer.key]: Number(e.target.value) }))
                      }
                    />
                    <span>{Math.round(opacity[layer.key] * 100)}%</span>
                  </div>
                </div>
              ))}

              <div className={styles.sectionTitle} style={{ marginTop: 16 }}>
                FeatureServer plot boundaries
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 12, opacity: 0.75 }}>
                Layer 0 (RS_mauza) ও Layer 5 (MS_mauza) — zoom ≥ {MIN_ZOOM_FOR_VECTOR}
              </p>
              <div className={styles.layerCard}>
                <div className={styles.layerRow}>
                  <span className={styles.layerSwatch} style={{ background: "#2563eb" }} />
                  <div className={styles.layerInfo}>
                    <div className={styles.layerName}>RS plot polygons</div>
                    <div className={styles.layerMeta}>FeatureServer/0 RS_mauza</div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={showRsBoundary}
                      onChange={(e) => setShowRsBoundary(e.target.checked)}
                    />
                    <span className={styles.toggleTrack} />
                  </label>
                </div>
              </div>
              <div className={styles.layerCard}>
                <div className={styles.layerRow}>
                  <span className={styles.layerSwatch} style={{ background: "#7c3aed" }} />
                  <div className={styles.layerInfo}>
                    <div className={styles.layerName}>MS plot polygons</div>
                    <div className={styles.layerMeta}>FeatureServer/5 MS_mauza</div>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={showMsBoundary}
                      onChange={(e) => setShowMsBoundary(e.target.checked)}
                    />
                    <span className={styles.toggleTrack} />
                  </label>
                </div>
              </div>
              {vectorStatus && (
                <p style={{ margin: "8px 0 0", fontSize: 11, opacity: 0.7 }}>{vectorStatus}</p>
              )}
            </>
          )}
          {tab === "basemap" && (
            <>
              <div className={styles.sectionTitle}>বেসম্যাপ নির্বাচন</div>
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
                onClick={() => setIdentifyMode((value) => !value)}
              >
                <MousePointer2 size={17} />
                <br />
                {identifyMode ? "Identify চালু আছে" : "প্লটে ক্লিক করে Identify"}
              </button>
            </>
          )}
          {tab === "results" && (
            <>
              <div className={styles.sectionTitle}>সার্চ ফলাফল {results.length ? `(${results.length})` : ""}</div>
              {results.length ? (
                results.map((feature) => (
                  <button
                    type="button"
                    className={styles.resultCard}
                    key={`${feature.attributes.objectid}-${feature.attributes.p_guid}`}
                    onClick={() => selectFeature(feature)}
                  >
                    <div className={styles.resultTitle}>Plot {feature.attributes.plot_no ?? "—"}</div>
                    <div className={styles.resultMeta}>
                      {surveyLabel(feature)}
                      <br />
                      {feature.attributes.address_search || "ঠিকানা তথ্য নেই"}
                    </div>
                  </button>
                ))
              ) : (
                <div className={styles.empty}>
                  প্লট নম্বর দিয়ে সার্চ করুন (RS + MS) অথবা Identify চালু করে ম্যাপে ক্লিক করুন।
                </div>
              )}
              {selected && (
                <div className={styles.resultCard} style={{ cursor: "default", textAlign: "left" }}>
                  <div className={styles.resultTitle}>General Plot Information</div>
                  <div className={styles.resultMeta}>
                    Plot No {formatValue(selectedAttributes.plot_no)} · {surveyLabel(selected)}
                  </div>
                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                    {DETAIL_FIELDS.map(([label, keys]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          borderTop: "1px solid rgba(148,163,184,.25)",
                          paddingTop: 6,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{label}</span>
                        <span>{formatValue(detailValue(selectedAttributes, keys))}</span>
                      </div>
                    ))}
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
        <span>RS+MS tiles + FS</span>
        <span className={styles.separator} />
        <span>
          Plot: <strong>{selected?.attributes.plot_no ?? "—"}</strong>
        </span>
        <button type="button" className={styles.iconButton} onClick={resetMap} title="ম্যাপ রিসেট">
          <RefreshCw size={14} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setIdentifyMode((value) => !value)}
          title="Identify"
        >
          <LocateFixed size={14} />
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
