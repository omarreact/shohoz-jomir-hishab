"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SESSION_KEY = "landbd_visit_recorded_v1";

function collectDevice() {
  if (typeof window === "undefined") return {};
  const nav = window.navigator;
  const screen = window.screen;
  const connection = (nav as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  }).connection;

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
    connectionType: connection?.effectiveType ?? null,
    connectionDownlink: connection?.downlink ?? null,
    connectionRtt: connection?.rtt ?? null,
  };
}

/** Records one basic LandBD app visit per browser session. GPS is never collected here. */
export default function VisitTracker() {
  const pathname = usePathname();
  const isMapRoute =
    pathname?.startsWith("/dap-map") ||
    pathname?.startsWith("/geospatial-map") ||
    pathname?.startsWith("/mouza-map");

  useEffect(() => {
    if (isMapRoute) return;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Continue if storage is unavailable.
    }

    const controller = new AbortController();
    const payload = {
      consent: true,
      locationGranted: false,
      location: null,
      device: collectDevice(),
      page: window.location.pathname,
      referrer: document.referrer || "",
      source: "landbd-app-visit",
    };

    void fetch("/api/map-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [isMapRoute]);

  return null;
}
