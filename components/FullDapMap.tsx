"use client";

import dynamic from "next/dynamic";
import { Loader } from "lucide-react";

// Dynamically import the actual map content with SSR disabled
const FullDapMapContent = dynamic(() => import("./FullDapMapContent"), {
  ssr: false,
  loading: () => (
    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 bg-light" style={{ minHeight: "80vh" }}>
      <Loader className="spinner-border text-success mb-3" style={{ width: "3rem", height: "3rem", borderWidth: "0.25em" }} />
      <h5 className="text-secondary fw-bold">ফুল ড্যাপ ম্যাপ লোড হচ্ছে...</h5>
    </div>
  ),
});

export default function FullDapMap({ initialData }: { initialData?: any }) {
  return (
    <div className="w-100 h-100 position-relative">
      <FullDapMapContent initialData={initialData} />
    </div>
  );
}
