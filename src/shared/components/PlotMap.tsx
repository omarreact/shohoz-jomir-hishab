"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";

type BaseLayer = "street" | "satellite";

function ringCentroid(rings: number[][][]): { lat: number; lng: number } | null {
  const ring = rings?.[0];
  if (!ring?.length) return null;
  let sumLng = 0;
  let sumLat = 0;
  let n = 0;
  for (const pt of ring) {
    if (pt.length < 2) continue;
    sumLng += pt[0];
    sumLat += pt[1];
    n += 1;
  }
  if (!n) return null;
  return { lng: sumLng / n, lat: sumLat / n };
}

function googleMapsUrl(feature: RajukPlotFeature): string | null {
  const c = ringCentroid(feature.geometry.rings);
  if (!c) return null;
  const label = encodeURIComponent(
    String(
      feature.attributes.rs_plot_no ||
        feature.attributes.ms_plot_no ||
        feature.attributes.plot_no ||
        "RAJUK plot",
    ),
  );
  return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}&query_place_id=${label}`;
}

/**
 * Map for selected plot. RAJUK tiles always go through /api/rajuk/tile (no browser→gov.bd).
 * Basemaps use multiple CDNs so restrictive WiFi that blocks one provider still works.
 */
export default function PlotMap({ feature }: { feature: RajukPlotFeature }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersRef = useRef<Record<string, any>>({});
  const [base, setBase] = useState<BaseLayer>("satellite");
  const [showRs, setShowRs] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [ready, setReady] = useState(false);

  const mapsLink = useMemo(() => googleMapsUrl(feature), [feature]);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    let disposed = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (disposed || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [23.8103, 90.4125],
        zoom: 16,
        minZoom: 8,
        maxZoom: 21,
        zoomControl: true,
      });
      leafletRef.current = map;

      // Carto (often reachable when OSM is filtered) + OSM fallback via errorTileUrl pattern
      const street = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 21,
      });

      // Esri imagery; if blocked, user can switch to Street
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          maxZoom: 21,
        },
      );

      // Always via our proxy — never hit masterplan.rajuk.gov.bd from the phone on WiFi
      const rsOverlay = L.tileLayer("/api/rajuk/tile/rs/{z}/{y}/{x}", {
        attribution: "&copy; RAJUK RS",
        maxZoom: 21,
        opacity: 0.75,
        errorTileUrl:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      });
      const msOverlay = L.tileLayer("/api/rajuk/tile/ms/{z}/{y}/{x}", {
        attribution: "&copy; RAJUK MS",
        maxZoom: 21,
        opacity: 0.75,
        errorTileUrl:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      });

      const highlight = L.geoJSON(null, {
        style: {
          color: "#006a4e",
          weight: 3,
          fillColor: "#22c55e",
          fillOpacity: 0.25,
        },
      }).addTo(map);

      layersRef.current = { street, satellite, rsOverlay, msOverlay, highlight };
      satellite.addTo(map);
      rsOverlay.addTo(map);
      msOverlay.addTo(map);
      setReady(true);
    };

    void init();
    return () => {
      disposed = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        layersRef.current = {};
      }
    };
  }, []);

  useEffect(() => {
    const map = leafletRef.current;
    const { street, satellite } = layersRef.current;
    if (!map || !street || !satellite) return;
    if (base === "satellite") {
      map.removeLayer(street);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
    } else {
      map.removeLayer(satellite);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [base, ready]);

  useEffect(() => {
    const map = leafletRef.current;
    const { rsOverlay, msOverlay } = layersRef.current;
    if (!map || !rsOverlay || !msOverlay) return;
    if (showRs) {
      if (!map.hasLayer(rsOverlay)) rsOverlay.addTo(map);
    } else if (map.hasLayer(rsOverlay)) map.removeLayer(rsOverlay);
    if (showMs) {
      if (!map.hasLayer(msOverlay)) msOverlay.addTo(map);
    } else if (map.hasLayer(msOverlay)) map.removeLayer(msOverlay);
  }, [showRs, showMs, ready]);

  useEffect(() => {
    const map = leafletRef.current;
    const { highlight } = layersRef.current;
    if (!map || !highlight || !feature?.geometry?.rings) return;

    highlight.clearLayers();
    const geojson = {
      type: "Feature" as const,
      geometry: { type: "Polygon" as const, coordinates: feature.geometry.rings },
      properties: feature.attributes || {},
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    highlight.addData(geojson as any);

    const a = feature.attributes;
    const title = [
      a.rs_plot_no != null && a.rs_plot_no !== "" ? `RS ${a.rs_plot_no}` : null,
      a.ms_plot_no != null && a.ms_plot_no !== "" ? `MS ${a.ms_plot_no}` : null,
      a.plot_no != null ? `Plot ${a.plot_no}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    highlight.eachLayer((layer: { bindPopup?: (html: string) => void }) => {
      layer.bindPopup?.(
        `<strong>${title || "RAJUK plot"}</strong><br/>${String(a.address_search || "")}`,
      );
    });

    const bounds = highlight.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 19 });
  }, [feature, ready]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border bg-white p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setBase("street")}
            className={`rounded-md px-3 py-1.5 ${base === "street" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            Street
          </button>
          <button
            type="button"
            onClick={() => setBase("satellite")}
            className={`rounded-md px-3 py-1.5 ${base === "satellite" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            Satellite
          </button>
        </div>

        <label className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium">
          <input type="checkbox" checked={showRs} onChange={(e) => setShowRs(e.target.checked)} />
          RS Mauza layer
        </label>
        <label className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium">
          <input type="checkbox" checked={showMs} onChange={(e) => setShowMs(e.target.checked)} />
          MS Mauza layer
        </label>

        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-[#006a4e] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            Open in Google Maps
          </a>
        )}
      </div>

      <div
        ref={mapRef}
        className="h-[360px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:h-[420px]"
        aria-label="Plot map with RS and MS layers"
      />

      <p className="text-xs text-slate-500">
        RAJUK tiles load via our server proxy (works on WiFi that blocks gov.bd). Switch Street if Satellite is
        blocked by your ISP.
      </p>
    </div>
  );
}
