"use client";

import { useEffect, useState, type RefObject } from "react";
import type { Map as MapLibreInstance } from "maplibre-gl";
import { Compass, Download, Expand, Home, Loader2, LocateFixed, Minus, Plus, Printer } from "lucide-react";
import { DAP_BOUNDS } from "./types";

type Props = {
  mapRef: RefObject<MapLibreInstance | null>;
  mapReady: boolean;
  locating: boolean;
  goToMyLocation: () => void;
  resetNorth: () => void;
  toggleThreeD: () => void;
  threeD: boolean;
};

const buttonClass = "grid h-10 w-10 place-items-center border-b border-[var(--border-color)] bg-white text-[var(--primary)] transition hover:bg-[var(--brand-green-faint)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40 last:border-b-0";

export default function RajukMapControls({ mapRef, mapReady, locating, goToMyLocation, resetNorth, toggleThreeD, threeD }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const fullExtent = () => {
    mapRef.current?.fitBounds(
      [[DAP_BOUNDS[0][1], DAP_BOUNDS[0][0]], [DAP_BOUNDS[1][1], DAP_BOUNDS[1][0]]],
      { padding: 50, maxZoom: 13, duration: 550 },
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        const element = mapRef.current?.getContainer().closest("main");
        if (!element) throw new Error("Map container unavailable");
        await element.requestFullscreen();
      }
      window.setTimeout(() => mapRef.current?.resize(), 140);
    } catch {
      setFeedback("এই ব্রাউজারে পূর্ণপর্দা চালু করা যায়নি");
    }
  };

  const savePng = () => {
    try {
      const canvas = mapRef.current?.getCanvas();
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      if (!url.startsWith("data:image/png")) throw new Error("Export failed");
      const link = document.createElement("a");
      link.download = "landbd-gis-map.png";
      link.href = url;
      link.click();
      setFeedback("");
    } catch {
      setFeedback("এই বেসম্যাপ উৎস ছবি সংরক্ষণের অনুমতি দেয় না");
    }
  };

  return (
    <div className="absolute right-3 top-[79px] z-[56] flex max-h-[calc(100dvh-160px)] flex-col items-end gap-2 lg:right-4" aria-label="GIS মানচিত্র টুলবার">
      <div className="overflow-hidden rounded-md border border-[var(--border-color)] shadow-[0_4px_18px_rgba(20,40,70,.2)]">
        <button type="button" className={buttonClass} aria-label="জুম বাড়ান" title="Zoom in" disabled={!mapReady} onClick={() => mapRef.current?.zoomIn({ duration: 200 })}><Plus size={18}/></button>
        <button type="button" className={buttonClass} aria-label="জুম কমান" title="Zoom out" disabled={!mapReady} onClick={() => mapRef.current?.zoomOut({ duration: 200 })}><Minus size={18}/></button>
        <button type="button" className={buttonClass} aria-label="পুরো RAJUK ম্যাপ এলাকা" title="Full extent" disabled={!mapReady} onClick={fullExtent}><Home size={18}/></button>
        <button type="button" className={buttonClass} aria-label="উত্তর দিক ঠিক করুন" title="North" disabled={!mapReady} onClick={resetNorth}><Compass size={18}/></button>
        <button type="button" className={buttonClass} aria-label="আমার অবস্থান" title="My location" disabled={!mapReady || locating} onClick={goToMyLocation}>{locating ? <Loader2 size={18} className="animate-spin"/> : <LocateFixed size={18}/>}</button>
        <button type="button" className={buttonClass + (threeD ? " !bg-[var(--brand-green-soft)]" : "")} aria-label="ত্রিমাত্রিক ভিউ" title="3D view" aria-pressed={threeD} disabled={!mapReady} onClick={toggleThreeD}><span className="text-xs font-black">3D</span></button>
        <button type="button" className={buttonClass + (fullscreen ? " !bg-[var(--brand-green-soft)]" : "")} aria-label="পূর্ণপর্দা" title="Fullscreen" aria-pressed={fullscreen} disabled={!mapReady} onClick={() => void toggleFullscreen()}><Expand size={17}/></button>
      </div>
      <div className="overflow-hidden rounded-md border border-[var(--border-color)] shadow-md">
        <button type="button" className={buttonClass} aria-label="মানচিত্র PNG সংরক্ষণ" title="Save map PNG" disabled={!mapReady} onClick={savePng}><Download size={17}/></button>
        <button type="button" className={buttonClass} aria-label="মানচিত্র প্রিন্ট" title="Print map" disabled={!mapReady} onClick={() => window.print()}><Printer size={17}/></button>
      </div>
      {feedback && <div role="alert" className="w-[180px] rounded-md bg-[#fff1ed] px-2 py-2 text-right text-[11px] leading-4 text-[#a73a28] shadow" >{feedback}</div>}
    </div>
  );
}
