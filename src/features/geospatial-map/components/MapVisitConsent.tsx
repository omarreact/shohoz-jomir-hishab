"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Shield, X } from "lucide-react";

const STORAGE_KEY = "landbd_map_visit_consent_v1";

function collectDeviceInfo(): Record<string, string | number | boolean | null> {
  if (typeof window === "undefined") return {};
  const nav = window.navigator;
  const screen = window.screen;
  const conn =
    (nav as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } })
      .connection;

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
    connectionType: conn?.effectiveType ?? null,
    connectionDownlink: conn?.downlink ?? null,
    connectionRtt: conn?.rtt ?? null,
  };
}

async function requestPosition(): Promise<{
  granted: boolean;
  location: GeolocationCoordinates | null;
}> {
  if (!("geolocation" in navigator)) {
    return { granted: false, location: null };
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve({ granted: false, location: null }), 12_000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        resolve({ granted: true, location: pos.coords });
      },
      () => {
        window.clearTimeout(timer);
        resolve({ granted: false, location: null });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

async function sendVisit(payload: Record<string, unknown>) {
  try {
    await fetch("/api/map-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* ignore network errors — map still works */
  }
}

async function flyMapToUser(lat: number, lng: number, accuracy: number) {
  const tryFly = async (attempt = 0): Promise<void> => {
    try {
      const { getLandbdMap } = await import("@/src/features/geospatial-map/lib/mapBridge");
      const map = getLandbdMap() as {
        flyTo?: (c: number[], z: number, o?: object) => void;
        setView?: (c: number[], z: number, o?: object) => void;
        getZoom?: () => number;
      } | null;
      if (!map) {
        if (attempt < 40) {
          await new Promise((r) => window.setTimeout(r, 200));
          return tryFly(attempt + 1);
        }
        return;
      }
      const zoom =
        typeof map.getZoom === "function" ? Math.max(Number(map.getZoom()) || 14, 17) : 17;
      if (typeof map.flyTo === "function") {
        map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 });
      } else if (typeof map.setView === "function") {
        map.setView([lat, lng], zoom, { animate: true });
      }
      const mod = await import("leaflet");
      const L = (mod as { default?: typeof mod }).default ?? mod;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = map as any;
      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#006a4e",
        weight: 3,
        fillColor: "#22c55e",
        fillOpacity: 0.9,
      })
        .addTo(m)
        .bindPopup(`<strong>আপনার অবস্থান</strong><br/>±${Math.round(accuracy)} মিটার`)
        .openPopup();
      L.circle([lat, lng], {
        radius: Math.max(accuracy, 15),
        color: "#006a4e",
        weight: 1,
        fillColor: "#22c55e",
        fillOpacity: 0.12,
      }).addTo(m);
    } catch {
      if (attempt < 20) {
        await new Promise((r) => window.setTimeout(r, 250));
        return tryFly(attempt + 1);
      }
    }
  };
  void tryFly();
}

/**
 * Popup copy: location only.
 * Backend still receives device + context for admin analytics.
 * On grant: fly map to current position.
 */
export default function MapVisitConsent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* private mode */
    }
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const finish = useCallback(async (allowLocation: boolean) => {
    setBusy(true);
    const device = collectDeviceInfo();
    let locationGranted = false;
    let location: Record<string, number | null> | null = null;

    if (allowLocation) {
      const res = await requestPosition();
      locationGranted = res.granted;
      if (res.location) {
        location = {
          latitude: res.location.latitude,
          longitude: res.location.longitude,
          accuracy: res.location.accuracy ?? null,
          altitude: res.location.altitude,
          heading: res.location.heading,
          speed: res.location.speed,
        };
        try {
          sessionStorage.setItem(
            "landbd_pending_user_location",
            JSON.stringify({
              lat: res.location.latitude,
              lng: res.location.longitude,
              accuracy: res.location.accuracy ?? 30,
              t: Date.now(),
            }),
          );
        } catch {
          /* ignore */
        }
        window.dispatchEvent(
          new CustomEvent("landbd:user-location", {
            detail: {
              lat: res.location.latitude,
              lng: res.location.longitude,
              accuracy: res.location.accuracy,
            },
          }),
        );
        void flyMapToUser(
          res.location.latitude,
          res.location.longitude,
          res.location.accuracy ?? 30,
        );
      }
    }

    await sendVisit({
      consent: true,
      locationGranted,
      location,
      device,
      page: typeof window !== "undefined" ? window.location.pathname : "/geospatial-map",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });

    try {
      localStorage.setItem(STORAGE_KEY, allowLocation ? "accepted" : "declined");
    } catch {
      /* ignore */
    }
    setBusy(false);
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-consent-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006a4e]/15 text-[#006a4e]">
            <MapPin className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={() => void finish(false)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="বন্ধ"
            disabled={busy}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2
          id="map-consent-title"
          className="mb-2 text-xl font-extrabold text-slate-900 dark:text-white"
        >
          লোকেশন চালু করবেন?
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          মানচিত্রে আপনার অবস্থান দেখাতে ব্রাউজারের লোকেশন অনুমতি লাগবে।
        </p>
        <ul className="mb-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <li className="flex gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#006a4e]" />
            অবস্থান (অনুমতি দিলে): অক্ষাংশ, দ্রাঘিমাংশ, নির্ভুলতা
          </li>
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            disabled={busy}
            onClick={() => void finish(true)}
            className="min-h-12 flex-1 rounded-xl bg-[#006a4e] px-4 text-base font-bold text-white hover:bg-[#00523b] disabled:opacity-60"
          >
            {busy ? "অপেক্ষা করুন…" : "অনুমতি দিন ও চালিয়ে যান"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void finish(false)}
            className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            এখন নয়
          </button>
        </div>
      </div>
    </div>
  );
}
