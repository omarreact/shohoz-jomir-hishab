"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  useMapEvents,
  Marker,
  Popup,
  Polygon,
  Tooltip,
  FeatureGroup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import {
  Loader,
  MapPin,
  BrainCircuit,
  Waves,
  Layers,
  X,
  Info,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";
import { buildRajukTileProxyUrl } from "@/lib/api/rajukTiles";

const BASE_URL = "https://masterplan.rajuk.gov.bd/server/rest/services";

// ── Viewport RS Polygon Fetcher ──────────────────────────────────────
// Fires whenever map viewport changes and fetches RS polygons in view
function ViewportPolygonFetcher({
  onPolygonsLoaded,
}: {
  onPolygonsLoaded: (features: any[]) => void;
}) {
  const [isFetching, setIsFetching] = useState(false);

  const fetchInView = useCallback(
    async (map: any) => {
      const zoom = map.getZoom();
      if (isFetching) return;
      setIsFetching(true);
      try {
        const bounds = map.getBounds();
        const envelope = JSON.stringify({
          xmin: bounds.getWest(),
          ymin: bounds.getSouth(),
          xmax: bounds.getEast(),
          ymax: bounds.getNorth(),
          spatialReference: { wkid: 4326 },
        });

        const url = new URL("/api/unified", window.location.origin);
        url.searchParams.append("include", "plots");
        url.searchParams.append("geometry", envelope);
        url.searchParams.append("geometryType", "esriGeometryEnvelope");
        url.searchParams.append("limit", "2000");

        const res = await fetch(url.toString());
        const json = await res.json();
        onPolygonsLoaded(json.data?.plots || []);
      } catch (e) {
        console.error("Viewport RS fetch error:", e);
      } finally {
        setIsFetching(false);
      }
    },
    [onPolygonsLoaded, isFetching],
  );

  useMapEvents({
    moveend(e) {
      fetchInView(e.target);
    },
    zoomend(e) {
      fetchInView(e.target);
    },
    load(e) {
      fetchInView(e.target);
    },
  });

  return null;
}

// ── Click Handler ─────────────────────────────────────────────────────
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

// ── Initial View Setter ──────────────────────────────────────────────────
function InitialViewSetter({ initialData }: { initialData?: any }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (!initialData) return;
    try {
      // @ts-ignore
      const bounds = L.latLngBounds([]);
      const processGeometry = (geom: any) => {
        if (geom?.rings) {
          geom.rings.forEach((ring: any) => {
            ring.forEach((pt: any) => bounds.extend([pt[1], pt[0]]));
          });
        }
      };

      if (Array.isArray(initialData) && initialData.length > 0) {
        initialData.forEach((f) => processGeometry(f.geometry));
      } else if (initialData.geometry) {
        processGeometry(initialData.geometry);
      }

      if (bounds.isValid()) {
        map.flyToBounds(bounds, { maxZoom: 18, duration: 1.5, easeLinearity: 0.25 });
      }
    } catch (e) {
      console.error("Bounds error", e);
    }
  }, [initialData, map]);
  return null;
}

