"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import type { Map as LeafletMap, Circle, CircleMarker } from "leaflet";
import styles from "./GeospatialMap.module.css";

type LeafletNS = any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function loadLeaflet(): Promise<LeafletNS> {
  const mod = await import("leaflet");
  const L = (mod as { default?: LeafletNS }).default ?? mod;
  if (!L || typeof L.map !== "function") throw new Error("Leaflet failed to load");
  return L;
}

const DAP_BOUNDS: [[number, number], [number, number]] = [
  [23.5527, 90.2079],
  [24.1033, 90.6041],
];

export default function GeospatialMap() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const locationMarkerRef = useRef<CircleMarker | null>(null);
  const accuracyCircleRef = useRef<Circle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState("");
  const [initError, setInitError] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4000);
  }, []);

  const clearLocationLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (locationMarkerRef.current) {
      map.removeLayer(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }
  }, []);

  const centerOn = useCallback(
    async (lat: number, lng: number, accuracy: number, attempt = 0) => {
      const map = mapRef.current;
      if (!map) {
        if (attempt < 40) window.setTimeout(() => void centerOn(lat, lng, accuracy, attempt + 1), 200);
        return;
      }
      try {
        const L = await loadLeaflet();
        clearLocationLayers();
        map.flyTo([lat, lng], Math.max(map.getZoom(), 17), { animate: true, duration: 1.2 });
        const marker = L.circleMarker([lat, lng], {
          radius: 9,
          color: "#006a4e",
          weight: 3,
          fillColor: "#22c55e",
          fillOpacity: 0.9,
        }).addTo(map);
        marker.bindPopup(`<strong>আপনার অবস্থান</strong><br/>±${Math.round(accuracy)} মিটার`).openPopup();
        locationMarkerRef.current = marker;
        const circle = L.circle([lat, lng], {
          radius: Math.max(accuracy, 15),
          color: "#006a4e",
          weight: 1,
          fillColor: "#22c55e",
          fillOpacity: 0.12,
        }).addTo(map);
        accuracyCircleRef.current = circle;
        try {
          sessionStorage.removeItem("landbd_pending_user_location");
        } catch {
          /* ignore */
        }
        notify("আপনার বর্তমান অবস্থানে নিয়ে যাওয়া হয়েছে");
      } catch {
        /* ignore */
      }
    },
    [clearLocationLayers, notify],
  );

  useEffect(() => {
    let disposed = false;
    const init = async () => {
      if (!mapElement.current || mapRef.current) return;
      try {
        const L = await loadLeaflet();
        try {
          await import("leaflet/dist/leaflet.css");
        } catch {
          /* optional */
        }
        if (disposed || !mapElement.current) return;
        const el = mapElement.current;
        if ((el as any)._leaflet_id) {
          el.innerHTML = "";
          delete (el as any)._leaflet_id;
        }
        const map = L.map(el, { zoomControl: true, minZoom: 8, maxZoom: 21 });
        map.fitBounds(DAP_BOUNDS, { padding: [25, 25] });
        mapRef.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 21,
        }).addTo(map);
        L.tileLayer("/api/rajuk/tile/rs/{z}/{y}/{x}", { maxZoom: 21, opacity: 1 }).addTo(map);
        L.tileLayer("/api/rajuk/tile/ms/{z}/{y}/{x}", { maxZoom: 21, opacity: 1 }).addTo(map);
        map.on("click", async (event: { latlng: { lat: number; lng: number } }) => {
          try {
            const response = await fetch(
              `/api/rajuk/query?action=identify&lat=${event.latlng.lat}&lng=${event.latlng.lng}`,
            );
            const data = await response.json();
            const n = Array.isArray(data.features) ? data.features.length : 0;
            notify(n ? `${n} টি প্লট পাওয়া গেছে` : "এই অবস্থানে প্লট নেই");
          } catch {
            notify("Identify ব্যর্থ");
          }
        });
        if (!disposed) {
          setInitError(null);
          setMapReady(true);
        }
      } catch (error) {
        if (!disposed) setInitError(error instanceof Error ? error.message : "ম্যাপ লোড ব্যর্থ");
      }
    };
    void init();
    return () => {
      disposed = true;
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onUserLocation = (ev: Event) => {
      const detail = (ev as CustomEvent<{ lat?: number; lng?: number; accuracy?: number }>).detail;
      const lat = Number(detail?.lat);
      const lng = Number(detail?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      void centerOn(lat, lng, Number(detail?.accuracy) || 30);
    };
    try {
      const raw = sessionStorage.getItem("landbd_pending_user_location");
      if (raw) {
        const p = JSON.parse(raw) as { lat?: number; lng?: number; accuracy?: number; t?: number };
        if (
          Number.isFinite(Number(p.lat)) &&
          Number.isFinite(Number(p.lng)) &&
          (!p.t || Date.now() - Number(p.t) < 120_000)
        ) {
          void centerOn(Number(p.lat), Number(p.lng), Number(p.accuracy) || 30);
        }
      }
    } catch {
      /* ignore */
    }
    window.addEventListener("landbd:user-location", onUserLocation);
    return () => window.removeEventListener("landbd:user-location", onUserLocation);
  }, [centerOn]);

  const goToMyLocation = useCallback(() => {
    if (!mapRef.current) {
      notify("ম্যাপ এখনো প্রস্তুত নয়");
      return;
    }
    if (!navigator.geolocation) {
      notify("এই ডিভাইসে লোকেশন সাপোর্ট নেই");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        void centerOn(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 30);
      },
      () => {
        setLocating(false);
        notify("লোকেশন পাওয়া যায়নি");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }, [centerOn, notify]);

  if (initError) {
    return (
      <div className={styles.mapShell} style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <p style={{ fontWeight: 700 }}>{initError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  return (
    <section className={styles.mapShell} aria-label="নগর পরিকল্পনা মানচিত্র">
      <div ref={mapElement} className={styles.mapCanvas} />
      <button
        type="button"
        className={`${styles.locateButton} ${locating ? styles.locateButtonActive : ""}`}
        onClick={goToMyLocation}
        disabled={locating || !mapReady}
        title="বর্তমান অবস্থান"
        aria-label="বর্তমান অবস্থানে যান"
      >
        {locating ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
      </button>
      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </section>
  );
}
