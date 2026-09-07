"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { Marker, type Map as MapLibreInstance } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { createAccuracyPolygon, updateSourceData } from "@/src/features/geospatial-map/maplibre/mapUtils";
import { VECTOR_SOURCES } from "@/src/features/geospatial-map/maplibre/types";

type Props = {
  mapRef: MutableRefObject<MapLibreInstance | null>;
  mapReady: boolean;
  notify: (message: string) => void;
};

type OrientationEventWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type OrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
}

function markerElement(): { root: HTMLDivElement; arrow: HTMLDivElement } {
  const root = document.createElement("div");
  root.setAttribute("aria-label", "বর্তমান অবস্থান");
  root.style.width = "38px";
  root.style.height = "38px";
  root.style.borderRadius = "9999px";
  root.style.background = "rgba(0, 106, 78, 0.16)";
  root.style.border = "2px solid rgba(255,255,255,0.95)";
  root.style.boxShadow = "0 4px 18px rgba(2, 16, 10, 0.30)";
  root.style.display = "grid";
  root.style.placeItems = "center";
  root.style.pointerEvents = "none";

  const arrow = document.createElement("div");
  arrow.style.width = "0";
  arrow.style.height = "0";
  arrow.style.borderLeft = "8px solid transparent";
  arrow.style.borderRight = "8px solid transparent";
  arrow.style.borderBottom = "22px solid #006a4e";
  arrow.style.transformOrigin = "50% 55%";
  arrow.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.28))";
  arrow.style.transition = "transform 160ms linear";
  root.appendChild(arrow);

  return { root, arrow };
}

export function useLiveLocationTracking({ mapRef, mapReady, notify }: Props) {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [locating, setLocating] = useState(false);
  const markerRef = useRef<Marker | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const headingRef = useRef(0);
  const flyOnNextFixRef = useRef(false);

  const rotateMarker = useCallback((heading: number) => {
    headingRef.current = normalizeHeading(heading);
    if (arrowRef.current) {
      arrowRef.current.style.transform = `rotate(${headingRef.current}deg)`;
    }
  }, []);

  const requestOrientationPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent === "undefined") return;
    const OrientationEvent = DeviceOrientationEvent as OrientationEventConstructorWithPermission;
    if (typeof OrientationEvent.requestPermission !== "function") return;
    try {
      await OrientationEvent.requestPermission();
    } catch {
      // Orientation permission is optional; geolocation tracking still works.
    }
  }, []);

  const jumpToCurrentLocation = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!navigator.geolocation) {
      notify("এই ডিভাইসে অবস্থান সেবা পাওয়া যাচ্ছে না");
      return;
    }

    void requestOrientationPermission();
    flyOnNextFixRef.current = true;
    setLocating(true);
    setTrackingEnabled(true);

    const current = lastPositionRef.current;
    if (current) {
      map.flyTo({
        center: [current.coords.longitude, current.coords.latitude],
        zoom: Math.max(map.getZoom(), 17),
        duration: 700,
      });
      flyOnNextFixRef.current = false;
      setLocating(false);
    }
  }, [mapReady, mapRef, notify, requestOrientationPermission]);

  useEffect(() => {
    if (!trackingEnabled || !mapReady || !mapRef.current || !navigator.geolocation) return;
    const map = mapRef.current;

    if (!markerRef.current) {
      const { root, arrow } = markerElement();
      arrowRef.current = arrow;
      markerRef.current = new Marker({ element: root, anchor: "center", rotationAlignment: "map" });
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!mapRef.current) return;
        lastPositionRef.current = position;
        const { latitude, longitude, accuracy, heading } = position.coords;

        markerRef.current?.setLngLat([longitude, latitude]).addTo(mapRef.current);
        updateSourceData(
          mapRef.current,
          VECTOR_SOURCES.accuracy,
          createAccuracyPolygon(latitude, longitude, accuracy) as FeatureCollection<Geometry>,
        );

        if (typeof heading === "number" && Number.isFinite(heading) && heading >= 0) {
          rotateMarker(heading);
        }

        if (flyOnNextFixRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: Math.max(mapRef.current.getZoom(), 17),
            duration: 700,
          });
          flyOnNextFixRef.current = false;
        }
        setLocating(false);
      },
      (error) => {
        console.error("Live geolocation failed", error);
        setLocating(false);
        notify(error.message || "অবস্থান নির্ণয় করা যায়নি");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1500,
        timeout: 20_000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [mapReady, mapRef, notify, rotateMarker, trackingEnabled]);

  useEffect(() => {
    if (!trackingEnabled || typeof window === "undefined") return;

    const handleOrientation = (event: Event) => {
      const orientation = event as OrientationEventWithCompass;
      const iosHeading = orientation.webkitCompassHeading;
      if (typeof iosHeading === "number" && Number.isFinite(iosHeading)) {
        rotateMarker(iosHeading);
        return;
      }

      if (typeof orientation.alpha === "number" && Number.isFinite(orientation.alpha)) {
        // alpha rotates clockwise from the device reference frame; convert to compass bearing.
        rotateMarker(360 - orientation.alpha);
      }
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation, true);
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [rotateMarker, trackingEnabled]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      arrowRef.current = null;
    };
  }, []);

  return {
    jumpToCurrentLocation,
    locating,
    trackingEnabled,
  };
}
