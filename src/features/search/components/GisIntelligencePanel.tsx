"use client";

import { useState } from "react";
import { usePopup } from "@/src/features/map/providers/PopupProvider";
import { X, Layers, Share2, Bookmark, MapPin, Navigation, Info, TreePine, Building2, Download } from "lucide-react";
import { toBn } from "@/src/shared/utils";
import { ShareModal } from "@/src/features/map/components/ShareModal";

export default function GisIntelligencePanel() {
  const { inferredData, elevation, isInferring, clearPopup, clickedPos } = usePopup();
  const [activeTab, setActiveTab] = useState<"overview" | "environment" | "facilities">("overview");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Show if we have either valid data or we are actively inferring
  const isOpen = isInferring || inferredData.rsData || inferredData.landuseData;

  if (!isOpen) return null;

  const { rsData, landuseData, floodData } = inferredData;

  const rsPlot = rsData?.rs_plot_no || rsData?.plot_no || "N/A";
  const rsArea = rsData?.areaAcre ? parseFloat(rsData.areaAcre).toFixed(4) : "N/A";
  const landuseType = landuseData?.landuse || "Unknown";
  const dapZone = landuseData?.dapZone || "Unknown";
  const far = landuseData?.far || "N/A";

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('gis-intelligence-panel-content');
      if (!element) return;
      
      const opt = {
        margin:       0.5,
        filename:     `LandBD_Report_Plot_${rsPlot}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <>
    <div 
      id="gis-intelligence-panel-content"
      role="dialog"
      aria-label="GIS Intelligence Panel"
      aria-hidden={!isOpen}
      className={`position-absolute top-0 end-0 h-100 shadow-lg d-flex flex-column z-3 transition-transform`}
      style={{ 
        width: "400px",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        borderLeft: "1px solid var(--border-color)",
        backgroundColor: "var(--card-bg)",
        pointerEvents: "auto"
      }}
    >
      {/* Header */}
      <div className="p-3 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between" style={{ backgroundColor: "var(--card-bg-secondary)" }} data-html2canvas-ignore>
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
          <Layers size={18} className="text-primary" />
          GIS Intelligence
        </h6>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm btn-link text-secondary p-1 border-0 hover-text-primary transition-colors" 
            title="Download Report"
            onClick={handleDownloadReport}
            disabled={isDownloading}
          >
            {isDownloading ? <div className="spinner-border spinner-border-sm" role="status"></div> : <Download size={16} />}
          </button>
          <button 
            className="btn btn-sm btn-link text-secondary p-1 border-0 hover-text-primary transition-colors" 
            onClick={clearPopup}
            aria-label="Close Panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-grow-1 overflow-hidden d-flex flex-column bg-transparent">
        {isInferring ? (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary animate-fade-in p-4 text-center">
            <div className="spinner-border text-primary mb-3" role="status" aria-hidden="true" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "0.2rem" }}></div>
            <span className="fw-bold fs-6 text-white">Analyzing location...</span>
            <span className="small mt-2 opacity-75">Querying spatial databases for plot, elevation, and facility data.</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="d-flex border-bottom border-secondary border-opacity-25" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
              <button 
                className={`flex-grow-1 bg-transparent border-0 py-2 small fw-bold transition-colors ${activeTab === "overview" ? "text-primary border-bottom border-primary border-2" : "text-secondary hover-text-white"}`}
                onClick={() => setActiveTab("overview")}
              >
                <Info size={14} className="me-1" /> Overview
              </button>
              <button 
                className={`flex-grow-1 bg-transparent border-0 py-2 small fw-bold transition-colors ${activeTab === "environment" ? "text-primary border-bottom border-primary border-2" : "text-secondary hover-text-white"}`}
                onClick={() => setActiveTab("environment")}
              >
                <TreePine size={14} className="me-1" /> Environment
              </button>
              <button 
                className={`flex-grow-1 bg-transparent border-0 py-2 small fw-bold transition-colors ${activeTab === "facilities" ? "text-primary border-bottom border-primary border-2" : "text-secondary hover-text-white"}`}
                onClick={() => setActiveTab("facilities")}
              >
                <Building2 size={14} className="me-1" /> Facilities
              </button>
            </div>

            <div className="flex-grow-1 overflow-auto p-3 text-white fade-in">
              {/* Quick Actions (Always Visible at top of scroll) */}
              <div className="d-flex gap-2 mb-3" data-html2canvas-ignore>
                <button 
                  className="btn btn-outline-primary btn-sm flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 size={14} /> Share
                </button>
                <button className="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1 text-white border-secondary border-opacity-25" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                  <Bookmark size={14} /> Save
                </button>
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="d-flex flex-column gap-3 animate-fade-in">
                  <div className="card border border-secondary border-opacity-25 bg-transparent rounded-3 p-3 text-white">
                    <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold">
                      <MapPin size={16} /> Location Info
                    </div>
                    <div className="d-flex justify-content-between align-items-center small mb-1">
                      <span className="text-secondary">Coordinates</span>
                      <span className="fw-bold user-select-all">
                        {clickedPos?.lat.toFixed(6)}, {clickedPos?.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div className="card border-primary border-opacity-25 shadow-sm rounded-3 overflow-hidden bg-transparent text-white">
                    <div className="card-header border-bottom border-secondary border-opacity-25 py-2" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                      <span className="fw-bold text-primary d-flex align-items-center gap-2">
                        <Navigation size={14} /> RS / General Plot
                      </span>
                    </div>
                    <div className="card-body p-3 bg-transparent">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary small fw-bold">Plot Number</span>
                        <span className="fw-bold">{toBn(rsPlot)}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary small fw-bold">Area (Acre)</span>
                        <span className="fw-bold">{toBn(rsArea)}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-secondary small fw-bold">Mouza</span>
                        <span className="fw-bold text-end text-truncate" style={{maxWidth: "150px"}}>
                          {toBn(rsData?.mauza || "N/A")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENVIRONMENT TAB */}
              {activeTab === "environment" && (
                <div className="d-flex flex-column gap-3 animate-fade-in">
                  <div className="card border-info border-opacity-25 shadow-sm rounded-3 overflow-hidden bg-transparent text-white">
                    <div className="card-header border-bottom border-secondary border-opacity-25 py-2" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                      <span className="fw-bold text-info d-flex align-items-center gap-2">
                        <Layers size={14} /> DAP Details
                      </span>
                    </div>
                    <div className="card-body p-3 bg-transparent">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary small fw-bold">Landuse</span>
                        <span className="fw-bold">{landuseType}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-secondary small fw-bold">DAP Zone</span>
                        <span className="fw-bold text-end" style={{maxWidth: "150px"}}>{dapZone}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-secondary small fw-bold">F.A.R.</span>
                        <span className="fw-bold">{far}</span>
                      </div>
                    </div>
                  </div>

                  {floodData && (
                    <div className="card border-warning border-opacity-25 shadow-sm rounded-3 overflow-hidden bg-transparent text-white">
                      <div className="card-header border-bottom border-secondary border-opacity-25 py-2" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                        <span className="fw-bold text-warning d-flex align-items-center gap-2">
                          <Layers size={14} /> Flood Flow Zone
                        </span>
                      </div>
                      <div className="card-body p-3 bg-transparent">
                        <div className="d-flex justify-content-between">
                          <span className="text-secondary small fw-bold">Zone Type</span>
                          <span className="fw-bold">{floodData.zone || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card border-success border-opacity-25 shadow-sm rounded-3 overflow-hidden bg-transparent text-white">
                    <div className="card-header border-bottom border-secondary border-opacity-25 py-2" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                      <span className="fw-bold text-success d-flex align-items-center gap-2">
                        <TreePine size={14} /> Terrain
                      </span>
                    </div>
                    <div className="card-body p-3 bg-transparent">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary small fw-bold">Elevation</span>
                        <span className="fw-bold">
                          {elevation !== null ? `${elevation.toFixed(2)}m` : "Loading..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FACILITIES TAB (Placeholder for Phase 7 implementation) */}
              {activeTab === "facilities" && (
                <div className="d-flex flex-column gap-3 animate-fade-in">
                  <div className="card border border-secondary border-opacity-25 bg-transparent rounded-3 p-3 text-center py-5">
                    <Building2 size={32} className="mx-auto text-secondary mb-3 opacity-50" />
                    <h6 className="text-white fw-bold mb-1">Nearby Points of Interest</h6>
                    <p className="text-secondary small mb-0">Querying nearby schools, hospitals, and infrastructure...</p>
                    <div className="mt-3">
                      <span className="badge bg-secondary bg-opacity-25 text-white border border-secondary border-opacity-50 me-2">Coming Soon</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
    
    <ShareModal 
      isOpen={isShareOpen}
      onClose={() => setIsShareOpen(false)}
      lat={clickedPos?.lat}
      lng={clickedPos?.lng}
    />
    </>
  );
}
