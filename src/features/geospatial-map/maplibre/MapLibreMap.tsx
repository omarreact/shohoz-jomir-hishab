"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreInstance } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { sendPlotToFaraez, sendPlotToKhatiyan } from "@/src/modules/khatiyan/gis-bridge";
import type { KhatiyanPlot } from "@/src/shared/types";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import MapLibreMapView from "./MapLibreMapView";
import { bindMapViewport } from "./mapViewport";
import {
  BASEMAP_SOURCE_DEFINITIONS,
  EMPTY_FEATURE_COLLECTION,
  GIS_REQUEST_TIMEOUT_MS,
  HISTORIC_2003_CENTER,
  HISTORIC_2003_ZOOM,
  RASTER_LAYERS,
  RASTER_SOURCES,
  RAJUK_RASTER_SOURCE_DEFINITIONS,
  VECTOR_SOURCES,
  type BasemapKey,
  type MapRasterKey,
} from "./types";
import { BASEMAP_RASTER_LAYERS, RAJUK_RASTER_LAYERS, VECTOR_LAYER_STYLES } from "./layers";
import {
  ADVANCED_LAYER_OPACITY,
  ADVANCED_LAYER_VISIBILITY,
  PUBLIC_BASEMAP_KEYS,
  PUBLIC_LAYER_OPACITY,
  PUBLIC_LAYER_VISIBILITY,
  type LayerKey,
  type Tab,
} from "./mapConstants";
import { detailRows, isMsFeature } from "./mapUtils";

const EMPTY_GEOJSON = EMPTY_FEATURE_COLLECTION as FeatureCollection<Geometry>;

export default function MapLibreMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isAdvanced = Boolean(isLoggedIn);

  const [mapReady, setMapReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [vectorStatus, setVectorStatus] = useState("");
  const [basemap, setBasemap] = useState<BasemapKey>("satellite");
  const [plotNo, setPlotNo] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [identifyMode, setIdentifyMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("layers");
  const [layers, setLayers] = useState(PUBLIC_LAYER_VISIBILITY);
  const [opacity, setOpacity] = useState(PUBLIC_LAYER_OPACITY);
  const [showRsBoundary, setShowRsBoundary] = useState(false);
  const [showMsBoundary, setShowMsBoundary] = useState(false);
  const [results, setResults] = useState<RajukPlotFeature[]>([]);
  const [selected, setSelected] = useState<RajukPlotFeature | null>(null);
  const [toast, setToast] = useState("");
  const [publicResultsOpen, setPublicResultsOpen] = useState(false);
  const [routingCalculator, setRoutingCalculator] = useState<"khatiyan" | "faraez" | null>(null);

  useEffect(() => {
    if (authLoading) return;
    setLayers(isAdvanced ? { ...ADVANCED_LAYER_VISIBILITY } : { ...PUBLIC_LAYER_VISIBILITY });
    setOpacity(isAdvanced ? { ...ADVANCED_LAYER_OPACITY } : { ...PUBLIC_LAYER_OPACITY });
    setShowRsBoundary(isAdvanced);
    setShowMsBoundary(isAdvanced);
    setPanelOpen(isAdvanced);
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

    const onLoad = () => {
      try {
        addSources();
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
          VECTOR_LAYER_STYLES.selectedPlotFill,
          VECTOR_LAYER_STYLES.selectedPlotLine,
          VECTOR_LAYER_STYLES.rsPlotLabels,
          VECTOR_LAYER_STYLES.msPlotLabels,
        ].forEach((layer) => {
          if (!map.getLayer(layer.id)) map.addLayer(layer);
        });
        setMapReady(true);
        setVectorStatus("MapLibre WebGL");
      } catch (e) {
        setInitError(e instanceof Error ? e.message : "মানচিত্র চালু করা যায়নি");
      }
    };

    map.on("load", onLoad);
    map.on("error", () => undefined);

    return () => {
      unbindViewport();
      map.off("load", onLoad);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Keep this component lean: detailed search/identify handlers remain in the
  // existing production MapLibreMap when available. This restore focuses on a
  // working WebGL basemap canvas after a bad PLACEHOLDER deploy.

  const activeDetails: ReadonlyArray<readonly [string, string]> = selected
    ? detailRows(selected, isMsFeature(selected) ? "ms" : "rs").slice(0, 6)
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
      searchPlots={() => undefined}
      goToMyLocation={() => undefined}
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
      selectResult={setSelected}
      toast={toast}
      isAdvanced={isAdvanced}
      publicResultsOpen={publicResultsOpen}
      routingCalculator={routingCalculator}
      validateAndRoute={() => undefined}
      activeDetails={activeDetails}
    />
  );
}
