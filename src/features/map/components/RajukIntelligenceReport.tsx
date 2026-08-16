"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, Layers, Loader, ShieldAlert, Waves, Building2, Map, AlertOctagon, Ruler } from "lucide-react";
import { engToBdNum } from "@/src/features/search/utils/formatters";

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
      <div className="card shadow-sm border-0 rounded-xl p-6 mt-6 text-center bg-slate-100 fade-in">
        <Loader className="spinner-border spinner-border-sm text-green-600 mr-2" />
        <span className="text-slate-500 font-bold">রাজউক সার্ভার থেকে উন্নত বিশ্লেষণ করা হচ্ছে...</span>
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
      <div className="alert alert-warning shadow-sm border-0 rounded-xl mt-6 fade-in flex items-center">
        <Info size={24} className="mr-4 shrink-0" />
        <div>
          <strong>উন্নত বিশ্লেষণ উপলব্ধ নয়</strong>
          <div className="text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-xl mt-6 overflow-hidden fade-in">
      <div className="card-header bg-slate-900 text-white p-6 text-center">
        <h6 className="font-bold mb-0 flex items-center justify-center">
          <Layers size={18} className="mr-2 text-yellow-500" />
          স্মার্ট ড্যাপ (DAP) এনালাইসিস রিপোর্ট
        </h6>
      </div>

      <div className="card-body bg-white p-6">
        {/* Detailed Landuse Breakdown */}
        <div className="p-6 rounded-xl bg-slate-100 border mb-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className={`p-2 rounded-full mr-4 ${primaryZone !== 'অজানা' ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div className="text-slate-500 text-sm font-bold">রাজউক প্রস্তাবিত ভূমি ব্যবহার (Landuse)</div>
              <h5 className="fw-bolder mb-0 text-slate-900">
                {primaryZone}
              </h5>
            </div>
          </div>
          
          {landuse.length > 1 && (
            <div className="mt-2 border-t pt-2">
              <small className="text-slate-500 font-bold block mb-1">একাধিক জোনে বিভক্ত:</small>
              {landuse.map((lu, idx) => {
                const name = lu.luZoning || lu.lu_zoning || lu.Landuse || lu.LANDUSE;
                const percent = lu.percentage ? parseFloat(lu.percentage).toFixed(2) : null;
                if (!name) return null;
                return (
                  <div key={idx} className="flex justify-between items-center text-sm mb-1 bg-white p-2 rounded border">
                    <span className="font-semibold text-slate-900">{name}</span>
                    {percent && <span className="badge bg-green-600 bg-opacity-10 text-green-600 border border-green-600">{engToBdNum(percent)}%</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DAP Detailed Info Grid */}
        <div className="row g-3 mb-6">
          <div className="col-md-6">
            <div className="h-full p-6 rounded-xl border bg-white">
              <div className="flex items-start">
                <Ruler size={20} className="mr-2 text-blue-600 mt-1" />
                <div>
                  <div className="text-slate-500 text-sm font-bold">ইমারত বিধিমালা (FAR ও উচ্চতা)</div>
                  <div className="mt-1">
                    <div className="font-bold text-slate-900">
                      FAR: <span className="text-blue-600">{plotData.properties?.areaFar || plotData.properties?.areaFarDbl || plotData.properties?.area_far || "অজানা"}</span>
                    </div>
                    <div className="font-bold text-slate-900">
                      সর্বোচ্চ উচ্চতা: <span className="text-blue-600">{plotData.properties?.maximumHeightM || plotData.properties?.maximumHe || "অজানা"} {plotData.properties?.maximumHeightM || plotData.properties?.maximumHe ? 'মিটার' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="h-full p-6 rounded-xl border bg-white">
              <div className="flex items-start">
                <Map size={20} className="mr-2 text-cyan-500 mt-1" />
                <div>
                  <div className="text-slate-500 text-sm font-bold">রাজউক অঞ্চল (Region/Zone)</div>
                  <div className="mt-1">
                    <div className="font-bold text-slate-900">
                      জোন: <span className="text-cyan-500">{plotData.properties?.rajukZone || plotData.properties?.rajuk_zone || "অজানা"}</span>
                    </div>
                    <div className="font-bold text-slate-900">
                      সাবজোন: <span className="text-cyan-500">{plotData.properties?.rajukSubzone || plotData.properties?.rajuk_subzone || "অজানা"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Special Warnings Grid */}
        <div className="row g-3">
          {/* Flood Warning */}
          <div className="col-md-6">
            <div className={`h-full p-6 rounded-xl border ${isFloodProne ? 'border-danger bg-red-600 bg-opacity-10' : 'border-success bg-green-600 bg-opacity-10'}`}>
              <div className="flex items-start">
                <Waves size={24} className={`mr-4 mt-1 ${isFloodProne ? 'text-danger' : 'text-success'}`} />
                <div>
                  <h6 className={`font-bold mb-1 ${isFloodProne ? 'text-danger' : 'text-success'}`}>
                    {isFloodProne ? "বন্যা প্লাবন এলাকা / জলাশয়" : "বন্যা ঝুঁকি মুক্ত"}
                  </h6>
                  <p className="text-sm text-slate-500 mb-0">
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
            <div className={`h-full p-6 rounded-xl border ${hasRoads ? 'border-warning bg-yellow-500 bg-opacity-10' : 'border-success bg-green-600 bg-opacity-10'}`}>
              <div className="flex items-start">
                <ShieldAlert size={24} className={`mr-4 mt-1 ${hasRoads ? 'text-warning' : 'text-success'}`} />
                <div>
                  <h6 className={`font-bold mb-1 ${hasRoads ? 'text-warning' : 'text-success'}`}>
                    {hasRoads ? "প্রস্তাবিত সড়ক অধিগ্রহণ" : "সড়ক অধিগ্রহণ মুক্ত"}
                  </h6>
                  <p className="text-sm text-slate-500 mb-0">
                    {hasRoads 
                      ? "সতর্কতা: রাজউকের প্রস্তাবিত সড়ক এই জমির উপর বা পাশ দিয়ে অতিক্রম করেছে!" 
                      : "এই জমিতে রাজউকের নতুন কোনো সড়কের প্রস্তাবনা নেই।"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Zones Warning */}
          {(plotData.properties?.heritageSite === 'Yes' || plotData.properties?.heritage_site === 'Yes' ||
            plotData.properties?.kpiPolygon === 'Yes' || plotData.properties?.kpi_polygon === 'Yes' ||
            plotData.properties?.hatirjheelSpecialArea === 'Yes' || plotData.properties?.hatirjheel_special_area === 'Yes' ||
            plotData.properties?.hazaribagRegenerationSite === 'Yes' || plotData.properties?.hazaribag_regeneration_site === 'Yes') && (
            <div className="col-md-12">
              <div className="h-full p-6 rounded-xl border border-red-600 bg-red-600 bg-opacity-10">
                <div className="flex items-start">
                  <AlertOctagon size={24} className="mr-4 mt-1 text-red-600" />
                  <div>
                    <h6 className="font-bold mb-1 text-red-600">বিশেষ সংরক্ষিত এলাকা</h6>
                    <ul className="text-sm text-red-600 mb-0 pl-4">
                      {(plotData.properties?.heritageSite === 'Yes' || plotData.properties?.heritage_site === 'Yes') && <li>হেরিটেজ সাইট (Heritage Site)</li>}
                      {(plotData.properties?.kpiPolygon === 'Yes' || plotData.properties?.kpi_polygon === 'Yes') && <li>কেপিআই (KPI / Key Point Installation) এলাকা</li>}
                      {(plotData.properties?.hatirjheelSpecialArea === 'Yes' || plotData.properties?.hatirjheel_special_area === 'Yes') && <li>হাতিরঝিল বিশেষ এলাকা</li>}
                      {(plotData.properties?.hazaribagRegenerationSite === 'Yes' || plotData.properties?.hazaribag_regeneration_site === 'Yes') && <li>হাজারীবাগ আরবান রিজেনারেশন প্রজেক্ট</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
