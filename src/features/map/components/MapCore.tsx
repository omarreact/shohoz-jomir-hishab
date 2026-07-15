"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { Loader, Maximize2, Minimize2 } from "lucide-react";

import { ViewportPolygonFetcher } from "./ViewportPolygonFetcher";
import { InitialViewSetter } from "./InitialViewSetter";
import { LayerManager } from "./LayerManager";
import { useMapIntelligence } from "../hooks/useMapIntelligence";
import { MapService } from "../services/mapService";
import { useMapEngine } from "../providers/MapProvider";
import { useToolbar } from "../providers/ToolbarProvider";
import { useMap } from "react-leaflet";
import { MapControlsGroup } from "./controls/MapControlsGroup";
import { BottomStatusBar } from "./controls/BottomStatusBar";

function MapEngineBootstrapper() {
  const map = useMap();
  const { setMap } = useMapEngine();
  
  useEffect(() => {
    if (map) {
      setMap(map);
    }
  }, [map, setMap]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapCore({
  initialData,
}: {
  initialData?: any;
}) {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    clickedPos,
    isInferring,
    elevation,
    inferredData,
    selectedRsId,
    setClickedPos,
    setSelectedRsId,
    setInferredData,
    handleMapClick,
    clearIntelligence
  } = useMapIntelligence();

  const [rsPolygons, setRsPolygons] = useState<any[]>(
    Array.isArray(initialData)
      ? initialData
      : initialData?.geometry
        ? [initialData]
        : [],
  );

  useEffect(() => {
    if (initialData) {
      if (Array.isArray(initialData)) {
        setRsPolygons(initialData);
        setSelectedRsId(null);
      } else {
        setRsPolygons((prev) => {
          const exists = prev.find(
            (p) => p.attributes?.objectid === initialData.objectid,
          );
          return exists ? prev : [...prev, initialData];
        });
        setSelectedRsId(initialData.objectid || null);
        if (initialData.geometry?.rings?.[0]?.[0]) {
          const [lng, lat] = initialData.geometry.rings[0][0];
          setClickedPos({ lat, lng });
          setInferredData({
            rsData: initialData,
            landuseData: null,
            floodData: null,
          });
        }
      }
    }
  }, [initialData, setClickedPos, setInferredData, setSelectedRsId]);



  const position: [number, number] = [23.7937, 90.4066];
  const defaultZoom = 13;

  useEffect(() => {
    MapService.fetchRajukToken()
      .then((token) => {
        setToken(token);
        setLoading(false);
      })
      .catch(() => {
        setError("ম্যাপ লোড করতে সমস্যা হচ্ছে। রাজউক সার্ভার সংযোগ বিচ্ছিন্ন।");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center w-100 h-100 bg-light"
        style={{ minHeight: "80vh" }}
      >
        <Loader
          className="spinner-border text-success mb-3"
          style={{ width: "3rem", height: "3rem" }}
        />
        <h5 className="text-secondary fw-bold">
          সার্ভার থেকে টোকেন সংগ্রহ করা হচ্ছে...
        </h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center m-4 p-5 rounded-4 border-0 shadow-sm">
        <h4 className="fw-bold mb-3">{error}</h4>
        <p className="mb-0">দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#1e293b" }}>
      <div
        className="position-absolute rounded-3 shadow px-3 py-2 d-flex align-items-center gap-3"
        style={{
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span className="text-white small fw-bold d-flex align-items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 4,
              background: "#ef4444",
              borderRadius: 2,
            }}
          />
          MS মৌজা (টাইল)
        </span>
        <span className="text-white small fw-bold d-flex align-items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 4,
              background: "#3b82f6",
              borderRadius: 2,
            }}
          />
          RS প্লট (ভেক্টর)
        </span>
        <span className="text-white small fw-bold d-flex align-items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              background: "#22c55e",
              borderRadius: 2,
              border: "2px solid #16a34a",
            }}
          />
          নির্বাচিত RS প্লট
        </span>
      </div>



      <MapContainer
        center={position}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapControlsGroup />
        <BottomStatusBar />
        <MapEngineBootstrapper />
        <MapClickHandler onMapClick={handleMapClick} />
        <ViewportPolygonFetcher onPolygonsLoaded={setRsPolygons} />
        <InitialViewSetter initialData={initialData} />

        {clickedPos && (
          <Marker position={[clickedPos.lat, clickedPos.lng]} />
        )}

        <LayerManager
          token={token}
          rsPolygons={rsPolygons}
          selectedRsId={selectedRsId}
        />
      </MapContainer>


    </div>
  );
}
