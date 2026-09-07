"use client";

import { useEffect, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";

type Props = {
  layerId: number;
  where?: string;
  outFields?: string;
};

type Feature = {
  type: "Feature";
  properties?: Record<string, unknown>;
};

type FeatureCollection = GeoJsonObject & {
  type: "FeatureCollection";
  features: Feature[];
};

function popupHtml(properties: Record<string, unknown> = {}) {
  const mauza = properties.unique_mauza_thana_dist;
  const safe = (value: unknown) => String(value ?? "—").replace(/[&<>\"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  const entries = Object.entries(properties).slice(0, 12);
  return `<div><strong>RAJUK Plot</strong>${mauza ? `<div><b>Mauza/Thana/District:</b> ${safe(mauza)}</div>` : ""}${entries.map(([k, v]) => `<div><b>${safe(k)}:</b> ${safe(v)}</div>`).join("")}</div>`;
}

export default function RajukProxyGeoJsonMap({ layerId, where = "1=1", outFields = "*" }: Props) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ where, outFields, resultRecordCount: "2000" });
    fetch(`/api/rajuk/${layerId}?${params}`, { signal: controller.signal })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "RAJUK layer request failed");
        return body as FeatureCollection;
      })
      .then(setData)
      .catch(e => { if (e?.name !== "AbortError") setError(e instanceof Error ? e.message : "RAJUK layer request failed"); });
    return () => controller.abort();
  }, [layerId, outFields, where]);

  if (error) return <div role="alert">{error}</div>;
  if (!data) return <div>Loading RAJUK layer…</div>;

  return <MapContainer center={[23.8103, 90.4125]} zoom={11} style={{ height: "100%", minHeight: 500, width: "100%" }}>
    <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    <GeoJSON
      data={data}
      style={() => ({ color: "#006a4e", weight: 1, fillOpacity: 0.12 })}
      onEachFeature={(feature, layer) => layer.bindPopup(popupHtml(feature.properties))}
    />
  </MapContainer>;
}
