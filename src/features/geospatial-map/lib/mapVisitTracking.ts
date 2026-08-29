const VISITOR_KEY = "landbd_map_visitor_id";

export type DeviceInfo = Record<string, string | number | boolean | null>;

export function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") return {};

  const nav = window.navigator;
  const screen = window.screen;

  return {
    language: nav.language || null,
    languages: nav.languages?.slice(0, 8).join(",") || null,
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
    pixelRatio: window.devicePixelRatio ?? null,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    timezoneOffsetMin: new Date().getTimezoneOffset(),
  };
}

export function getPosition(): Promise<GeolocationCoordinates | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 12_000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve(position.coords);
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );
  });
}

export async function saveVisit(location: GeolocationCoordinates | null): Promise<void> {
  const response = await fetch("/api/map-visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId: getVisitorId(),
      consent: true,
      locationGranted: Boolean(location),
      location: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: location.altitude,
            heading: location.heading,
            speed: location.speed,
          }
        : null,
      device: collectDeviceInfo(),
      page: window.location.pathname,
      referrer: document.referrer,
    }),
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`map-visits ${response.status}`);
  }
}

export const MAP_VISIT_CONSENT_KEY = "landbd_map_visit_consent_v3";
