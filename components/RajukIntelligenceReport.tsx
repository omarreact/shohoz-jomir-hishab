"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, Layers, Loader, ShieldAlert, Waves } from "lucide-react";

interface IntelligenceProps {
  plotData: any;
}

export default function RajukIntelligenceReport({ plotData }: IntelligenceProps) {
  const [loading, setLoading] = useState(true);
  const [landuse, setLanduse] = useState<any[]>([]);
  const [floodZones, setFloodZones] = useState<any[]>([]);
  const [roads, setRoads] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plotData) {
      setLoading(false);
      return;
    }
    
    // Extract properties directly from plotData since the Unified API already includes them
    const props = plotData.properties || {};
    
    // Map the landuse arrays directly from the new detailed tables
    if (props.landuseData && props.landuseData.length > 0) {
      setLanduse(props.landuseData);
    } else if (props.luZoning || props.Landuse || props.LANDUSE) {
      setLanduse([{ Landuse: props.luZoning || props.Landuse || props.LANDUSE }]);
    } else {
      setLanduse([]);
    }

    if (props.floodData && props.floodData.length > 0) {
      setFloodZones(props.floodData);
    } else if (props.floodZone && props.floodZone !== "No Flood Zone" && props.floodZone !== "NO") {
      setFloodZones([{ floodZone: props.floodZone }]);
    } else {
      setFloodZones([]);
    }

    // Transport is currently not fully implemented in the unified API
    setRoads([]);
    
    setLoading(false);
  }, [plotData]);

  if (!plotData) return null;

  if (loading) {
    return (
      <div className="card shadow-sm border-0 rounded-4 p-4 mt-3 text-center bg-light fade-in">
        <Loader className="spinner-border spinner-border-sm text-success me-2" />
        <span className="text-muted fw-bold">রাজউক সার্ভার থেকে উন্নত বিশ্লেষণ করা হচ্ছে...</span>
      </div>
    );
  }

  // ── Compute UI State ──
  const isFloodProne = floodZones.some(fz => {
    const fzName = fz.floodZone || fz.FLOOD_ZONE || fz.flood_zone;
    return fzName && fzName !== "No Flood Zone" && fzName !== "NO";
  });
  const hasRoads = roads.length > 0;
  
  const uniqueLanduses = Array.from(new Set(landuse.map(lu => lu.Landuse || lu.LANDUSE || lu.lu_zoning || lu.luZoning).filter(Boolean)));
  const primaryZone = uniqueLanduses.length > 0 ? uniqueLanduses.join(", ") : "অজানা";

  // If no advanced data was fetched, show a fallback message instead of a blank report
  if (!isFloodProne && !hasRoads && landuse.length === 0 && error) {
    return (
      <div className="alert alert-warning shadow-sm border-0 rounded-4 mt-3 fade-in d-flex align-items-center">
        <Info size={24} className="me-3 flex-shrink-0" />
        <div>
          <strong>উন্নত বিশ্লেষণ উপলব্ধ নয়</strong>
          <div className="small mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 mt-3 overflow-hidden fade-in">
      <div className="card-header bg-dark text-white p-3 text-center">
        <h6 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
          <Layers size={18} className="me-2 text-warning" />
          স্মার্ট ড্যাপ (DAP) এনালাইসিস রিপোর্ট
        </h6>
      </div>

      <div className="card-body bg-white p-4">
        {/* Zoning Information */}
        <div className="d-flex align-items-center p-3 rounded-4 bg-light border mb-3 shadow-sm">
          <div className={`p-3 rounded-circle me-3 ${primaryZone !== 'অজানা' ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-muted small fw-bold mb-1">রাজউক প্রস্তাবিত ভূমি ব্যবহার (Landuse)</div>
            <h5 className="fw-bolder mb-0 text-dark">
              {primaryZone}
            </h5>
          </div>
        </div>

        {/* Warnings Row */}
        <div className="row g-3">
          {/* Flood Warning */}
          <div className="col-md-6">
            <div className={`h-100 p-3 rounded-4 border ${isFloodProne ? 'border-danger bg-danger bg-opacity-10' : 'border-success bg-success bg-opacity-10'}`}>
              <div className="d-flex align-items-start">
                <Waves size={24} className={`me-3 mt-1 ${isFloodProne ? 'text-danger' : 'text-success'}`} />
                <div>
                  <h6 className={`fw-bold mb-1 ${isFloodProne ? 'text-danger' : 'text-success'}`}>
                    {isFloodProne ? "বন্যা প্লাবন এলাকা / জলাশয়" : "বন্যা ঝুঁকি মুক্ত"}
                  </h6>
                  <p className="small text-muted mb-0">
                    {isFloodProne 
                      ? "সতর্কতা: এই জমিটি ড্যাপ এর বন্যা প্লাবন বা জলাশয় জোনে অবস্থিত। এখানে স্থাপনা নির্মাণ নিষিদ্ধ হতে পারে!" 
                      : "জমিটি রাজউকের বন্যা প্লাবন এলাকার বাইরে অবস্থিত।"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Road Warning */}
          <div className="col-md-6">
            <div className={`h-100 p-3 rounded-4 border ${hasRoads ? 'border-warning bg-warning bg-opacity-10' : 'border-success bg-success bg-opacity-10'}`}>
              <div className="d-flex align-items-start">
                <ShieldAlert size={24} className={`me-3 mt-1 ${hasRoads ? 'text-warning' : 'text-success'}`} />
                <div>
                  <h6 className={`fw-bold mb-1 ${hasRoads ? 'text-warning' : 'text-success'}`}>
                    {hasRoads ? "প্রস্তাবিত সড়ক অধিগ্রহণ" : "সড়ক অধিগ্রহণ মুক্ত"}
                  </h6>
                  <p className="small text-muted mb-0">
                    {hasRoads 
                      ? "সতর্কতা: রাজউকের প্রস্তাবিত সড়ক এই জমির উপর বা পাশ দিয়ে অতিক্রম করেছে!" 
                      : "এই জমিতে রাজউকের নতুন কোনো সড়কের প্রস্তাবনা নেই।"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
