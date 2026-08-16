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
      className={`${`absolute top-0 end-0 h-full shadow-lg flex flex-col z-3 transition-transform`} bg-white dark:bg-slate-900`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-500 border-opacity-25 flex items-center justify-between bg-slate-50 dark:bg-slate-950" data-html2canvas-ignore>
        <h6 className="font-bold mb-0 flex items-center gap-2 text-white">
          <Layers size={18} className="text-blue-600" />
          GIS Intelligence
        </h6>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1.5 text-sm text-blue-600 hover:underline bg-transparent border-0 text-slate-500 p-1 border-0 hover-text-primary transition-colors" 
            title="Download Report"
            onClick={handleDownloadReport}
            disabled={isDownloading}
          >
            {isDownloading ? <div className="spinner-border spinner-border-sm" role="status"></div> : <Download size={16} />}
          </button>
          <button 
            className="px-3 py-1.5 text-sm text-blue-600 hover:underline bg-transparent border-0 text-slate-500 p-1 border-0 hover-text-primary transition-colors" 
            onClick={clearPopup}
            aria-label="Close Panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="grow overflow-hidden flex flex-col bg-transparent">
        {isInferring ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-fade-in p-6 text-center">
            <div className="spinner-border text-blue-600 mb-6" role="status" aria-hidden="true" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "0.2rem" }}></div>
            <span className="font-bold text-base text-white">Analyzing location...</span>
            <span className="text-sm mt-2 opacity-75">Querying spatial databases for plot, elevation, and facility data.</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-500 border-opacity-25 bg-slate-50 dark:bg-slate-950">
              <button 
                className={`grow bg-transparent border-0 py-2 text-sm font-bold transition-colors ${activeTab === "overview" ? "text-primary border-b border-blue-600 border-2" : "text-secondary hover-text-white"}`}
                onClick={() => setActiveTab("overview")}
              >
                <Info size={14} className="mr-1" /> Overview
              </button>
              <button 
                className={`grow bg-transparent border-0 py-2 text-sm font-bold transition-colors ${activeTab === "environment" ? "text-primary border-b border-blue-600 border-2" : "text-secondary hover-text-white"}`}
                onClick={() => setActiveTab("environment")}
              >
                <TreePine size={14} className="mr-1" /> Environment
              </button>
              <button 
                className={`grow bg-transparent border-0 py-2 text-sm font-bold transition-colors ${activeTab === "facilities" ? "text-primary border-b border-blue-600 border-2" : "text-secondary hover-text-white"}`}
                onClick={() => setActiveTab("facilities")}
              >
                <Building2 size={14} className="mr-1" /> Facilities
              </button>
            </div>

            <div className="grow overflow-auto p-6 text-white fade-in">
              {/* Quick Actions (Always Visible at top of scroll) */}
              <div className="flex gap-2 mb-6" data-html2canvas-ignore>
                <button 
                  className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 text-sm grow rounded-pill font-bold flex items-center justify-center gap-1"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 size={14} /> Share
                </button>
                <button className="border border-slate-500 text-slate-500 hover:bg-slate-500 hover:text-white px-3 py-1.5 text-sm grow rounded-pill font-bold flex items-center justify-center gap-1 text-white border-slate-500 border-opacity-25 bg-slate-50 dark:bg-slate-950">
                  <Bookmark size={14} /> Save
                </button>
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div className="card border border-slate-500 border-opacity-25 bg-transparent rounded-lg p-6 text-white">
                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold">
                      <MapPin size={16} /> Location Info
                    </div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-500">Coordinates</span>
                      <span className="font-bold user-select-all">
                        {clickedPos?.lat.toFixed(6)}, {clickedPos?.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div className="card border-blue-600 border-opacity-25 shadow-sm rounded-lg overflow-hidden bg-transparent text-white">
                    <div className="card-header border-b border-slate-500 border-opacity-25 py-2 bg-slate-50 dark:bg-slate-950">
                      <span className="font-bold text-blue-600 flex items-center gap-2">
                        <Navigation size={14} /> RS / General Plot
                      </span>
                    </div>
                    <div className="card-body p-6 bg-transparent">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm font-bold">Plot Number</span>
                        <span className="font-bold">{toBn(rsPlot)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm font-bold">Area (Acre)</span>
                        <span className="font-bold">{toBn(rsArea)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-sm font-bold">Mouza</span>
                        <span className="font-bold text-right text-truncate" style={{maxWidth: "150px"}}>
                          {toBn(rsData?.mauza || "N/A")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENVIRONMENT TAB */}
              {activeTab === "environment" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div className="card border-cyan-500 border-opacity-25 shadow-sm rounded-lg overflow-hidden bg-transparent text-white">
                    <div className="card-header border-b border-slate-500 border-opacity-25 py-2 bg-slate-50 dark:bg-slate-950">
                      <span className="font-bold text-cyan-500 flex items-center gap-2">
                        <Layers size={14} /> DAP Details
                      </span>
                    </div>
                    <div className="card-body p-6 bg-transparent">
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm font-bold">Landuse</span>
                        <span className="font-bold">{landuseType}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-slate-500 text-sm font-bold">DAP Zone</span>
                        <span className="font-bold text-right" style={{maxWidth: "150px"}}>{dapZone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 text-sm font-bold">F.A.R.</span>
                        <span className="font-bold">{far}</span>
                      </div>
                    </div>
                  </div>

                  {floodData && (
                    <div className="card border-yellow-500 border-opacity-25 shadow-sm rounded-lg overflow-hidden bg-transparent text-white">
                      <div className="card-header border-b border-slate-500 border-opacity-25 py-2 bg-slate-50 dark:bg-slate-950">
                        <span className="font-bold text-yellow-500 flex items-center gap-2">
                          <Layers size={14} /> Flood Flow Zone
                        </span>
                      </div>
                      <div className="card-body p-6 bg-transparent">
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-sm font-bold">Zone Type</span>
                          <span className="font-bold">{floodData.zone || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card border-green-600 border-opacity-25 shadow-sm rounded-lg overflow-hidden bg-transparent text-white">
                    <div className="card-header border-b border-slate-500 border-opacity-25 py-2 bg-slate-50 dark:bg-slate-950">
                      <span className="font-bold text-green-600 flex items-center gap-2">
                        <TreePine size={14} /> Terrain
                      </span>
                    </div>
                    <div className="card-body p-6 bg-transparent">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm font-bold">Elevation</span>
                        <span className="font-bold">
                          {elevation !== null ? `${elevation.toFixed(2)}m` : "Loading..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FACILITIES TAB (Placeholder for Phase 7 implementation) */}
              {activeTab === "facilities" && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div className="card border border-slate-500 border-opacity-25 bg-transparent rounded-lg p-6 text-center py-5">
                    <Building2 size={32} className="mx-auto text-slate-500 mb-6 opacity-50" />
                    <h6 className="text-white font-bold mb-1">Nearby Points of Interest</h6>
                    <p className="text-slate-500 text-sm mb-0">Querying nearby schools, hospitals, and infrastructure...</p>
                    <div className="mt-6">
                      <span className="badge bg-slate-500 bg-opacity-25 text-white border border-slate-500 border-opacity-50 mr-2">Coming Soon</span>
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
