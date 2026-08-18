"use client";

import { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import LayerList from "@arcgis/core/widgets/LayerList";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

const layers = [
  ["dap", "DAP Proposed Landuse", true],
  ["rs", "RS Mauza", false],
  ["ms", "MS Mauza", false],
  ["flood", "Flood Overlay", false],
  ["boundary", "Overlay Boundary", false],
  ["transport", "Transport Network", false],
] as const;

export default function RajukMap({ selected, onSelect }: { selected?: RajukPlotFeature | null; onSelect?: (feature: RajukPlotFeature) => void }) {
  const node = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const highlightLayer = useRef<GraphicsLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!node.current) return;
    const map = new Map({ basemap: "gray-vector" });
    const operational = layers.map(([key, title, visible]) => new WebTileLayer({ id: `rajuk-${key}`, title, visible, urlTemplate: `/api/rajuk/tile/${key}/{z}/{y}/{x}`, copyright: "RAJUK" }));
    map.addMany(operational);
    const graphics = new GraphicsLayer({ id: "rajuk-selection", title: "Selected Plot", listMode: "hide" });
    map.add(graphics);
    highlightLayer.current = graphics;

    const view = new MapView({ container: node.current, map, center: [90.4125, 23.8103], zoom: 10, constraints: { minZoom: 8, maxZoom: 21 } });
    viewRef.current = view;
    view.when(async () => {
      setMapReady(true);
      try {
        const response = await fetch("/api/rajuk/metadata?layer=dap", { cache: "no-store" });
        const metadata = await response.json();
        if (metadata.extent) await view.goTo(metadata.extent, { duration: 900 });
      } catch { /* fallback center is intentional */ }
      const layerList = new LayerList({ view, container: document.getElementById("rajuk-layer-list") || undefined });
      void layerList;
    });
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    const graphics = highlightLayer.current;
    if (!view || !graphics || !selected?.geometry) return;
    const polygon = new Polygon({ rings: selected.geometry.rings, spatialReference: { wkid: 4326 } });
    graphics.removeAll();
    const graphic = new Graphic({ geometry: polygon, attributes: selected.attributes, symbol: { type: "simple-fill", color: [0, 106, 78, 0.12], outline: { color: [0, 106, 78, 1], width: 3 } } as __esri.SimpleFillSymbol });
    graphics.add(graphic);
    void view.goTo({ target: polygon, padding: { top: 80, right: 420, bottom: 80, left: 80 } }, { duration: 700 });
    onSelect?.(selected);
  }, [selected, onSelect]);

  return <div className="relative h-full w-full"><div ref={node} className="h-full w-full" /><div id="rajuk-layer-list" className={`absolute right-4 top-4 z-20 max-h-[50vh] w-72 overflow-auto rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur ${mapReady ? "" : "hidden"}`} /></div>;
}
