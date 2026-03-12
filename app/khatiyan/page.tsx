"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { List, Zap, HelpCircle, Calculator, Trash2 } from "lucide-react";
import { FULL_UNIT_TIL } from "@/lib/constants";
import { toBn, toEn, makeBanglaStr } from "@/lib/utils";
import {
  buildDetailedResults,
  generateCSVFromResults,
} from "@/lib/exportHelpers";
import PrintStyles from "@/components/PrintStyles";
import DetailedCalculator from "@/components/DetailedCalculator";
import QuickCalculator from "@/components/QuickCalculator";
import LatestBlogs from "../../components/shared/LatestBlogs";

// ResultSection কে Lazy Load করা হচ্ছে
const ResultSection = dynamic(() => import("@/components/ResultSection"), {
  ssr: false, // এটি ব্রাউজারে রেন্ডার হবে, সার্ভারে নয়
  loading: () => (
    <div className="text-center p-5 mt-4">
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-2 text-muted fw-bold">ফলাফল প্রস্তুত করা হচ্ছে...</p>
    </div>
  ),
});

type Plot = {
  id: number;
  cs: string;
  rs: string;
  city: string;
  bds: string;
  t: string; // শ্রেণী
  a: string; // মোট জমি (শতাংশ)
};

type Owner = {
  id: number;
  n: string; // নাম
  rType: "পিতা" | "স্বামী";
  rName: string;
  a: number; // আনা
  g: number; // গন্ডা
  k: number; // কড়া
  kr: number; // ক্রান্তি
  ti: number; // তিল
};

type QuickData = {
  totalLand: string;
  a: number;
  g: number;
  k: number;
  kr: number;
  ti: number;
};

type QuickResult = { land: number; sqft: number; katha: number };

const initialPlot = (id: number): Plot => ({
  id,
  cs: "",
  rs: "",
  city: "",
  bds: "",
  t: "",
  a: "",
});

const initialOwner = (id: number): Owner => ({
  id,
  n: "",
  rType: "পিতা",
  rName: "",
  a: 0,
  g: 0,
  k: 0,
  kr: 0,
  ti: 0,
});

