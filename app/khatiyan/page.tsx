"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  List,
  Zap,
  Calculator,
  Trash2,
  Database,
} from "lucide-react";
import { FULL_UNIT_TIL } from "@/lib/constants";
import { toBn, toEn, makeBanglaStr } from "@/lib/utils";
import { buildDetailedResults } from "@/lib/exportHelpers";
import PrintStyles from "@/components/PrintStyles";
import DetailedCalculator from "@/components/DetailedCalculator";
import QuickCalculator from "@/components/QuickCalculator";
import LatestBlogs from "../../components/shared/LatestBlogs";
import SmartRajukSearch from "@/components/RajukDatabaseSearch";

const ResultSection = dynamic(() => import("@/components/ResultSection"), {
  ssr: false,
  loading: () => (
    <div className="text-center p-5 mt-4">
      <div className="spinner-border text-success"></div>
    </div>
  ),
});

// -- Types --
type Plot = {
  id: number;
  cs: string;
  rs: string;
  city: string;
  bds: string;
  t: string;
  a: string;
};
type Owner = {
  id: number;
  n: string;
  rType: "পিতা" | "স্বামী";
  rName: string;
  a: number;
  g: number;
  k: number;
  kr: number;
  ti: number;
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
  id, cs: "", rs: "", city: "", bds: "", t: "", a: "",
});

const initialOwner = (id: number): Owner => ({
  id, n: "", rType: "পিতা", rName: "", a: 0, g: 0, k: 0, kr: 0, ti: 0,
});

export default function SmartKhatiyanApp() {
  const [activeTab, setActiveTab] = useState("detailed");
  const nextPlotId = useRef(3);
  const nextOwnerId = useRef(4);

  const [plots, setPlots] = useState<Plot[]>([initialPlot(1)]);
  const [owners, setOwners] = useState<Owner[]>([initialOwner(2)]);
  const [detailedResults, setDetailedResults] = useState<any[] | null>(null);
  const [quickData, setQuickData] = useState<QuickData>({
    totalLand: "", a: 0, g: 0, k: 0, kr: 0, ti: 0,
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
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => localStorage.setItem("khatiyanNextData", JSON.stringify({ plots, owners })),
      500,
    );
    return () => clearTimeout(timer);
  }, [plots, owners]);

  const addPlot = () => setPlots((prev) => [...prev, initialPlot(nextPlotId.current++)]);
  const removePlot = (id: number) => setPlots((prev) => prev.filter((p) => p.id !== id));
  const updatePlot = (id: number, field: keyof Plot, value: string) => {
    const finalValue = ["cs", "rs", "city", "bds", "a"].includes(field)
      ? makeBanglaStr(value) : value;
    setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: finalValue as any } : p)));
  };

  const addOwner = () => setOwners((prev) => [...prev, initialOwner(nextOwnerId.current++)]);
  const removeOwner = (id: number) => setOwners((prev) => prev.filter((o) => o.id !== id));
  const updateOwner = <K extends keyof Owner>(id: number, field: K, value: Owner[K]) =>
    setOwners((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));

  const totalOwnerTil = owners.reduce(
    (acc, o) =>
      acc + Number(o.a) * 4800 + Number(o.g) * 240 +
      Number(o.k) * 60 + Number(o.kr) * 20 + Number(o.ti),
    0,
  );

  const calculateDetailed = () => {
    const { hasData, computedResults } = buildDetailedResults(owners, plots, FULL_UNIT_TIL, toEn, toBn);
    if (hasData && computedResults.length > 0) {
      setDetailedResults(computedResults);
      setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      alert("কমপক্ষে একজন মালিকের অংশ এবং জমির পরিমাণ ইনপুট দিন।");
    }
  };

  const calculateQuick = () => {
    const total = toEn(quickData.totalLand);
    const shareTil = Number(quickData.a) * 4800 + Number(quickData.g) * 240 +
      Number(quickData.k) * 60 + Number(quickData.kr) * 20 + Number(quickData.ti);
    const share = shareTil / FULL_UNIT_TIL;
    if (total > 0 && share > 0) {
      setQuickResult({ land: total * share, sqft: total * share * 435.6, katha: (total * share) / 1.65 });
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

  const handleQuickDataChange = (newData: Partial<QuickData>) => {
    setQuickData((prev) => ({
      ...prev,
      ...newData,
      ...(newData.totalLand !== undefined && { totalLand: makeBanglaStr(newData.totalLand) }),
    }));
  };

  const handleUseArea = (decimalArea: number, dagNo: string, type: string) => {
    if (plots.length === 0) { alert("খতিয়ানে কমপক্ষে একটি প্লট বা দাগ থাকা আবশ্যক!"); return; }
    updatePlot(plots[0].id, "a", decimalArea.toFixed(2));
    updatePlot(plots[0].id, "rs", type !== "ms_plot_no" ? toBn(dagNo) : "");
    setActiveTab("detailed");
  };

  const downloadMultiPagePDF = async () => {};
  const downloadExcel = () => {};

  return (
    <>
      <PrintStyles />
      <div className="container-fluid px-3 px-xl-5 py-5 no-print fade-in">
        <div className="d-flex justify-content-center mb-4">
          <div className="bg-white p-1 rounded-pill shadow-sm border d-inline-flex flex-wrap justify-content-center">
            <button
              onClick={() => setActiveTab("detailed")}
              className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ${activeTab === "detailed" ? "btn-success shadow-sm" : "btn-light text-secondary"}`}
            >
              <List size={18} className="me-2" /> বিস্তারিত হিসাব
            </button>
            <button
              onClick={() => setActiveTab("quick")}
              className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ms-md-2 ${activeTab === "quick" ? "btn-primary shadow-sm" : "btn-light text-secondary"}`}
            >
              <Zap size={18} className="me-2" /> কুইক
            </button>
            <button
              onClick={() => setActiveTab("rajuk")}
              className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ms-md-2 mt-2 mt-md-0 ${activeTab === "rajuk" ? "btn-dark shadow-sm" : "btn-light text-secondary"}`}
            >
              <Database size={18} className="me-2 text-warning" /> রাজউক ডাটা
            </button>
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
            <div className="d-flex justify-content-center gap-3 mt-4 mb-5">
              <button onClick={clearAll} className="btn btn-outline-danger px-4 py-2 fw-bold rounded-pill shadow-sm d-flex align-items-center">
                <Trash2 size={18} className="me-2" /> মুছে ফেলুন
              </button>
              <button onClick={calculateDetailed} className="btn btn-success px-5 py-2 fw-bold rounded-pill shadow-lg d-flex align-items-center">
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

        {activeTab === "rajuk" && (
          <div className="row justify-content-center fade-in mb-5">
            <div className="col-lg-8">
              <SmartRajukSearch onUseArea={handleUseArea} compact />
            </div>
          </div>
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