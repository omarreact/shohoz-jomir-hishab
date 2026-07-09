"use client";

import { useRef } from "react";
import {
  MapPin,
  FileDown,
  Printer,
  CheckCircle2,
  Layers,
  Info,
  ShieldCheck, // ইম্পোর্ট ফিক্স করা হয়েছে
} from "lucide-react";
import { downloadMultiPagePDF } from "@/lib/exportUtils";
import { toBn } from "@/lib/utils"; // আপনার ইউটিলিটি ফাইল থেকে Bangla Converter

interface PlotDetailsProps {
  plotData: {
    rs_plot_no?: string;
    ms_plot_no?: string;
    plot_no?: string;
    mauza?: string;
    thana_ms?: string;
    m_district?: string;
    landuse?: string;
    area_acre?: string;
    [key: string]: any;
  };
}

export default function PlotDetailsCard({ plotData }: PlotDetailsProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    try {
      await downloadMultiPagePDF(exportRef);
    } catch (error) {
      console.error("PDF Download failed", error);
    }
  };

  if (!plotData) return null;

  return (
    <div className="fade-in">
      <div
        ref={exportRef}
        id="resultSection"
        className="card shadow-lg border-0 rounded-4 overflow-hidden mb-4 bg-white"
      >
        <div className="card-header bg-success bg-gradient text-white p-4 border-0 position-relative">
          <div className="d-flex align-items-center">
            <ShieldCheck size={28} className="me-3" />
            <div>
              <h5 className="fw-bold mb-0">রাজউক ড্যাপ ভেরিফায়েড দাগ</h5>
              <p className="small mb-0 opacity-75">
                {plotData.mauza || "মৌজা"}, {plotData.m_district || "জেলা"}
              </p>
            </div>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6 border-end">
              <p className="text-muted small mb-1">আরএস (RS) দাগ</p>
              <h6 className="fw-bold">{toBn(plotData.rs_plot_no || "-")}</h6>
            </div>
            <div className="col-md-6">
              <p className="text-muted small mb-1">এমএস (MS) দাগ</p>
              <h6 className="fw-bold">{toBn(plotData.ms_plot_no || "-")}</h6>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center gap-2 no-print">
        <button
          onClick={handleDownloadPDF}
          className="btn btn-danger rounded-pill px-4"
        >
          <FileDown size={18} /> PDF ডাউনলোড
        </button>
        <button
          onClick={handlePrint}
          className="btn btn-outline-dark rounded-pill px-4"
        >
          <Printer size={18} /> প্রিন্ট
        </button>
      </div>
    </div>
  );
}
