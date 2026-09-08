"use client";

import { useEffect, useRef } from "react";
import { RAJUK_LAYER_KEYS, RAJUK_LAYERS } from "@/src/services/rajuk/rajukLayers.service";
import type { RajukLayerKey } from "@/src/services/rajuk/rajukLayers.service";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const DEFAULT_VISIBLE: RajukLayerKey[] = ["dap", "boundary"];

const LAYER_LABEL_BN: Record<RajukLayerKey, string> = {
  dap: "ডিএপি ল্যান্ডইউজ",
  rs: "আরএস মৌজা",
  ms: "এমএস মৌজা",
  flood: "বন্যা ওভারলে",
  boundary: "সীমানা",
  transport: "পরিবহন নেটওয়ার্ক",
};

function featureToGeoJson(feature: RajukPlotFeature) {
  const geometry = feature.geometry as { rings?: number[][][]; paths?: number[][][] } | undefined;
  if (geometry?.rings?.length) {
    return {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: geometry.rings },
      properties: feature.attributes || {},
    };
  }
  if (geometry?.paths?.length) {
    return {
      type: "Feature" as const,
      geometry: { type: "MultiLineString" as const, coordinates: geometry.paths },
      properties: feature.attributes || {},
    };
  }
  return null;
}

type RajukMapProps = {
  selected?: RajukPlotFeature | null;
  results?: RajukPlotFeature[];
  onSelect?: (feature: RajukPlotFeature) => void;
  onIdentify?: (lat: number, lng: number) => void;
  identifying?: boolean;
};

export default function RajukMap({
  selected,
  results = [],
  onSelect,
  onIdentify,
  identifying = false,
}: RajukMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Leaflet is loaded client-side only.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resultsLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<Record<string, any>>({});
  const onIdentifyRef = useRef(onIdentify);
  onIdentifyRef.current = onIdentify;

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    let disposed = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [23.8103, 90.4125],
        zoom: 11,
        minZoom: 8,
        maxZoom: 21,
        zoomControl: true,
      });
      leafletRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 21,
      }).addTo(map);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overlays: Record<string, any> = {};
      RAJUK_LAYER_KEYS.forEach((key) => {
        const layer = L.tileLayer(`/api/rajuk/tile/${key}/{z}/{y}/{x}`, {
          attribution: "&copy; RAJUK",
          maxZoom: 21,
          opacity: key === "dap" ? 0.85 : key === "flood" ? 0.55 : 0.75,
          updateWhenIdle: true,
          keepBuffer: 2,
        });
        if (DEFAULT_VISIBLE.includes(key)) layer.addTo(map);
        const label = `${LAYER_LABEL_BN[key]} (${RAJUK_LAYERS[key].name})`;
        overlays[label] = layer;
      });
      overlaysRef.current = overlays;

      L.control.layers({}, overlays, { collapsed: true, position: "topright" }).addTo(map);

      resultsLayerRef.current = L.geoJSON(null, {
        style: {
          color: "#0f766e",
          weight: 1.5,
          fillColor: "#14b8a6",
          fillOpacity: 0.12,
        },
      }).addTo(map);

      highlightRef.current = L.geoJSON(null, {
        style: {
          color: "#006a4e",
          weight: 3,
          fillColor: "#006a4e",
          fillOpacity: 0.22,
        },
      }).addTo(map);

      map.on("click", (event: { latlng: { lat: number; lng: number } }) => {
        onIdentifyRef.current?.(event.latlng.lat, event.latlng.lng);
      });
    };

    void init();
    return () => {
      disposed = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        resultsLayerRef.current = null;
        highlightRef.current = null;
        overlaysRef.current = {};
      }
    };
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    const resultsLayer = resultsLayerRef.current;
    if (!map || !resultsLayer) return;

    resultsLayer.clearLayers();
    for (const feature of results) {
      const geojson = featureToGeoJson(feature);
      if (!geojson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resultsLayer.addData(geojson as any);
    }

    if (!selected && results.length > 0) {
      const bounds = resultsLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
    }
  }, [results, selected]);

  useEffect(() => {
    const map = leafletRef.current;
    const highlight = highlightRef.current;
    if (!map || !highlight) return;

    highlight.clearLayers();
    if (!selected?.geometry) return;

    const geojson = featureToGeoJson(selected);
    if (!geojson) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    highlight.addData(geojson as any);
    const bounds = highlight.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
    onSelect?.(selected);
  }, [selected, onSelect]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" aria-label="LandBD interactive RAJUK land map" />

      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[min(100%,18rem)] rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 text-[11px] shadow-md backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/90">
        <p className="font-semibold text-slate-800 dark:text-slate-100">জিআইএস লেয়ার</p>
        <p className="mt-0.5 text-slate-500 dark:text-slate-400">
          ডানদিকের লেয়ার কন্ট্রোল দিয়ে ডিএপি / আরএস / এমএস / বন্যা চালু-বন্ধ করুন।
        </p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {identifying ? "প্লট শনাক্ত হচ্ছে…" : "ম্যাপে ক্লিক করে প্লট identify করুন।"}
        </p>
      </div>
    </div>
  );
}
