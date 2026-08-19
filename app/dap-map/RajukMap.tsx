"use client";

import { useEffect, useRef } from "react";
import { RAJUK_LAYER_KEYS, RAJUK_LAYERS } from "@/src/services/rajuk/rajukLayers.service";
import { buildRajukTileProxyUrl } from "@/src/shared/http/api/rajukTiles";
import type { RajukLayerKey } from "@/src/services/rajuk/rajukLayers.service";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const DEFAULT_VISIBLE: RajukLayerKey[] = ["dap"];

export default function RajukMap({ selected, onSelect }: { selected?: RajukPlotFeature | null; onSelect?: (feature: RajukPlotFeature) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Leaflet is loaded client-side only, so refs intentionally remain untyped here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    let disposed = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapRef.current) return;

      const map = L.map(mapRef.current, { center: [23.8103, 90.4125], zoom: 11, minZoom: 8, maxZoom: 21, zoomControl: true });
      leafletRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 21,
      }).addTo(map);

      // All six verified RAJUK visualization services are represented by the canonical proxy.
      // Public layers do not require a token; protected layers are authenticated server-side.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overlays: Record<string, any> = {};
      RAJUK_LAYER_KEYS.forEach((key) => {
        const layer = L.tileLayer(`/api/rajuk/tile/${key}/{z}/{y}/{x}`, {
          attribution: "&copy; RAJUK",
          maxZoom: 21,
          opacity: key === "dap" ? 0.9 : 0.75,
          updateWhenIdle: true,
          keepBuffer: 2,
        });
        if (DEFAULT_VISIBLE.includes(key)) layer.addTo(map);
        overlays[RAJUK_LAYERS[key].name] = layer;
      });

      L.control.layers({}, overlays, { collapsed: true }).addTo(map);
      highlightRef.current = L.geoJSON(null, { style: { color: "#006a4e", weight: 3, fillColor: "#006a4e", fillOpacity: 0.12 } }).addTo(map);
    };

    void init();
    return () => {
      disposed = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        highlightRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    const highlight = highlightRef.current;
    if (!map || !highlight) return;
    highlight.clearLayers();
    if (!selected?.geometry) return;

    const geojson = {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: selected.geometry.rings },
      properties: selected.attributes || {},
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    highlight.addData(geojson as any);
    const bounds = highlight.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
    onSelect?.(selected);
  }, [selected, onSelect]);

  return <div ref={mapRef} className="h-full w-full" aria-label="LandBD interactive land map" />;
}

void buildRajukTileProxyUrl;
