"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  useMap,
  Tooltip,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { buildRajukTileProxyUrl } from "@/lib/api/rajukTiles";

// Helper to center the map on the polygon
function MapFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions);
    }
  }, [map, positions]);
  return null;
}

interface DapMiniMapContentProps {
  plotData: any;
}

export default function DapMiniMapContent({
  plotData,
}: DapMiniMapContentProps) {
  const [polygonCoords, setPolygonCoords] = useState<[number, number][] | null>(
    null,
  );
  const [token, setToken] = useState("");

  useEffect(() => {
    // Attempt to parse geometry from the plot data
    if (plotData?.geometry?.rings && plotData.geometry.rings.length > 0) {
      const ring = plotData.geometry.rings[0];
      const coords = ring.map(
        (point: number[]) => [point[1], point[0]] as [number, number],
      );
      setPolygonCoords(coords);
    }

    // Fetch the active token from our proxy
    fetch("/api/rajuk-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        }
      })
      .catch((err) => console.error("Failed to fetch map token", err));
  }, [plotData]);

  if (!polygonCoords) {
    return (
      <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
        ম্যাপ ডেটা উপলব্ধ নয়
      </div>
    );
  }

  const plotLabel = plotData?.rs_plot_no || plotData?.plot_no || "RS দাগ";
  const isMS =
    plotData?.plot_type_custom === "MS দাগ" ||
    plotData?.plot_type === "ms_plot_no";

  const getTileUrl = (servicePath: string) => {
    const url = buildRajukTileProxyUrl(servicePath, {
      z: "{z}",
      y: "{y}",
      x: "{x}",
      token,
    });
    return decodeURIComponent(url);
  };

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
          <LayersControl.BaseLayer checked name="Satellite (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street Map (OSM)">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
          </LayersControl.BaseLayer>

          {/* RAJUK Overlays (Only render if we have a token) */}
          {token && (
            <>
              <LayersControl.Overlay checked={isMS} name="MS Mauza (Rajuk)">
                <TileLayer
                  url={getTileUrl("Hosted/MS_Mauza_Tiles_Final")}
                  opacity={0.8}
                />
              </LayersControl.Overlay>

              <LayersControl.Overlay checked={!isMS} name="RS Mauza (Rajuk)">
                <TileLayer
                  url={getTileUrl("Hosted/RS_Mauza_Tiles_Final")}
                  opacity={0.8}
                />
              </LayersControl.Overlay>

              <LayersControl.Overlay checked name="Overlay Boundary Tiles">
                <TileLayer
                  url={getTileUrl("Hosted/Overlay_Boundary_Tiles")}
                  opacity={1.0}
                />
              </LayersControl.Overlay>

              <LayersControl.Overlay name="RS Mauza 282 Scale">
                <TileLayer
                  url={getTileUrl("Hosted/RS_Mauza_282Scale")}
                  opacity={0.8}
                />
              </LayersControl.Overlay>

              <LayersControl.Overlay name="DAP Proposed Landuse">
                <TileLayer
                  url={getTileUrl("Hosted/DAP_proposed_landuse")}
                  opacity={0.6}
                />
              </LayersControl.Overlay>

              <LayersControl.Overlay name="Transport Network">
                <TileLayer
                  url={getTileUrl("Hosted/Transport_Network_Tiles")}
                  opacity={0.9}
                />
              </LayersControl.Overlay>
            </>
          )}
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
