"use client";

import { useEffect, useRef } from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const LAYER_DEFS = [
  { key: "dap", title: "DAP Proposed Landuse", visible: true },
  { key: "rs", title: "RS Mauza", visible: false },
  { key: "ms", title: "MS Mauza", visible: false },
  { key: "flood", title: "Flood Overlay", visible: false },
  { key: "boundary", title: "Overlay Boundary", visible: false },
  { key: "transport", title: "Transport Network", visible: false },
];

export default function RajukMap({
  selected,
  onSelect,
}: {
  selected?: RajukPlotFeature | null;
  onSelect?: (feature: RajukPlotFeature) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highlightRef = useRef<any>(null);

  // Initialize Leaflet map on mount
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center: [23.8103, 90.4125],
        zoom: 11,
        minZoom: 8,
        maxZoom: 21,
      });
      leafletRef.current = map;

      // OSM base layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 21,
      }).addTo(map);

      // RAJUK overlay layers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overlays: Record<string, any> = {};
      LAYER_DEFS.forEach(({ key, title, visible }) => {
        const layer = L.tileLayer(
          `/api/tiles?service=${key}&x={x}&y={y}&z={z}`,
          { attribution: "&copy; RAJUK", maxZoom: 21, opacity: 0.75 }
        );
        if (visible) layer.addTo(map);
        overlays[title] = layer;
      });

      L.control.layers({}, overlays, { collapsed: false }).addTo(map);

      // Highlight layer for selected plot
      highlightRef.current = L.geoJSON(null, {
        style: {
          color: "#006a4e",
          weight: 3,
          fillColor: "#006a4e",
          fillOpacity: 0.12,
        },
      }).addTo(map);
    };

    init();

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        highlightRef.current = null;
      }
    };
  }, []);

  // Highlight selected plot when it changes
  useEffect(() => {
    const map = leafletRef.current;
    const highlight = highlightRef.current;
    if (!map || !highlight || !selected?.geometry) return;

    highlight.clearLayers();
    try {
      const geojson = {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: selected.geometry.rings,
        },
        properties: selected.attributes || {},
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      highlight.addData(geojson as any);
      const bounds = highlight.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
      onSelect?.(selected);
    } catch {
      // Malformed geometry — ignore silently
    }
  }, [selected, onSelect]);

  return <div ref={mapRef} className="h-full w-full" />;
}
