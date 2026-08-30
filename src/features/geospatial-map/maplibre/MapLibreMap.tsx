"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";

/** Emergency restore: MapLibre map with working Carto Light basemap.
 *  OSM tiles are blocked by tile usage policy (x-blocked).
 *  MapLibre does not expand Leaflet's {r} retina token — use plain {z}/{x}/{y}.
 *  Full GIS UI will be restored in a follow-up commit.
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
            "basemap-light": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap © CARTO",
              maxzoom: 21,
            },
          },
          layers: [
            {
              id: "basemap-light-layer",
              type: "raster",
              source: "basemap-light",
            },
          ],
        },
        // MapLibre order: [longitude, latitude]
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
    <div className="relative h-screen w-full overflow-hidden" style={{ background: "#e5e7eb" }}>
      <div ref={containerRef} className="absolute inset-0" aria-label="ভূমি তথ্য মানচিত্র" />
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs shadow backdrop-blur">
        <span className={`h-2 w-2 rounded-full ${ready ? "bg-green-500" : "bg-amber-500"}`} />
        {ready ? "MapLibre · Carto Light" : "মানচিত্র প্রস্তুত হচ্ছে…"}
      </div>
    </div>
  );
}

export function updateSourceData() {
  return false;
}
