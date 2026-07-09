"use client";

import { AlertTriangle, Search, RefreshCcw } from "lucide-react";

interface PlotNotFoundProps {
  onReset?: () => void; // পুনরায় সার্চ করার জন্য একটি ঐচ্ছিক ফাংশন
}

export default function PlotNotFound({ onReset }: PlotNotFoundProps) {
  return (
    <div className="fade-in">
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-white">
        <div className="card-body p-5 text-center">
          {/* আইকন সেকশন */}
          <div
            className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle mb-4"
            style={{ width: "80px", height: "80px" }}
          >
            <AlertTriangle size={40} className="text-danger" />
          </div>

          {/* টেক্সট সেকশন */}
          <h4 className="fw-bold text-dark mb-3">
            দুঃখিত, কোনো তথ্য পাওয়া যায়নি!
          </h4>
          <p
            className="text-secondary mx-auto mb-4"
            style={{ maxWidth: "450px" }}
          >
            আপনি যে দাগ নম্বরটি খুঁজছেন, তা রাজউক ড্যাপ (DAP) সার্ভারে পাওয়া
            যায়নি। অনুগ্রহ করে আপনার নির্বাচিত{" "}
            <strong>জেলা, থানা, মৌজা এবং দাগ নম্বরটি</strong> সঠিক কি না তা
            পুনরায় চেক করুন।
          </p>

          {/* অ্যাকশন বাটনস */}
          <div className="d-flex justify-content-center gap-3 mt-4">
            {onReset && (
              <button
                onClick={onReset}
                className="btn btn-outline-danger rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center"
              >
                <RefreshCcw size={18} className="me-2" /> পুনরায় চেষ্টা করুন
              </button>
            )}
            <button
              className="btn btn-dark rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Search size={18} className="me-2" /> নতুন দাগ খুঁজুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
