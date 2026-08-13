"use client";

import dynamic from "next/dynamic";
import { Map, Loader } from "lucide-react";

const DapMiniMapContent = dynamic(() => import("./DapMiniMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light text-muted" style={{ minHeight: "300px" }}>
      <Loader className="spinner-border text-success mb-2" />
      <small className="fw-bold">ম্যাপ লোড হচ্ছে...</small>
    </div>
  ),
});

interface DapMiniMapProps {
  plotData: any;
}

export default function DapMiniMap({ plotData }: DapMiniMapProps) {
  if (!plotData) return null;

  return (
    <div className="card border-0 shadow-sm rounded-4 mt-3 overflow-hidden fade-in h-100">
      <div className="card-header bg-success text-white p-3 text-center">
        <h6 className="fw-bold mb-0 d-flex align-items-center justify-content-center">
          <Map size={18} className="me-2 text-warning" />
          রাজউক মাস্টারপ্ল্যান ম্যাপ
        </h6>
      </div>
      <div className="card-body p-0 d-flex align-items-center justify-content-center bg-light" style={{ height: "300px" }}>
        {plotData.geometry ? (
          <DapMiniMapContent plotData={plotData} />
        ) : (
          <div className="text-center text-muted p-4">
            <Map size={32} className="mb-2 opacity-50" />
            <br />
            <strong>ম্যাপ ডাটা উপলব্ধ নয়</strong>
            <p className="small mt-1 mb-0">এই দাগের জ্যামিতিক সীমানা রাজউক সার্ভারে সংরক্ষিত নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
}