export default function SmartKhatiyanApp() {
  const [activeTab, setActiveTab] = useState("detailed");
  const nextPlotId = useRef(3);
  const nextOwnerId = useRef(4);

  const [plots, setPlots] = useState<Plot[]>([initialPlot(1)]);
  const [owners, setOwners] = useState<Owner[]>([initialOwner(2)]);
  const [detailedResults, setDetailedResults] = useState<any[] | null>(null);
  const [quickData, setQuickData] = useState<QuickData>({
    totalLand: "",
    a: 0,
    g: 0,
    k: 0,
    kr: 0,
    ti: 0,
  });
  const [quickResult, setQuickResult] = useState<QuickResult | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("khatiyanNextData");
    if (savedData) {
      try {
        const d = JSON.parse(savedData);
        if (d.plots?.length > 0) setPlots(d.plots);
        if (d.owners?.length > 0) setOwners(d.owners);
      } catch (e) {
        console.warn("Could not load saved khatiyan data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        localStorage.setItem(
          "khatiyanNextData",
          JSON.stringify({ plots, owners }),
        ),
      500,
    );
    return () => clearTimeout(timer);
  }, [plots, owners]);

  const addPlot = () =>
    setPlots((prev) => [...prev, initialPlot(nextPlotId.current++)]);
  const removePlot = (id: number) =>
    setPlots((prev) => prev.filter((p) => p.id !== id));
  const updatePlot = (id: number, field: keyof Plot, value: string) => {
    const finalValue = ["cs", "rs", "city", "bds", "a"].includes(field)
      ? makeBanglaStr(value)
      : value;
    setPlots((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: finalValue as any } : p)),
    );
  };

  const addOwner = () =>
    setOwners((prev) => [...prev, initialOwner(nextOwnerId.current++)]);
  const removeOwner = (id: number) =>
    setOwners((prev) => prev.filter((o) => o.id !== id));
  const updateOwner = <K extends keyof Owner>(
    id: number,
    field: K,
    value: Owner[K],
  ) =>
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    );

  const totalOwnerTil = owners.reduce(
    (acc, o) =>
      acc +
      Number(o.a) * 4800 +
      Number(o.g) * 240 +
      Number(o.k) * 60 +
      Number(o.kr) * 20 +
      Number(o.ti),
    0,
  );

  const calculateDetailed = () => {
    const { hasData, computedResults } = buildDetailedResults(
      owners,
      plots,
      FULL_UNIT_TIL,
      toEn,
      toBn,
    );
    if (hasData && computedResults.length > 0) {
      setDetailedResults(computedResults);
      setTimeout(
        () =>
          document
            .getElementById("resultSection")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } else {
      alert("কমপক্ষে একজন মালিকের অংশ এবং জমির পরিমাণ ইনপুট দিন।");
    }
  };

  const calculateQuick = () => {
    const total = toEn(quickData.totalLand);
    const shareTil =
      Number(quickData.a) * 4800 +
      Number(quickData.g) * 240 +
      Number(quickData.k) * 60 +
      Number(quickData.kr) * 20 +
      Number(quickData.ti);
    const share = shareTil / FULL_UNIT_TIL;
    if (total > 0 && share > 0) {
      const got = total * share;
      setQuickResult({
        land: got,
        sqft: got * 435.6,
        katha: got / 1.65,
      });
    } else {
      alert("দয়া করে জমির পরিমাণ এবং অংশ সঠিক ভাবে দিন।");
    }
  };

  const clearAll = () => {
    if (confirm("সব ডাটা মুছে ফেলতে চান?")) {
      nextPlotId.current = 3;
      nextOwnerId.current = 4;
      setPlots([initialPlot(1)]);
      setOwners([initialOwner(2)]);
      setDetailedResults(null);
      localStorage.removeItem("khatiyanNextData");
    }
  };

  // এই ফাংশনটি আগেরবার বাদ পড়ে গিয়েছিল
  const handleQuickDataChange = (newData: Partial<QuickData>) => {
    setQuickData((prev) => ({
      ...prev,
      ...newData,
      ...(newData.totalLand !== undefined && {
        totalLand: makeBanglaStr(newData.totalLand),
      }),
    }));
  };

  const downloadMultiPagePDF = async () => {
    if (!exportRef.current) return;
    const element = exportRef.current;
    const originalWidth = element.style.width;
    element.style.width = "794px";
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("Khatiyan_Share_Details.pdf");
    } catch (err) {
      console.error(err);
      alert("PDF তৈরিতে সমস্যা হয়েছে।");
    } finally {
      element.style.width = originalWidth;
    }
  };

  const downloadExcel = () => {
    if (!detailedResults?.length) {
      alert("ডাউনলোড করার মতো কোনো তথ্য নেই!");
      return;
    }
    const csvContent = generateCSVFromResults(detailedResults, toBn);
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Khatiyan_Calculation.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PrintStyles />
      <div className="container py-5 no-print fade-in">

        <div className="d-flex justify-content-center mb-4">
          <div className="bg-white p-1 rounded-pill shadow-sm border d-inline-flex">
            <button
              onClick={() => setActiveTab("detailed")}
              className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ${activeTab === "detailed" ? "btn-success shadow-sm" : "btn-light text-secondary"}`}
            >
              <List size={18} className="me-2" /> বিস্তারিত হিসাব
            </button>
            <button
              onClick={() => setActiveTab("quick")}
              className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ms-2 ${activeTab === "quick" ? "btn-primary shadow-sm" : "btn-light text-secondary"}`}
            >
              <Zap size={18} className="me-2" /> কুইক ক্যালকুলেটর
            </button>
          </div>
        </div>

        {/* ইউজার ম্যানুয়াল */}
        <div className="row justify-content-center mb-4">
          <div className="col-lg-12">
            <div className="accordion shadow-sm rounded-4" id="manualKhatiyan">
              <div className="accordion-item border-0 rounded-4 overflow-hidden">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed bg-white text-primary fw-bold p-3 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapseKhatiyan">
                    <HelpCircle size={20} className="me-2" /> কীভাবে ব্যবহার করবেন? (নির্দেশিকা)
                  </button>
                </h2>
                <div id="collapseKhatiyan" className="accordion-collapse collapse" data-bs-parent="#manualKhatiyan">
                  <div className="accordion-body bg-light text-secondary lh-lg pt-2 pb-4">
                    <ol className="mb-0 ps-3">
                      <li className="mb-2"><strong>বিস্তারিত হিসাব:</strong> প্রথমে "দাগ যোগ" করে খতিয়ানের দাগ নম্বর, শ্রেণী এবং মোট জমির পরিমাণ লিখুন। এরপর "মালিক যোগ" করে মালিকের নাম এবং খতিয়ানে থাকা তার অংশ (আনা, গন্ডা, কড়া, ক্রান্তি, তিল) সিলেক্ট করুন। সবশেষে নিচের "হিসাব করুন" বাটনে ক্লিক করুন।</li>
                      <li className="mb-2"><strong>কুইক ক্যালকুলেটর:</strong> আপনার যদি শুধু মোট জমির পরিমাণ জানা থাকে, তবে কুইক ক্যালকুলেটরে জমির পরিমাণ এবং আপনার অংশ দিয়ে মুহূর্তেই নিজের প্রাপ্ত জমি বের করতে পারবেন।</li>
                      <li>১৬ আনা সম্পূর্ণ মিলেছে কি না, তা আপনি বিস্তারিত হিসাবের ওপরের নোটিফিকেশন বারে লাইভ দেখতে পাবেন।</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {activeTab === "detailed" && (
          <>
            <DetailedCalculator
              plots={plots}
              owners={owners}
              totalOwnerTil={totalOwnerTil}
              onAddPlot={addPlot}
              onRemovePlot={removePlot}
              onUpdatePlot={updatePlot}
              onAddOwner={addOwner}
              onRemoveOwner={removeOwner}
              onUpdateOwner={updateOwner}
            />
            {/* বাটনগুলো এখানে থাকবে */}
            <div className="d-flex justify-content-center gap-3 mt-4 mb-5">
              <button 
                onClick={clearAll} 
                className="btn btn-outline-danger px-4 py-2 fw-bold rounded-pill shadow-sm d-flex align-items-center"
              >
                <Trash2 size={18} className="me-2" /> মুছে ফেলুন
              </button>
              <button 
                onClick={calculateDetailed} 
                className="btn btn-success px-5 py-2 fw-bold rounded-pill shadow-lg d-flex align-items-center"
              >
                <Calculator size={18} className="me-2" /> হিসাব করুন
              </button>
            </div>
          </>
        )}

        {activeTab === "quick" && (
          <QuickCalculator
            quickData={quickData}
            quickResult={quickResult}
            onQuickDataChange={handleQuickDataChange}
            onCalculateQuick={calculateQuick}
          />
        )}
        
        <ResultSection 
          detailedResults={detailedResults}
          exportRef={exportRef}
          onDownloadPDF={downloadMultiPagePDF}
          onDownloadExcel={downloadExcel}
        />
        <LatestBlogs />
      </div>
    </>
  );
        }
    
