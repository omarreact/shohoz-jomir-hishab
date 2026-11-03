"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RajukPlotFeature } from "@/src/types/rajuk-runtime";
import { FREE_IMAGERY_OPTIONS } from "@/src/features/geospatial-map/maplibre/mapConstants";
import { BASEMAP_SOURCE_DEFINITIONS, type BasemapKey } from "@/src/features/geospatial-map/maplibre/types";

type BaseLayer = "street" | BasemapKey;

function escapeHtml(value: unknown): string {
  const replacements: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return String(value ?? "").replace(/[&<>"']/g, (char) => replacements[char] ?? char);
}


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
  return n ? { lng: sumLng / n, lat: sumLat / n } : null;
}

function googleMapsUrl(feature: RajukPlotFeature): string | null {
  const c = ringCentroid(feature.geometry.rings);
  if (!c) return null;
  return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
}

function plotLabel(a: Record<string, unknown>, isMs: boolean): string {
  if (a.rs_plot_no) {
    const v = String(a.rs_plot_no);
    return v.toUpperCase().startsWith("RS") ? v : `RS-${v}`;
  }
  if (a.ms_plot_no) {
    const v = String(a.ms_plot_no);
    return v.toUpperCase().startsWith("MS") ? v : `MS-${v}`;
  }
  if (isMs) return `MS-${a.plot_no ?? ""}`;
  return `RS-${a.plot_no ?? ""}`;
}

/** Map showing every returned plot boundary, with the selected plot emphasized. */
export default function PlotMap({
  feature,
  features = [],
}: {
  feature: RajukPlotFeature;
  features?: RajukPlotFeature[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const layersRef = useRef<Record<string, any>>({});
  const [base, setBase] = useState<BaseLayer>("satellite");
  const [showRs, setShowRs] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [ready, setReady] = useState(false);
  const allFeatures = useMemo(
    () => (features.length ? features : [feature]),
    [features, feature],
  );
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
      const street = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "&copy; OSM &copy; CARTO", subdomains: "abcd", maxZoom: 21 },
      );
      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 21 },
      );
      const historicalLayers = Object.fromEntries(
        FREE_IMAGERY_OPTIONS.map((option) => {
          const source = BASEMAP_SOURCE_DEFINITIONS[option.key];
          return [option.key, L.tileLayer(source.tiles?.[0] || "", {
            attribution: source.attribution || option.label,
            maxNativeZoom: source.maxzoom ?? 9,
            maxZoom: 21,
          })];
        }),
      );
      const rsOverlay = L.tileLayer("/api/rajuk/tile/rs/{z}/{y}/{x}", {
        attribution: "&copy; RAJUK RS",
        maxZoom: 21,
        opacity: 0.45,
        errorTileUrl:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      });
      const msOverlay = L.tileLayer("/api/rajuk/tile/ms/{z}/{y}/{x}", {
        attribution: "&copy; RAJUK MS",
        maxZoom: 21,
        opacity: 0.45,
        errorTileUrl:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      });
      const boundaries = L.featureGroup().addTo(map);
      const selectedLayer = L.geoJSON(null, {
        style: { color: "#006a4e", weight: 4, fillColor: "#22c55e", fillOpacity: 0.28 },
      }).addTo(map);
      const labels = L.layerGroup().addTo(map);
      layersRef.current = {
        street,
        satellite,
        ...historicalLayers,
        rsOverlay,
        msOverlay,
        boundaries,
        selectedLayer,
        labels,
      };
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
    if (!map || !ready) return;
    const baseKeys: BaseLayer[] = ["street", "satellite", ...FREE_IMAGERY_OPTIONS.map((option) => option.key)];
    for (const key of baseKeys) {
      const layer = layersRef.current[key];
      if (!layer) continue;
      if (key === base && !map.hasLayer(layer)) layer.addTo(map);
      if (key !== base && map.hasLayer(layer)) map.removeLayer(layer);
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
    const { boundaries, selectedLayer, labels } = layersRef.current;
    if (!map || !boundaries || !selectedLayer || !ready) return;
    boundaries.clearLayers();
    selectedLayer.clearLayers();
    if (labels) labels.clearLayers();

    import("leaflet").then(({ default: L }) => {
      if (!leafletRef.current) return;
      boundaries.clearLayers();
      selectedLayer.clearLayers();
      if (labels) labels.clearLayers();

      for (const f of allFeatures) {
        if (!f?.geometry?.rings?.length) continue;
        const geojson: any = {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: f.geometry.rings },
          properties: f.attributes || {},
        };
        const a = f.attributes as Record<string, unknown>;
        const isSelected = f === feature;
        const target = isSelected ? selectedLayer : boundaries;
        const isMs =
          a._layer_source === "ms" ||
          a.plot_kind === "ms" ||
          Boolean(a.ms_plot_no && !a.rs_plot_no);
        const style = isSelected
          ? { color: "#006a4e", weight: 4, fillColor: "#22c55e", fillOpacity: 0.28 }
          : isMs
            ? { color: "#7c3aed", weight: 2.5, fillColor: "#a78bfa", fillOpacity: 0.22 }
            : { color: "#f59e0b", weight: 2, fillColor: "#fbbf24", fillOpacity: 0.08 };
        const item = L.geoJSON(geojson, { style }).addTo(target);
        const label = plotLabel(a, isMs);
        item.bindPopup(
          `<strong>${escapeHtml(label)}</strong><br/>${escapeHtml(a.address_search)}`,
        );

        const c = ringCentroid(f.geometry.rings);
        if (c && labels) {
          const bg = isSelected
            ? "#047857"
            : isMs
              ? "#6d28d9"
              : "#b45309";
          const icon = L.divIcon({
            className: "",
            html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;font-size:10px;font-weight:700;line-height:1;padding:2px 5px;border-radius:4px;color:#fff;background:${bg};box-shadow:0 1px 3px rgba(0,0,0,.4)">${escapeHtml(label)}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });
          L.marker([c.lat, c.lng], { icon, interactive: false }).addTo(labels);
        }
      }

      const selectedBounds = selectedLayer.getBounds();
      const allBounds = boundaries.getBounds();
      if (selectedBounds.isValid()) {
        map.fitBounds(selectedBounds, { padding: [36, 36], maxZoom: 19 });
      } else if (allBounds.isValid()) {
        map.fitBounds(allBounds, { padding: [36, 36], maxZoom: 18 });
      }
    });
  }, [allFeatures, feature, ready]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-[#e2e8df] bg-[#f5f7f2] p-1 text-[11px] font-bold">
          {([
            {key:"satellite" as const,label:"স্যাটেলাইট"},
            {key:"street" as const,label:"রাস্তা"},
            ...FREE_IMAGERY_OPTIONS.map((option)=>({key:option.key,label:option.label})),
          ]).map((option)=>(
            <button key={option.key} type="button" aria-pressed={base===option.key} onClick={()=>setBase(option.key)}
              className={["min-h-10 shrink-0 rounded-xl px-3 transition",base===option.key?"bg-[#1d5960] text-white":"text-[#5e766e] hover:bg-white"].join(" ")}>
              {option.label}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800">
          <input
            type="checkbox"
            checked={showRs}
            onChange={(e) => setShowRs(e.target.checked)}
          />{" "}
          RS Mauza tiles
        </label>
        <label className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800">
          <input
            type="checkbox"
            checked={showMs}
            onChange={(e) => setShowMs(e.target.checked)}
          />{" "}
          MS Mauza tiles
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
        className="h-[350px] w-full overflow-hidden rounded-2xl border border-[#cfded2] bg-[#e6eee8] md:h-[440px]"
        aria-label="Plot boundaries map"
      />
      <p className="text-[11px] leading-5 text-[#697f76]">
        RS/MS দাগ RAJUK ফিচার সার্ভিস থেকে; ঐতিহাসিক MODIS খুব কম বিস্তারিত দেয়। উপরে জরিপ স্তর চালু/বন্ধ করুন। মূল জরিপ নথি যাচাই করুন।
      </p>
    </div>
  );
}
