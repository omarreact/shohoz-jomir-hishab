"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreInstance } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { sendPlotToFaraez, sendPlotToKhatiyan } from "@/src/modules/khatiyan/gis-bridge";
import {
  BASEMAP_SOURCE_DEFINITIONS,
  EMPTY_FEATURE_COLLECTION,
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
import {
  createAccuracyPolygon,
  detailRows,
  featuresToFc,
  fetchWithTimeout,
  isMsFeature,
  updateSourceData,
} from "./mapUtils";
import {
  ADVANCED_LAYER_OPACITY,
  ADVANCED_LAYER_VISIBILITY,
  PUBLIC_BASEMAP_KEYS,
  PUBLIC_LAYER_OPACITY,
  PUBLIC_LAYER_VISIBILITY,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import MapLibreMapView from "./MapLibreMapView";
import { bindMapViewport } from "./mapViewport";

const EMPTY_GEOJSON = EMPTY_FEATURE_COLLECTION as FeatureCollection<Geometry>;

export default function MapLibreMap() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isAdvanced = isLoggedIn;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const extentTimerRef = useRef<number | null>(null);
  const extentControllerRef = useRef<AbortController | null>(null);
  const identifyControllerRef = useRef<AbortController | null>(null);
  const extentRequestIdRef = useRef(0);
  const identifyRequestIdRef = useRef(0);
  const mapReadyRef = useRef(false);
  const identifyModeRef = useRef(true);

  const [tab, setTab] = useState<Tab>("layers");
  const [panelOpen, setPanelOpen] = useState(false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(PUBLIC_LAYER_VISIBILITY);
  const [opacity, setOpacity] = useState<Record<LayerKey, number>>(PUBLIC_LAYER_OPACITY);
  const [showRsBoundary, setShowRsBoundary] = useState(true);
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
  const [publicResultsOpen, setPublicResultsOpen] = useState(true);
  const [routingCalculator, setRoutingCalculator] = useState<"khatiyan" | "faraez" | null>(null);

  identifyModeRef.current = identifyMode;

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4000);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    setLayers(isAdvanced ? { ...ADVANCED_LAYER_VISIBILITY } : { ...PUBLIC_LAYER_VISIBILITY });
    setOpacity(isAdvanced ? { ...ADVANCED_LAYER_OPACITY } : { ...PUBLIC_LAYER_OPACITY });
    setShowRsBoundary(true);
    setShowMsBoundary(true);
    setPanelOpen(false);
    if (!isAdvanced) {
      setBasemap((current) => (PUBLIC_BASEMAP_KEYS.includes(current) ? current : "satellite"));
    }
  }, [authLoading, isAdvanced]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {},
        layers: [],
      },
      center: HISTORIC_2003_CENTER,
      zoom: HISTORIC_2003_ZOOM,
      minZoom: 8,
      maxZoom: 21,
      renderWorldCopies: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    mapRef.current = map;
    const unbindViewport = bindMapViewport(map, containerRef.current!);

    const addSources = () => {
      map.resize();
      (Object.keys(BASEMAP_SOURCE_DEFINITIONS) as BasemapKey[]).forEach((key) => {
        const sourceId =
          key === "osm"
            ? RASTER_SOURCES.basemapOsm
            : key === "light"
              ? RASTER_SOURCES.basemapLight
              : key === "satellite"
                ? RASTER_SOURCES.basemapSatellite
                : RASTER_SOURCES.basemapSatellite2003;
        if (!map.getSource(sourceId)) map.addSource(sourceId, BASEMAP_SOURCE_DEFINITIONS[key]);
      });
      (Object.keys(RAJUK_RASTER_SOURCE_DEFINITIONS) as MapRasterKey[]).forEach((key) => {
        if (!map.getSource(RASTER_SOURCES[key])) map.addSource(RASTER_SOURCES[key], RAJUK_RASTER_SOURCE_DEFINITIONS[key]);
      });
      Object.values(VECTOR_SOURCES).forEach((sourceId) => {
        if (!map.getSource(sourceId)) map.addSource(sourceId, { type: "geojson", data: EMPTY_GEOJSON });
      });
    };

    const addLayers = () => {
      Object.values(BASEMAP_RASTER_LAYERS).forEach((layer) => {
        if (!map.getLayer(layer.id))
          map.addLayer({
            ...layer,
            layout: { visibility: layer.id === RASTER_LAYERS.basemapSatellite ? "visible" : "none" },
          });
      });
      Object.values(RAJUK_RASTER_LAYERS).forEach((layer) => {
        if (!map.getLayer(layer.id))
          map.addLayer({
            ...layer,
            layout: { visibility: "none" },
          });
      });
      [
        VECTOR_LAYER_STYLES.rsBoundaryFill,
        VECTOR_LAYER_STYLES.rsBoundaryLine,
        VECTOR_LAYER_STYLES.msBoundaryFill,
        VECTOR_LAYER_STYLES.msBoundaryLine,
        VECTOR_LAYER_STYLES.rsPlotLabels,
        VECTOR_LAYER_STYLES.msPlotLabels,
        VECTOR_LAYER_STYLES.selectedPlotFill,
        VECTOR_LAYER_STYLES.selectedPlotLine,
        VECTOR_LAYER_STYLES.accuracyFill,
        VECTOR_LAYER_STYLES.accuracyLine,
        VECTOR_LAYER_STYLES.locationPoint,
      ].forEach((layer) => {
        if (!map.getLayer(layer.id)) map.addLayer(layer as maplibregl.LayerSpecification);
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    };

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      if (!identifyModeRef.current) return;

      identifyControllerRef.current?.abort();
      const controller = new AbortController();
      identifyControllerRef.current = controller;
      const requestId = ++identifyRequestIdRef.current;
      const { lat, lng } = event.lngLat;

      void (async () => {
        try {
          const params = new URLSearchParams({
            action: "identify",
            lat: String(lat),
            lng: String(lng),
          });
          const response = await fetchWithTimeout(`/api/rajuk/query?${params.toString()}`, {}, controller.signal);
          const data = (await response.json().catch(() => null)) as { features?: RajukPlotFeature[]; error?: string } | null;
          if (!response.ok) throw new Error(data?.error || "দাগ শনাক্ত করা যায়নি");
          if (controller.signal.aborted || requestId !== identifyRequestIdRef.current || !mapReadyRef.current) return;

          const found = Array.isArray(data?.features) ? data.features : [];
          setResults(found);
          setSelected(found[0] ?? null);
          setTab("results");
          setPanelOpen(false);
          updateSourceData(
            map,
            VECTOR_SOURCES.selectedPlot,
            found[0] ? (featuresToFc([found[0]]) as FeatureCollection<Geometry>) : EMPTY_GEOJSON,
          );

          if (!found.length) notify("এই অবস্থানে কোনো দাগ পাওয়া যায়নি");
        } catch (error) {
          if (controller.signal.aborted || requestId !== identifyRequestIdRef.current) return;
          console.error("RAJUK identify failed:", error);
          notify(error instanceof Error ? error.message : "দাগ শনাক্ত করা যায়নি");
        }
      })();
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
      unbindViewport();
      if (extentTimerRef.current) window.clearTimeout(extentTimerRef.current);
      extentControllerRef.current?.abort();
      identifyControllerRef.current?.abort();
      extentRequestIdRef.current += 1;
      identifyRequestIdRef.current += 1;
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
          if (!response.ok)
            throw new Error((await response.json().catch(() => null))?.error || `RAJUK ${kind.toUpperCase()} request failed`);
          return (await response.json()) as { features?: RajukPlotFeature[] };
        });
      };

      setVectorStatus("দাগের সীমানা লোড হচ্ছে…");
      try {
        const [rs, ms] = await Promise.all([query("rs"), query("ms")]);
        if (controller.signal.aborted || requestId !== extentRequestIdRef.current || !mapReadyRef.current) return;
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
  }, [notify]);

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
    if (map.getLayer(VECTOR_LAYERS.rsBoundaryFill))
      map.setLayoutProperty(VECTOR_LAYERS.rsBoundaryFill, "visibility", showRsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.rsBoundaryLine))
      map.setLayoutProperty(VECTOR_LAYERS.rsBoundaryLine, "visibility", showRsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.rsPlotLabels))
      map.setLayoutProperty(VECTOR_LAYERS.rsPlotLabels, "visibility", showRsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.msBoundaryFill))
      map.setLayoutProperty(VECTOR_LAYERS.msBoundaryFill, "visibility", showMsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.msBoundaryLine))
      map.setLayoutProperty(VECTOR_LAYERS.msBoundaryLine, "visibility", showMsBoundary ? "visible" : "none");
    if (map.getLayer(VECTOR_LAYERS.msPlotLabels))
      map.setLayoutProperty(VECTOR_LAYERS.msPlotLabels, "visibility", showMsBoundary ? "visible" : "none");
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
      setPanelOpen(false);
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
        const point: GeoJSON.Feature<GeoJSON.Point> = {
          type: "Feature",
          geometry: { type: "Point", coordinates: [longitude, latitude] },
          properties: {},
        };
        const circle = createAccuracyPolygon(latitude, longitude, accuracy);
        updateSourceData(mapRef.current!, VECTOR_SOURCES.location, {
          type: "FeatureCollection",
          features: [point],
        } as FeatureCollection<Geometry>);
        updateSourceData(mapRef.current!, VECTOR_SOURCES.accuracy, circle);
        mapRef.current!.flyTo({
          center: [longitude, latitude],
          zoom: Math.max(mapRef.current!.getZoom(), 17),
          duration: 800,
        });
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

  const validateAndRoute = useCallback(
    async (calculator: "khatiyan" | "faraez", feature: RajukPlotFeature) => {
      setRoutingCalculator(calculator);
      try {
        const response = await fetchWithTimeout("/api/rajuk/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "adapt-for-khatiyan", feature, shapeAreaUnit: "square-feet" }),
        });
        const data = (await response.json().catch(() => null)) as {
          plot?: Parameters<typeof sendPlotToKhatiyan>[0];
          provenance?: unknown;
          error?: string;
        } | null;
        if (!response.ok || !data?.plot) throw new Error(data?.error || "RAJUK প্লট যাচাই ব্যর্থ হয়েছে");
        if (calculator === "khatiyan") sendPlotToKhatiyan(data.plot);
        else sendPlotToFaraez(data.plot);
        router.push(calculator === "khatiyan" ? "/khatiyan" : "/faraez");
      } catch (error) {
        notify(error instanceof Error ? error.message : "প্লট যাচাই ব্যর্থ হয়েছে");
      } finally {
        setRoutingCalculator(null);
      }
    },
    [notify, router],
  );

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

  const activeDetails = selected
    ? (isMsFeature(selected) ? detailRows(selected, "ms") : detailRows(selected, "rs")).map(([label, value]) => ({
        label,
        value,
      }))
    : [];

  return (
    <MapLibreMapView
      containerRef={containerRef}
      initError={initError}
      mapReady={mapReady}
      vectorStatus={vectorStatus}
      basemap={basemap}
      setBasemap={setBasemap}
      plotNo={plotNo}
      setPlotNo={setPlotNo}
      searching={searching}
      searchPlots={searchPlots}
      goToMyLocation={goToMyLocation}
      locating={locating}
      identifyMode={identifyMode}
      setIdentifyMode={setIdentifyMode}
      panelOpen={panelOpen}
      setPanelOpen={setPanelOpen}
      tab={tab}
      setTab={setTab}
      layers={layers}
      setLayers={setLayers}
      opacity={opacity}
      setOpacity={setOpacity}
      showRsBoundary={showRsBoundary}
      setShowRsBoundary={setShowRsBoundary}
      showMsBoundary={showMsBoundary}
      setShowMsBoundary={setShowMsBoundary}
      results={results}
      setResults={setResults}
      selected={selected}
      selectResult={selectResult}
      toast={toast}
      isAdvanced={isAdvanced}
      publicResultsOpen={publicResultsOpen}
      routingCalculator={routingCalculator}
      validateAndRoute={validateAndRoute}
      activeDetails={activeDetails}
    />
  );
}
