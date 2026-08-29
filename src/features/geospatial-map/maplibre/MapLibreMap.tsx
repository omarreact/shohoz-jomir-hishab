"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type GeoJSONSource, type GeoJSONSourceSpecification, type Map as MapLibreInstance } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import {
  BASEMAP_SOURCE_DEFINITIONS,
  DAP_BOUNDS,
  EMPTY_FEATURE_COLLECTION,
  RAJUK_RASTER_SOURCE_DEFINITIONS,
  RASTER_LAYERS,
  RASTER_SOURCES,
  VECTOR_LAYERS,
  VECTOR_SOURCES,
} from "./types";
import { BASEMAP_RASTER_LAYERS, RAJUK_RASTER_LAYERS, VECTOR_LAYER_STYLES } from "./layers";

const EMPTY_GEOJSON = EMPTY_FEATURE_COLLECTION as FeatureCollection<Geometry>;

/**
 * Stage C/D MapLibre renderer.
 *
 * This component intentionally owns only the WebGL map and its source/layer
 * foundation. Search, identify, results, routing and geolocation interactions
 * remain in the existing map implementation until the interactive migration.
 */
export default function MapLibreMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      bounds: [
        DAP_BOUNDS[0][1],
        DAP_BOUNDS[0][0],
        DAP_BOUNDS[1][1],
        DAP_BOUNDS[1][0],
      ],
      fitBoundsOptions: { padding: 25 },
      minZoom: 8,
      maxZoom: 21,
      attributionControl: true,
    });

    mapRef.current = map;

    const addRasterSources = () => {
      (Object.keys(BASEMAP_SOURCE_DEFINITIONS) as Array<keyof typeof BASEMAP_SOURCE_DEFINITIONS>).forEach((key) => {
        const sourceId = RASTER_SOURCES[
          key === "osm"
            ? "basemapOsm"
            : key === "light"
              ? "basemapLight"
              : key === "satellite"
                ? "basemapSatellite"
                : "basemapSatellite2003"
        ];
        if (!map.getSource(sourceId)) map.addSource(sourceId, BASEMAP_SOURCE_DEFINITIONS[key]);
      });

      (Object.keys(RAJUK_RASTER_SOURCE_DEFINITIONS) as Array<keyof typeof RAJUK_RASTER_SOURCE_DEFINITIONS>).forEach((key) => {
        const sourceId = RASTER_SOURCES[key];
        if (!map.getSource(sourceId)) map.addSource(sourceId, RAJUK_RASTER_SOURCE_DEFINITIONS[key]);
      });
    };

    const addVectorSources = () => {
      const emptySource = (): GeoJSONSourceSpecification => ({
        type: "geojson",
        data: EMPTY_GEOJSON,
      });

      Object.values(VECTOR_SOURCES).forEach((sourceId) => {
        if (!map.getSource(sourceId)) map.addSource(sourceId, emptySource());
      });
    };

    const addLayers = () => {
      Object.values(BASEMAP_RASTER_LAYERS).forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer({
            ...layer,
            layout: {
              visibility: layer.id === RASTER_LAYERS.basemapOsm ? "visible" : "none",
            },
          });
        }
      });

      Object.values(RAJUK_RASTER_LAYERS).forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer({
            ...layer,
            layout: {
              visibility:
                layer.id === RASTER_LAYERS.rs || layer.id === RASTER_LAYERS.ms
                  ? "visible"
                  : "none",
            },
          });
        }
      });

      const vectorLayers = [
        VECTOR_LAYER_STYLES.rsBoundaryFill,
        VECTOR_LAYER_STYLES.rsBoundaryLine,
        VECTOR_LAYER_STYLES.msBoundaryFill,
        VECTOR_LAYER_STYLES.msBoundaryLine,
        VECTOR_LAYER_STYLES.selectedPlotFill,
        VECTOR_LAYER_STYLES.selectedPlotLine,
        VECTOR_LAYER_STYLES.locationPoint,
        VECTOR_LAYER_STYLES.accuracyFill,
        VECTOR_LAYER_STYLES.accuracyLine,
      ];

      vectorLayers.forEach((layer) => {
        if (!map.getLayer(layer.id)) map.addLayer(layer);
      });
    };

    map.once("load", () => {
      addRasterSources();
      addVectorSources();
      addLayers();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" aria-label="ভূমি তথ্য মানচিত্র" />;
}

/**
 * Update an existing GeoJSON source without removing/re-adding it.
 * Keeping the source object alive avoids unnecessary WebGL resource churn.
 */
export function updateSourceData(
  map: MapLibreInstance,
  sourceId: string,
  data: FeatureCollection<Geometry>,
): boolean {
  const source = map.getSource(sourceId);
  if (!source || source.type !== "geojson") return false;
  (source as GeoJSONSource).setData(data);
  return true;
}