// ── Main Component ────────────────────────────────────────────────────
export default function FullDapMapContent({
  initialData,
}: {
  initialData?: any;
}) {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Intelligence panel
  const [clickedPos, setClickedPos] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [elevation, setElevation] = useState<number | null>(null);
  const [inferredData, setInferredData] = useState<any>({
    rsData: null,
    landuseData: null,
    floodData: null,
  });

  // RS vector polygons loaded from viewport or initialData
  const [rsPolygons, setRsPolygons] = useState<any[]>(
    Array.isArray(initialData)
      ? initialData
      : initialData?.geometry
        ? [initialData]
        : [],
  );
  // The specific RS polygon that was clicked / highlighted
  const [selectedRsId, setSelectedRsId] = useState<number | null>(
    initialData?.objectid || null,
  );

  // If initialData changes, update state
  useEffect(() => {
    if (initialData) {
      if (Array.isArray(initialData)) {
        setRsPolygons(initialData);
        setSelectedRsId(null);
      } else {
        setRsPolygons((prev) => {
          // If we already have it in polygons, just select it
          const exists = prev.find(
            (p) => p.attributes?.objectid === initialData.objectid,
          );
          return exists ? prev : [...prev, initialData];
        });
        setSelectedRsId(initialData.objectid || null);
        // Also simulate a click on the center of this polygon
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
  }, [initialData]);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const position: [number, number] = [23.7937, 90.4066];
  const defaultZoom = 13;

  // Token fetch
  useEffect(() => {
    fetch("/api/rajuk-token")
      .then((r) => r.json())
      .then((d) => {
        if (d.token) setToken(d.token);
        else throw new Error("No token");
      })
      .catch(() =>
        setError("ম্যাপ লোড করতে সমস্যা হচ্ছে। রাজউক সার্ভার সংযোগ বিচ্ছিন্ন।"),
      )
      .finally(() => setLoading(false));
  }, []);

  // Mathematical Inference on click
  const handleMapClick = async (lat: number, lng: number) => {
    setClickedPos({ lat, lng });
    setIsInferring(true);
    setElevation(null);
    setInferredData({ rsData: null, landuseData: null, floodData: null });
    setSelectedRsId(null);

    try {
      // 1. Elevation
      fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.elevation?.[0] !== undefined) setElevation(d.elevation[0]);
        })
        .catch(() => {});

      // 2. Point geometry for spatial intersection
      const pointGeom = JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      });

      const url = new URL("/api/unified", window.location.origin);
      url.searchParams.append("include", "plots,landuse,flood");
      url.searchParams.append("geometry", pointGeom);
      url.searchParams.append("geometryType", "esriGeometryPoint");
      url.searchParams.append("spatialRel", "esriSpatialRelIntersects");

      const res = await fetch(url.toString());
      const json = await res.json();

      const rs = json.data?.plots?.[0]?.properties || null;
      const landuse = json.data?.landuse?.[0]?.properties || null;
      const flood = json.data?.flood?.[0]?.properties || null;

      if (rs?.id) setSelectedRsId(rs.id);
      setInferredData({ rsData: rs, landuseData: landuse, floodData: flood });
    } catch (err) {
      console.error("Inference Engine Error:", err);
    } finally {
      setIsInferring(false);
    }
  };

  const getTileUrl = (servicePath: string) => {
    const url = buildRajukTileProxyUrl(servicePath, {
      z: "{z}",
      y: "{y}",
      x: "{x}",
      token,
    });
    return decodeURIComponent(url);
  };

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
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#1e293b",
      }}
    >
      {/* ── Fullscreen Button ──────────────────────────────────────── */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "ছোট করুন" : "পূর্ণ স্ক্রিনে দেখুন"}
        className="position-absolute d-flex align-items-center gap-2 rounded-3 border-0 shadow fw-bold"
        style={{
          top: 20,
          right: 60,
          zIndex: 1000,
          background: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          padding: "8px 14px",
          fontSize: 13,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.15)",
          transition: "background 0.2s",
        }}
      >
        {isFullscreen ? (
          <>
            <Minimize2 size={15} /> <span>সাধারণ দৃশ্য</span>
          </>
        ) : (
          <>
            <Maximize2 size={15} /> <span>পূর্ণ স্ক্রিন</span>
          </>
        )}
      </button>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div
        className="position-absolute rounded-3 shadow px-3 py-2 d-flex align-items-center gap-3"
        style={{
          bottom: "30px",
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

      {/* ── Intelligence Panel ──────────────────────────────────────── */}
      {clickedPos && (
        <div
          className="position-absolute bg-white rounded-4 shadow-lg overflow-hidden"
          style={{
            top: 20,
            left: 20,
            width: 340,
            maxHeight: "calc(100% - 40px)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <div className="bg-dark text-white p-3 d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center fw-bold">
              <BrainCircuit size={18} className="me-2 text-warning" />
              স্থান বিশ্লেষণ
            </span>
            <button
              className="btn btn-sm btn-dark border-0 p-0"
              onClick={() => setClickedPos(null)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 overflow-auto" style={{ flexGrow: 1 }}>
            {/* Coordinates */}
            <div className="mb-3">
              <div className="badge bg-light text-dark border w-100 text-start py-2 px-3 fw-normal mb-2 d-flex align-items-center">
                <MapPin size={13} className="me-2 text-danger flex-shrink-0" />
                <span className="text-truncate">
                  {clickedPos.lat.toFixed(6)}, {clickedPos.lng.toFixed(6)}
                </span>
              </div>
              <div className="badge bg-light text-dark border w-100 text-start py-2 px-3 fw-normal d-flex align-items-center">
                <Layers size={13} className="me-2 text-primary flex-shrink-0" />
                উচ্চতা:{" "}
                {elevation !== null ? (
                  <strong className="ms-1">{elevation} মিটার</strong>
                ) : (
                  <span
                    className="spinner-border spinner-border-sm ms-2"
                    style={{ width: 12, height: 12, borderWidth: 2 }}
                  />
                )}
              </div>
            </div>

            {isInferring ? (
              <div className="text-center py-4 text-success">
                <div
                  className="spinner-border text-success mb-2"
                  style={{ width: "1.5rem", height: "1.5rem" }}
                />
                <div className="small fw-bold">GIS ডেটা বিশ্লেষণ চলছে...</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {/* RS Plot */}
                {inferredData.rsData && (
                  <div
                    className="p-2 border rounded-3"
                    style={{
                      borderColor: "#3b82f6 !important",
                      background: "#eff6ff",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onClick={() => setShowDetailsModal(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    title="বিস্তারিত দেখতে ক্লিক করুন"
                  >
                    <div
                      className="small fw-bold mb-1 d-flex justify-content-between align-items-center"
                      style={{ color: "#2563eb" }}
                    >
                      <span>🔵 RS দাগ (নীল পলিগন)</span>
                      <Maximize2 size={12} className="opacity-50" />
                    </div>
                    <div className="fw-bold fs-6">
                      {inferredData.rsData.rs_plot_no ||
                        inferredData.rsData.plot_no}
                    </div>
                    <div className="small text-muted">
                      {inferredData.rsData.address_search}
                    </div>
                  </div>
                )}

                {/* Landuse */}
                {inferredData.landuseData && (
                  <div className="p-2 border rounded-3 bg-success bg-opacity-10">
                    <div className="small text-muted mb-1">
                      ড্যাপ ভূমি ব্যবহার
                    </div>
                    <div className="fw-bold text-success">
                      {inferredData.landuseData.Landuse ||
                        inferredData.landuseData.LANDUSE}
                    </div>
                    {inferredData.landuseData.zone && (
                      <div className="small">
                        জোন: {inferredData.landuseData.zone}
                      </div>
                    )}
                    {inferredData.landuseData.maximum_he && (
                      <div className="small">
                        সর্বোচ্চ উচ্চতা: {inferredData.landuseData.maximum_he}
                      </div>
                    )}
                  </div>
                )}

                {/* Flood */}
                {inferredData.floodData && (
                  <div className="p-2 border border-danger rounded-3 bg-danger bg-opacity-10">
                    <div className="small text-danger fw-bold d-flex align-items-center">
                      <Waves size={13} className="me-1" /> বন্যা প্লাবন এলাকা
                    </div>
                    <div className="small mt-1 text-danger">
                      এই জমিটি জলাশয় বা প্লাবন জোনের আওতাভুক্ত।
                    </div>
                  </div>
                )}

                {!inferredData.rsData &&
                  !inferredData.landuseData &&
                  !inferredData.floodData && (
                    <div className="text-center py-3 text-muted small">
                      এই স্থানে কোনো ড্যাপ ডেটা পাওয়া যায়নি।
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <MapContainer
        center={position}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        attributionControl={false}
      >
        <MapClickHandler onMapClick={handleMapClick} />
        <ViewportPolygonFetcher onPolygonsLoaded={setRsPolygons} />
        <InitialViewSetter initialData={initialData} />

        {/* Marker at clicked point */}
        {clickedPos && (
          <Marker position={[clickedPos.lat, clickedPos.lng]}>
            <Popup>
              {isInferring ? (
                 <div className="text-center text-success small">বিশ্লেষণ চলছে...</div>
              ) : inferredData.rsData ? (
                 <div className="small">
                   <strong style={{ color: "#2563eb" }}>
                     {inferredData.rsData.rs_plot_no || inferredData.rsData.plot_no}
                   </strong>
                   <br/>
                   <span className="text-muted">{inferredData.rsData.address_search}</span>
                 </div>
              ) : inferredData.landuseData ? (
                 <div className="small">
                   <strong className="text-success">{inferredData.landuseData.Landuse || inferredData.landuseData.LANDUSE}</strong>
                 </div>
              ) : (
                 <div className="small text-muted">কোনো ডেটা পাওয়া যায়নি</div>
              )}
            </Popup>
          </Marker>
        )}

        {/* ── RS Vector Polygons (BLUE) ─────────────────────────────── */}
        <LayersControl position="topright">
          <LayersControl.Overlay name="RS প্লট (ভেক্টর)" checked>
            <FeatureGroup>
              {rsPolygons.map((feature: any, idx: number) => {
                if (!feature.geometry?.rings) return null;
                const ring = feature.geometry.rings[0];
                const coords: [number, number][] = ring.map((pt: number[]) => [
                  pt[1],
                  pt[0],
                ]);
                const attrs = feature.attributes || {};
                const label = attrs.rs_plot_no || attrs.plot_no;
                const isSelected = attrs.objectid === selectedRsId;

                return (
                  <Polygon
                    key={idx}
                    positions={coords}
                    pathOptions={
                      isSelected
                        ? {
                            color: "#16a34a",
                            fillColor: "#22c55e",
                            fillOpacity: 0.35,
                            weight: 3,
                          }
                        : {
                            color: "#3b82f6",
                            fillColor: "#3b82f6",
                            fillOpacity: 0.08,
                            weight: 1.8,
                          }
                    }
                  >
                    <Tooltip
                      direction="center"
                      permanent
                      className="bg-transparent border-0 shadow-none fw-bold"
                    >
                      <span
                        style={{
                          color: isSelected ? "#16a34a" : "#2563eb",
                          fontSize: "11px",
                          textShadow:
                            "1px 1px 0 white,-1px 1px 0 white,1px -1px 0 white,-1px -1px 0 white",
                          background: "transparent",
                          boxShadow: "none",
                          border: "none",
                        }}
                      >
                        {label}
                      </span>
                    </Tooltip>
                  </Polygon>
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Base Layers */}
          <LayersControl.BaseLayer name="গুগল ম্যাপ (Standard)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={22}
              maxNativeZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="গুগল স্যাটেলাইট (Satellite)" checked>
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
              maxZoom={22}
              maxNativeZoom={20}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Esri স্যাটেলাইট (Esri Imagery)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={22}
              maxNativeZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={22}
              maxNativeZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* Raster Overlays */}
          <LayersControl.Overlay name="রাজউক সীমানা (Boundary)" checked>
            <TileLayer
              url={getTileUrl("Hosted/Overlay_Boundary_Tiles")}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="ড্যাপ জোন ও সাবজোন">
            <TileLayer
              url={getTileUrl("Hosted/Rajuk_Zone_Subzone_Tiles")}
              opacity={0.7}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="প্রস্তাবিত ভূমি ব্যবহার (Landuse)">
            <TileLayer
              url={getTileUrl("Hosted/DAP_proposed_landuse")}
              opacity={0.6}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="MS মৌজা ম্যাপ (লাল)" checked>
            <TileLayer
              url={getTileUrl("Hosted/MS_Mauza_Tiles_Final")}
              opacity={0.9}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="RS মৌজা ম্যাপ (টাইল)">
            <TileLayer
              url={getTileUrl("Hosted/RS_Mauza_Tiles_Final")}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="RS মৌজা হাই-রেজ (282 Scale)">
            <TileLayer
              url={getTileUrl("Hosted/RS_Mauza_282Scale")}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="প্রস্তাবিত পরিবহন নেটওয়ার্ক">
            <TileLayer
              url={getTileUrl("Hosted/Transport_Network_Tiles")}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="বন্যা প্লাবন এলাকা">
            <TileLayer
              url={getTileUrl("Hosted/flood_overlay_lvl11_20")}
              opacity={0.6}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="গুরুত্বপূর্ণ স্থাপনা (Landmarks)">
            <TileLayer
              url={getTileUrl("Hosted/Major_Landmarks_V2_TILES")}
              maxZoom={22}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="প্রস্তাবিত POI">
            <TileLayer
              url={getTileUrl("Hosted/POI_Proposed_Tiles")}
              maxZoom={22}
            />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* ── Plot Details Modal ─────────────────────────────────────── */}
      {showDetailsModal && inferredData.rsData && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white border-0 py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center">
                  <MapPin size={20} className="me-2 text-primary" />
                  দাগ নং {inferredData.rsData.rs_plot_no || inferredData.rsData.plot_no} — বিস্তারিত তথ্য
                </h5>
                <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body bg-light p-4">
                <div className="table-responsive bg-white rounded-3 shadow-sm border">
                  <table className="table table-hover table-bordered mb-0 align-middle">
                    <tbody>
                      {Object.entries(inferredData.rsData)
                        .filter(([key, value]) => value !== null && value !== "" && value !== " " && !["id", "objectid", "globalid", "shape", "geometry", "st_area(shape)", "st_length(shape)"].includes(key.toLowerCase()))
                        .map(([key, value]) => {
                          const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
                          const formattedKey = key.replace(/([A-Z])/g, " $1").toUpperCase();
                          return (
                            <tr key={key}>
                              <th className="bg-light text-secondary px-3 py-2 align-middle text-uppercase" style={{ width: "40%", fontSize: "13px" }}>
                                {formattedKey}
                              </th>
                              <td className="text-dark fw-bold px-3 py-2 align-middle" style={{ fontSize: "14px", wordBreak: "break-word" }}>
                                {displayValue}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-white border-top py-2">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowDetailsModal(false)}>বন্ধ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
