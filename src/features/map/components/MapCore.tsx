"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { Loader, Maximize2, Minimize2, BrainCircuit, MapPin, Waves, Info, X, Layers } from "lucide-react";
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
  const { isFullscreen, setIsFullscreen } = useToolbar();
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [setIsFullscreen]);


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
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
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
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", background: "#1e293b" }}>
      {/* ── Fullscreen Button ──────────────────────────────────────── */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "ছোট করুন" : "পূর্ণ স্ক্রিনে দেখুন"}
        className="absolute flex items-center gap-2 rounded-lg border border-white/15 shadow-md font-bold transition-colors z-[1000] text-white bg-slate-900/85 backdrop-blur-md px-3.5 py-2 text-[13px] right-4 top-4 md:right-[60px] md:top-5 hover:bg-slate-800/90"
      >
        {isFullscreen ? (
          <><Minimize2 size={15} /> <span className="hidden sm:inline">সাধারণ দৃশ্য</span></>
        ) : (
          <><Maximize2 size={15} /> <span className="hidden sm:inline">পূর্ণ স্ক্রিন</span></>
        )}
      </button>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-16 md:bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-lg shadow-md px-3 py-2 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-[90%] md:w-auto text-xs sm:text-sm"
      >
        <span className="text-white font-bold flex items-center gap-2">
          <span className="inline-block w-7 h-1 bg-red-500 rounded-sm" />
          MS মৌজা (টাইল)
        </span>
        <span className="text-white font-bold flex items-center gap-2">
          <span className="inline-block w-7 h-1 bg-blue-500 rounded-sm" />
          RS প্লট (ভেক্টর)
        </span>
        <span className="text-white font-bold flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 bg-green-500 rounded-sm border-2 border-green-600" />
          নির্বাচিত RS প্লট
        </span>
        <span className="text-white/60 flex items-center mt-1 md:mt-0">
          <Info size={12} className="mr-1" />
          জুম ≥ 15 তে RS ভেক্টর দেখাবে
        </span>
      </div>

      {/* ── Intelligence Panel ──────────────────────────────────────── */}
      {clickedPos && (
        <div
          className="absolute bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden z-[1000] flex flex-col border border-slate-200 dark:border-slate-800 top-[130px] md:top-[70px] right-4 w-[calc(100%-2rem)] sm:w-[340px] max-h-[calc(100%-150px)] md:max-h-[calc(100%-90px)]"
        >
          <div className="bg-slate-900 dark:bg-black text-white p-3 flex items-center justify-between">
            <span className="flex items-center font-bold">
              <BrainCircuit size={18} className="mr-2 text-yellow-500" />
              স্থান বিশ্লেষণ
            </span>
            <button
              className="bg-transparent border-none text-white/80 hover:text-white p-1 cursor-pointer transition-colors"
              onClick={() => {
                setClickedPos(null);
                clearIntelligence();
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 overflow-auto flex-grow">
            {/* Coordinates */}
            <div className="mb-3">
              <div className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 w-full text-left py-2 px-3 rounded-md mb-2 flex items-center text-sm">
                <MapPin size={14} className="mr-2 text-red-500 shrink-0" />
                <span className="truncate">
                  {clickedPos.lat.toFixed(6)}, {clickedPos.lng.toFixed(6)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 w-full text-left py-2 px-3 rounded-md flex items-center text-sm">
                <Layers size={14} className="mr-2 text-blue-500 shrink-0" />
                উচ্চতা:{" "}
                {elevation !== null ? (
                  <strong className="ml-1">{elevation} মিটার</strong>
                ) : (
                  <span
                    className="ml-2 w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"
                  />
                )}
              </div>
            </div>

            {isInferring ? (
              <div className="text-center py-6 text-emerald-600 dark:text-emerald-500">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-sm font-bold">GIS ডেটা বিশ্লেষণ চলছে...</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* RS Plot */}
                {inferredData.rsData && (
                  <div className="p-3 border border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-xs font-bold mb-1 text-blue-600 dark:text-blue-400">
                      🔵 RS দাগ (নীল পলিগন)
                    </div>
                    <div className="font-bold text-base text-slate-900 dark:text-white">
                      {inferredData.rsData.rs_plot_no || inferredData.rsData.plot_no || inferredData.rsData.properties?.rs_plot_no || inferredData.rsData.properties?.plot_no}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{inferredData.rsData.address_search || inferredData.rsData.properties?.address_search}</div>
                  </div>
                )}

                {/* Landuse */}
                {inferredData.landuseData && (
                  <div className="p-3 border border-emerald-500/30 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">ড্যাপ ভূমি ব্যবহার</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">
                      {inferredData.landuseData.Landuse || inferredData.landuseData.LANDUSE || inferredData.landuseData.properties?.Landuse || inferredData.landuseData.properties?.LANDUSE}
                    </div>
                    {(inferredData.landuseData.zone || inferredData.landuseData.properties?.zone) && (
                      <div className="text-xs mt-1 text-slate-600 dark:text-slate-300">জোন: {inferredData.landuseData.zone || inferredData.landuseData.properties?.zone}</div>
                    )}
                    {(inferredData.landuseData.maximum_he || inferredData.landuseData.properties?.maximum_he) && (
                      <div className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                        সর্বোচ্চ উচ্চতা: {inferredData.landuseData.maximum_he || inferredData.landuseData.properties?.maximum_he}
                      </div>
                    )}
                  </div>
                )}

                {/* Flood */}
                {inferredData.floodData && (
                  <div className="p-3 border border-red-500/30 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center mb-1">
                      <Waves size={14} className="mr-1.5" /> বন্যা প্লাবন এলাকা
                    </div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">
                      এই জমিটি জলাশয় বা প্লাবন জোনের আওতাভুক্ত।
                    </div>
                  </div>
                )}

                {!inferredData.rsData && !inferredData.landuseData && !inferredData.floodData && (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    এই স্থানে কোনো ড্যাপ ডেটা পাওয়া যায়নি।
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
