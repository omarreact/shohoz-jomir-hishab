"use client";

import { usePopup } from "@/src/features/map/providers/PopupProvider";
import { X, Layers, Share2, Bookmark, MapPin, Navigation } from "lucide-react";
import { toBn } from "@/lib/utils";

export default function PlotDetailsDrawer() {
  const { inferredData, elevation, isInferring, clearPopup, clickedPos } = usePopup();

  // Show if we have either valid data or we are actively inferring
  const isOpen = isInferring || inferredData.rsData || inferredData.landuseData;

  if (!isOpen) return null;

  const { rsData, landuseData, floodData } = inferredData;

  const rsPlot = rsData?.rs_plot_no || rsData?.plot_no || "N/A";
  const rsArea = rsData?.areaAcre ? parseFloat(rsData.areaAcre).toFixed(4) : "N/A";
  const landuseType = landuseData?.landuse || "Unknown";
  const dapZone = landuseData?.dapZone || "Unknown";
  const far = landuseData?.far || "N/A";
  
  return (
    <div 
      role="dialog"
      aria-label="Plot Details"
      aria-hidden={!isOpen}
      className={`position-absolute top-0 end-0 h-100 bg-white shadow-lg d-flex flex-column z-3 transition-transform`}
      style={{ 
        width: "350px",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        borderLeft: "1px solid rgba(0,0,0,0.1)",
        pointerEvents: "auto"
      }}
    >
      {/* Header */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <Layers size={18} className="text-success" />
          Plot Details
        </h6>
        <button 
          className="btn btn-sm btn-link text-muted p-0 border-0 hover-text-success transition-colors" 
          onClick={clearPopup}
          aria-label="Close Plot Details"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-grow-1 overflow-auto p-3 bg-white">
        {isInferring ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted animate-fade-in">
            <div className="spinner-border text-success mb-3" role="status" aria-hidden="true" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "0.2rem" }}></div>
            <span className="fw-bold fs-6">Analyzing location...</span>
            <span className="small mt-1 opacity-75">Fetching plot and elevation data</span>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 fade-in">
            
            {/* Quick Actions */}
            <div className="d-flex gap-2">
              <button className="btn btn-outline-success btn-sm flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1">
                <Share2 size={14} /> Share
              </button>
              <button className="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1">
                <Bookmark size={14} /> Save
              </button>
            </div>

            {/* Coordinates & Elevation */}
            <div className="card border-0 bg-light rounded-3 p-3">
              <div className="d-flex align-items-center gap-2 mb-2 text-success fw-bold">
                <MapPin size={16} /> Location Info
              </div>
              <div className="d-flex justify-content-between align-items-center small mb-1">
                <span className="text-muted">Coordinates</span>
                <span className="fw-bold user-select-all">
                  {clickedPos?.lat.toFixed(6)}, {clickedPos?.lng.toFixed(6)}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center small">
                <span className="text-muted">Elevation</span>
                <span className="fw-bold">
                  {elevation !== null ? `${elevation.toFixed(2)}m` : "Loading..."}
                </span>
              </div>
            </div>

            {/* RS Plot Info */}
            <div className="card border-success border-opacity-25 shadow-sm rounded-3 overflow-hidden">
              <div className="card-header bg-success bg-opacity-10 border-bottom-0 py-2">
                <span className="fw-bold text-success d-flex align-items-center gap-2">
                  <Navigation size={14} /> RS / General Plot
                </span>
              </div>
              <div className="card-body p-3 bg-white">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small fw-bold">Plot Number</span>
                  <span className="fw-bold">{toBn(rsPlot)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small fw-bold">Area (Acre)</span>
                  <span className="fw-bold">{toBn(rsArea)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small fw-bold">Mouza</span>
                  <span className="fw-bold text-end text-truncate" style={{maxWidth: "150px"}}>
                    {toBn(rsData?.mauza || "N/A")}
                  </span>
                </div>
              </div>
            </div>

            {/* Landuse & DAP Info */}
            <div className="card border-primary border-opacity-25 shadow-sm rounded-3 overflow-hidden">
              <div className="card-header bg-primary bg-opacity-10 border-bottom-0 py-2">
                <span className="fw-bold text-primary d-flex align-items-center gap-2">
                  <Layers size={14} /> DAP Details
                </span>
              </div>
              <div className="card-body p-3 bg-white">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small fw-bold">Landuse</span>
                  <span className="fw-bold">{landuseType}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small fw-bold">DAP Zone</span>
                  <span className="fw-bold text-end" style={{maxWidth: "150px"}}>{dapZone}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small fw-bold">F.A.R.</span>
                  <span className="fw-bold">{far}</span>
                </div>
              </div>
            </div>

            {/* Flood Info */}
            {floodData && (
              <div className="card border-info border-opacity-25 shadow-sm rounded-3 overflow-hidden">
                <div className="card-header bg-info bg-opacity-10 border-bottom-0 py-2">
                  <span className="fw-bold text-info d-flex align-items-center gap-2">
                    <Layers size={14} /> Flood Flow Zone
                  </span>
                </div>
                <div className="card-body p-3 bg-white">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small fw-bold">Zone Type</span>
                    <span className="fw-bold">{floodData.zone || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
