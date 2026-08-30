"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

/** Emergency restore: MapLibre + Esri World Imagery (verified tile HTTP 200).
 *  OSM is blocked by tile policy; Carto was unconfirmed in browser.
 *  Full GIS UI will be restored in a follow-up commit from 2dd4f01 + basemap fix.
 */
export default function MapLibreMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            "basemap-satellite": {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution: "© Esri",
              maxzoom: 21,
            },
          },
          layers: [
            {
              id: "basemap-satellite-layer",
              type: "raster",
              source: "basemap-satellite",
            },
          ],
        },
        center: [90.48911986, 23.82810618],
        zoom: 11,
        minZoom: 8,
        maxZoom: 21,
        renderWorldCopies: false,
        canvasContextAttributes: { preserveDrawingBuffer: true },
      });
      mapRef.current = map;
      map.once("load", () => setReady(true));
      map.on("error", (e) => {
        console.error("MapLibre error:", e);
        setError((e as { error?: { message?: string } })?.error?.message || "Map error");
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Map init failed");
    }
  }, []);

  if (error) {
    return (
      <div className="grid h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-bold text-destructive">মানচিত্র চালু করা যায়নি</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button className="mt-4 rounded-lg border px-4 py-2" onClick={() => window.location.reload()}>
            পুনরায় চেষ্টা
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ background: "#1a1a1a" }}>
      <div ref={containerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} aria-label="ভূমি তথ্য মানচিত্র" />
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-white/20 bg-black/70 px-3 py-2 text-xs text-white shadow">
        <span className={`h-2 w-2 rounded-full ${ready ? "bg-green-500" : "bg-amber-500"}`} />
        {ready ? "MapLibre · Esri Satellite" : "মানচিত্র প্রস্তুত হচ্ছে…"}
      </div>
    </div>
  );
}

export function updateSourceData() {
  return false;
}
