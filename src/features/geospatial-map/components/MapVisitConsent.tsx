"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";

const STORAGE_KEY = "landbd_map_visit_consent_v3";
const VISITOR_KEY = "landbd_map_visitor_id";

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return null; }
}

function collectDeviceInfo(): Record<string, string | number | boolean | null> {
  if (typeof window === "undefined") return {};
  const nav = window.navigator;
  const screen = window.screen;
  return { language: nav.language || null, languages: nav.languages?.slice(0, 8).join(",") || null, platform: nav.platform || null, vendor: nav.vendor || null, cookieEnabled: nav.cookieEnabled, hardwareConcurrency: nav.hardwareConcurrency ?? null, deviceMemory: (nav as Navigator & { deviceMemory?: number }).deviceMemory ?? null, maxTouchPoints: nav.maxTouchPoints ?? null, online: nav.onLine, userAgent: (nav.userAgent || "").slice(0, 400), screenWidth: screen?.width ?? null, screenHeight: screen?.height ?? null, pixelRatio: window.devicePixelRatio ?? null, innerWidth: window.innerWidth, innerHeight: window.innerHeight, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null, timezoneOffsetMin: new Date().getTimezoneOffset() };
}

function getPosition(): Promise<GeolocationCoordinates | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 12000);
    navigator.geolocation.getCurrentPosition((pos) => { clearTimeout(timer); resolve(pos.coords); }, () => { clearTimeout(timer); resolve(null); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  });
}

async function saveVisit(location: GeolocationCoordinates | null) {
  const response = await fetch("/api/map-visits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId: getVisitorId(), consent: true, locationGranted: Boolean(location), location: location ? { latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy, altitude: location.altitude, heading: location.heading, speed: location.speed } : null, device: collectDeviceInfo(), page: window.location.pathname, referrer: document.referrer }), keepalive: true });
  if (!response.ok) throw new Error(`map-visits ${response.status}`);
}

export default function MapVisitConsent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const capture = useCallback(async () => {
    setBusy(true);
    try { const location = await getPosition(); await saveVisit(location); try { localStorage.setItem(STORAGE_KEY, "recorded"); } catch {} setOpen(false); }
    catch (error) { console.error("[map-visits] tracking failed", error); setOpen(false); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { let recorded = false; try { recorded = Boolean(localStorage.getItem(STORAGE_KEY)); } catch {} if (!recorded) setOpen(true); }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006a4e]/15 text-[#006a4e]"><MapPin className="h-6 w-6" /></div>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="বন্ধ"><X className="h-5 w-5" /></button>
        </div>
        <button type="button" disabled={busy} onClick={() => void capture()} className="min-h-12 w-full rounded-xl bg-[#006a4e] px-4 text-base font-bold text-white disabled:opacity-60">{busy ? "লোকেশন নেওয়া হচ্ছে…" : "লোকেশন অনুমতি দিন"}</button>
      </div>
    </div>
  );
}
