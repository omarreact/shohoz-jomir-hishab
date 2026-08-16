"use client";

import dynamic from "next/dynamic";
import { Map, Loader } from "lucide-react";

const DapMiniMapContent = dynamic(() => import("./DapMiniMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500" style={{ minHeight: "300px" }}>
      <Loader className="spinner-border text-green-600 mb-2" />
      <small className="font-bold">ম্যাপ লোড হচ্ছে...</small>
    </div>
  ),
});

interface DapMiniMapProps {
  plotData: any;
}

export default function DapMiniMap({ plotData }: DapMiniMapProps) {
  if (!plotData) return null;

  return (
    <div className="card border-0 shadow-sm rounded-xl mt-6 overflow-hidden fade-in h-full">
      <div className="card-header bg-green-600 text-white p-6 text-center">
        <h6 className="font-bold mb-0 flex items-center justify-center">
          <Map size={18} className="mr-2 text-yellow-500" />
          রাজউক মাস্টারপ্ল্যান ম্যাপ
        </h6>
      </div>
      <div className="card-body p-0 flex items-center justify-center bg-slate-100" style={{ height: "300px" }}>
        {plotData.geometry ? (
          <DapMiniMapContent plotData={plotData} />
        ) : (
          <div className="text-center text-slate-500 p-6">
            <Map size={32} className="mb-2 opacity-50" />
            <br />
            <strong>ম্যাপ ডাটা উপলব্ধ নয়</strong>
            <p className="text-sm mt-1 mb-0">এই দাগের জ্যামিতিক সীমানা রাজউক সার্ভারে সংরক্ষিত নেই।</p>
          </div>
        )}
      </div>
    </div>
  );
}
