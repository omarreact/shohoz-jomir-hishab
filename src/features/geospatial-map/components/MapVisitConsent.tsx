"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Shield, X } from "lucide-react";

const STORAGE_KEY = "landbd_map_visit_consent_v2";

function collectDeviceInfo(): Record<string, string | number | boolean | null> {
  if (typeof window === "undefined") return {};
  const nav = window.navigator;
  const screen = window.screen;
  return {
    language: nav.language || null,
    languages: Array.isArray(nav.languages) ? nav.languages.slice(0, 8).join(",") : null,
    platform: nav.platform || null,
    vendor: nav.vendor || null,
    cookieEnabled: nav.cookieEnabled,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    deviceMemory: (nav as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
    maxTouchPoints: nav.maxTouchPoints ?? null,
    online: nav.onLine,
    userAgent: (nav.userAgent || "").slice(0, 400),
    screenWidth: screen?.width ?? null,
    screenHeight: screen?.height ?? null,
    screenAvailWidth: screen?.availWidth ?? null,
    screenAvailHeight: screen?.availHeight ?? null,
    colorDepth: screen?.colorDepth ?? null,
    pixelRatio: window.devicePixelRatio ?? null,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    timezoneOffsetMin: new Date().getTimezoneOffset(),
  };
}

function getPosition(): Promise<GeolocationCoordinates | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 12000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { window.clearTimeout(timer); resolve(pos.coords); },
      () => { window.clearTimeout(timer); resolve(null); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

async function saveVisit(location: GeolocationCoordinates | null) {
  const payload = {
    consent: true,
    locationGranted: Boolean(location),
    location: location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      heading: location.heading,
      speed: location.speed,
    } : null,
    device: collectDeviceInfo(),
    page: window.location.pathname,
    referrer: document.referrer,
  };
  const response = await fetch("/api/map-visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
  if (!response.ok) throw new Error(`map-visits ${response.status}`);
}

async function flyMapToUser(lat: number, lng: number, accuracy: number) {
  try {
    const { getLandbdMap } = await import("@/src/features/geospatial-map/lib/mapBridge");
    const map = getLandbdMap() as any;
    if (!map) return;
    const zoom = Math.max(Number(map.getZoom?.()) || 14, 17);
    map.flyTo?.([lat, lng], zoom, { animate: true, duration: 1.2 });
    const mod = await import("leaflet");
    const L = (mod as any).default ?? mod;
    L.circleMarker([lat, lng], { radius: 9, color: "#006a4e", weight: 3, fillColor: "#22c55e", fillOpacity: 0.9 })
      .addTo(map).bindPopup(`<strong>আপনার অবস্থান</strong><br/>±${Math.round(accuracy)} মিটার`).openPopup();
    L.circle([lat, lng], { radius: Math.max(accuracy, 15), color: "#006a4e", weight: 1, fillColor: "#22c55e", fillOpacity: 0.12 }).addTo(map);
  } catch { /* map may not be ready */ }
}

export default function MapVisitConsent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const capture = useCallback(async (requestLocation: boolean) => {
    setBusy(true);
    try {
      const location = requestLocation ? await getPosition() : null;
      await saveVisit(location);
      if (location) void flyMapToUser(location.latitude, location.longitude, location.accuracy || 30);
      try { localStorage.setItem(STORAGE_KEY, "recorded"); } catch {}
      setOpen(false);
    } catch (error) {
      console.error("[map-visits] client tracking failed", error);
      setOpen(false);
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    let recorded = false;
    try { recorded = Boolean(localStorage.getItem(STORAGE_KEY)); } catch {}
    if (recorded) return;
    const t = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006a4e]/15 text-[#006a4e]"><MapPin className="h-6 w-6" /></div>
          <button type="button" onClick={() => void capture(false)} disabled={busy} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="বন্ধ"><X className="h-5 w-5" /></button>
        </div>
        <h2 className="mb-2 text-xl font-extrabold text-slate-900 dark:text-white">আপনার লোকেশন ব্যবহার করবেন?</h2>
        <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">মানচিত্রে আপনার অবস্থান দেখাতে এবং সর্বশেষ অবস্থান সংরক্ষণ করতে ব্রাউজারের লোকেশন অনুমতি প্রয়োজন।</p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" disabled={busy} onClick={() => void capture(true)} className="min-h-12 flex-1 rounded-xl bg-[#006a4e] px-4 text-base font-bold text-white disabled:opacity-60">{busy ? "লোকেশন নেওয়া হচ্ছে…" : "অনুমতি দিন ও চালিয়ে যান"}</button>
          <button type="button" disabled={busy} onClick={() => void capture(false)} className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 disabled:opacity-60">এখন নয়</button>
        </div>
      </div>
    </div>
  );
}
