"use client";

import { useEffect, useState, type RefObject } from "react";
import type { Map as MapLibreInstance } from "maplibre-gl";
import { Copy } from "lucide-react";

export default function RajukCoordinateStatus({ mapRef, mapReady }: { mapRef: RefObject<MapLibreInstance | null>; mapReady: boolean }) {
  const [position, setPosition] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    let frame: number | null = null;
    const onPointer = (event: { lngLat: { lat: number; lng: number } }) => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPosition({ lat: event.lngLat.lat, lng: event.lngLat.lng, zoom: map.getZoom() }));
    };
    const onZoom = () => setPosition((previous) => ({
      lat: previous?.lat ?? map.getCenter().lat,
      lng: previous?.lng ?? map.getCenter().lng,
      zoom: map.getZoom(),
    }));
    const center = map.getCenter();
    setPosition({ lat: center.lat, lng: center.lng, zoom: map.getZoom() });
    map.on("mousemove", onPointer);
    map.on("zoomend", onZoom);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      map.off("mousemove", onPointer);
      map.off("zoomend", onZoom);
    };
  }, [mapReady, mapRef]);

  const copy = async () => {
    if (!position) return;
    try {
      await navigator.clipboard.writeText(`${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
      setCopied(true);
    } catch { setCopied(false); }
  };

  if (!position) return null;
  return (
    <div className="absolute bottom-[92px] right-3 z-[45] flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-md border border-[var(--border-color)] bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--foreground)] shadow-sm lg:bottom-[92px] lg:right-4" aria-label="মানচিত্র স্থানাঙ্ক">
      <span className="truncate tabular-nums">Lat {position.lat.toFixed(5)} · Lon {position.lng.toFixed(5)} · Z {position.zoom.toFixed(1)}</span>
      <button type="button" title="Copy coordinates" aria-label="স্থানাঙ্ক কপি" onClick={() => void copy()} className="grid min-h-7 min-w-7 place-items-center rounded hover:bg-[var(--brand-green-faint)]"><Copy size={13}/></button>
      {copied && <span role="status">কপি হয়েছে</span>}
    </div>
  );
}
