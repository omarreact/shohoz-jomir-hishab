"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { Loader, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { lat, lng, zoom } = customEvent.detail;
      if (lat && lng && map) {
        map.flyTo([lat, lng], zoom || 18, { duration: 1.5 });
      }
    };
    window.addEventListener("fly-to-location", handleFlyTo);
    return () => window.removeEventListener("fly-to-location", handleFlyTo);
  }, [map]);

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
            (p) => (p.properties?.objectid || p.attributes?.objectid) === (initialData.properties?.objectid || initialData.attributes?.objectid),
          );
          return exists ? prev : [...prev, initialData];
        });
        setSelectedRsId(initialData.properties?.objectid || initialData.attributes?.objectid || null);
        if (initialData.geometry?.coordinates?.[0]?.[0] || initialData.geometry?.rings?.[0]?.[0]) {
          const coords = initialData.geometry.coordinates || initialData.geometry.rings;
          const [lng, lat] = coords[0][0];
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

  // Handle Smart Search Results
  useEffect(() => {
    const handleSearchResult = (e: Event) => {
      const customEvent = e as CustomEvent;
      const result = customEvent.detail;
      
      if (!result) return;
      
      if (result.type === "COORDINATE") {
        setClickedPos({ lat: result.data.lat, lng: result.data.lng });
        window.dispatchEvent(new CustomEvent("fly-to-location", { detail: { lat: result.data.lat, lng: result.data.lng, zoom: 18 } }));
      } else if (result.type === "RS_PLOT" || result.type === "MS_PLOT") {
        const plotData = result.data;
        const pAttrs = plotData.properties || plotData.attributes || {};
        
        setRsPolygons((prev) => {
          const exists = prev.find(
            (p) => {
              const prevAttrs = p.properties || p.attributes || {};
              return prevAttrs.OBJECTID === pAttrs.OBJECTID || prevAttrs.objectid === pAttrs.objectid;
            }
          );
          return exists ? prev : [...prev, plotData];
        });
        
        const objId = pAttrs.OBJECTID || pAttrs.objectid;
        setSelectedRsId(objId || null);
        
        const coords = plotData.geometry?.coordinates || plotData.geometry?.rings;
        if (coords?.[0]?.[0]) {
          const [lng, lat] = coords[0][0];
          setClickedPos({ lat, lng });
          setInferredData({
            rsData: plotData,
            landuseData: null,
            floodData: null,
          });
          window.dispatchEvent(new CustomEvent("fly-to-location", { detail: { lat, lng, zoom: 18 } }));
        }
      }
    };
    
    window.addEventListener("smart-search-result", handleSearchResult);
    return () => window.removeEventListener("smart-search-result", handleSearchResult);
  }, [setClickedPos, setInferredData, setSelectedRsId]);



  const position: [number, number] = [23.7937, 90.4066];
  const defaultZoom = 13;

  useEffect(() => {
    fetch("/api/auth/status")
      .then(res => res.json())
      .then(data => {
        if (!data.hasToken || data.status === "TOKEN_INVALID" || data.status === "PRIVATE_UNAVAILABLE") {
          toast.warning("প্রাইভেট ডেটার টোকেন বৈধ নয়।", {
            description: "বর্তমানে পাবলিক ডেটা প্রদর্শন করা হচ্ছে।",
            duration: 10000,
          });
        }
      })
      .catch(console.error);
  }, []);

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
