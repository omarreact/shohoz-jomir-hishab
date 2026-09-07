"use client";

import { useEffect } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

export default function MaintenanceAuthGate() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (isLoggedIn) return null;

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4" style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
      <div className="mb-4" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a2 2 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <h1 className="fw-bolder mb-3 text-white">সাইট মেইনটেন্যান্স চলছে</h1>
      <p className="lead opacity-75" style={{ maxWidth: "500px" }}>আমাদের ওয়েবসাইট আপডেট করার কাজ চলছে। সাময়িক এই অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত। খুব শীঘ্রই আমরা ফিরে আসবো!</p>
    </div>
  );
}
