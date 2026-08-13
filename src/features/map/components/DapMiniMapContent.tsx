"use client";

import React from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { usePolygonGeometry } from "@/src/features/map/hooks/usePolygonGeometry";
import { useRajukToken } from "@/src/features/map/hooks/useRajukToken";
import { RajukTileLayers } from "@/src/features/map/components/RajukTileLayers";
import { MapFitter } from "@/src/features/map/components/MapFitter";

interface DapMiniMapContentProps {
  plotData: any;
}

// Base Maps configuration
const baseMaps = {
  satellite: {
    name: "Satellite (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri",
  },
  street: {
    name: "Street Map (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap",
  },
};

/**
 * Displays a Leaflet map with:
 * - Polygon overlay of the plot geometry
 * - Rajuk tile layers (MS, RS, Boundary, etc.)
 * - Plot label tooltip
 */
export default function DapMiniMapContent({
  plotData,
}: DapMiniMapContentProps) {
  const polygonCoords = usePolygonGeometry(plotData);
  const { token } = useRajukToken();

  const plotLabel = plotData?.rs_plot_no || plotData?.plot_no || "RS দাগ";
  const isMS =
    plotData?.plot_type_custom === "MS দাগ" ||
    plotData?.plot_type === "ms_plot_no";

  if (!polygonCoords) {
    return (
      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
        ম্যাপ ডেটা উপলব্ধ নয়
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", minHeight: "300px" }}>
      <MapContainer
        center={polygonCoords[0]}
        zoom={17}
        scrollWheelZoom={false}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "0.5rem",
          zIndex: 0,
        }}
        attributionControl={false}
      >
        <LayersControl position="topright">
          {/* Base Maps */}
          <LayersControl.BaseLayer checked name={baseMaps.satellite.name}>
            <TileLayer
              url={baseMaps.satellite.url}
              attribution={baseMaps.satellite.attribution}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={baseMaps.street.name}>
            <TileLayer
              url={baseMaps.street.url}
              attribution={baseMaps.street.attribution}
            />
          </LayersControl.BaseLayer>

          {/* RAJUK Overlays */}
          <RajukTileLayers token={token} isMS={isMS} />
        </LayersControl>

        {/* The Plot Polygon with Label */}
        <Polygon
          positions={polygonCoords}
          pathOptions={{
            color: "red",
            fillColor: "#ff0000",
            fillOpacity: 0.2,
            weight: 3,
          }}
        >
          <Tooltip
            direction="center"
            permanent
            className="bg-transparent border-0 shadow-none text-danger fw-bolder fs-5 label-text-shadow"
          >
            {plotLabel}
          </Tooltip>
        </Polygon>

        <MapFitter positions={polygonCoords} />
      </MapContainer>
    </div>
  );
}
