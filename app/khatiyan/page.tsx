"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { List, Zap, Calculator, Trash2, Database } from "lucide-react";
import { FULL_UNIT_TIL } from "@/src/shared/constants";
import { toBn, toEn, makeBanglaStr } from "@/src/shared/utils";
import { buildDetailedResults } from "@/src/modules/khatiyan/calculations";
import PrintStyles from "@/src/shared/components/PrintStyles";
import DetailedCalculator from "@/src/features/khatiyan/components/DetailedCalculator";
import QuickCalculator from "@/src/features/khatiyan/components/QuickCalculator";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import SearchPanel from "@/src/features/search/components/SearchPanel";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";

const ResultSection = dynamic(
  () => import("@/src/features/khatiyan/components/ResultSection"),
  {
    ssr: false,
    loading: () => (
      <div className="text-center p-5 mt-4 text-[var(--text-secondary)]">
        লোড হচ্ছে...
      </div>
    ),
  },
);

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
import type { RelationTypeBn } from "@/src/shared/types";

type Owner = {
  id: number;
  n: string;
  rType: RelationTypeBn;
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
      } catch (e) {}
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
      setQuickResult({
        land: total * share,
        sqft: total * share * 435.6,
        katha: (total * share) / 1.65,
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

  const handleQuickDataChange = (newData: Partial<QuickData>) => {
    setQuickData((prev) => ({
      ...prev,
      ...newData,
      ...(newData.totalLand !== undefined && {
        totalLand: makeBanglaStr(newData.totalLand),
      }),
    }));
  };

  const handleUseArea = (decimalArea: number, dagNo: string, type: string) => {
    if (plots.length === 0) {
      alert("খতিয়ানে কমপক্ষে একটি প্লট বা দাগ থাকা আবশ্যক!");
      return;
    }
    updatePlot(plots[0].id, "a", decimalArea.toFixed(2));
    updatePlot(plots[0].id, "rs", type !== "ms_plot_no" ? toBn(dagNo) : "");
    setActiveTab("detailed");
  };

  const downloadMultiPagePDF = async () => {};
  const downloadExcel = () => {};

  return (
    <>
      <HeroBanner
        align="center"
        badge="খতিয়ান ক্যালকুলেটর"
        title={
          <>
            স্মার্ট <span className="accent-text">খতিয়ান</span> হিসাব
          </>
        }
        description="খতিয়ানের আনা, গন্ডা, কড়া, ক্রান্তি ও তিল দিয়ে জমির হিস্যা বের করুন এবং রাজউক ম্যাপ থেকে দাগের তথ্য আনুন।"
        pattern="none"
      />
      <PrintStyles />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 no-print fade-in visible">
        <Tabs defaultValue="detailed" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-10">
            <TabsList className="bg-card border border-border rounded-full p-1 h-auto shadow-sm">
              <TabsTrigger
                value="detailed"
                className="rounded-full px-6 py-3 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all text-muted-foreground"
              >
                <List size={18} className="mr-2" /> বিস্তারিত হিসাব
              </TabsTrigger>
              <TabsTrigger
                value="quick"
                className="rounded-full px-6 py-3 font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-muted-foreground"
              >
                <Zap size={18} className="mr-2" /> কুইক
              </TabsTrigger>
              <TabsTrigger
                value="rajuk"
                className="rounded-full px-6 py-3 font-bold data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md transition-all text-muted-foreground"
              >
                <Database size={18} className="mr-2 text-yellow-500" /> রাজউক ডাটা
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="detailed" className="mt-0 outline-none">
            <div className="card-new p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 visible">
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
              <div className="flex justify-center gap-4 mt-8 mb-4 border-t border-border pt-8">
                <button
                  onClick={clearAll}
                  className="px-6 py-3 font-bold rounded-xl border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center"
                >
                  <Trash2 size={18} className="mr-2" /> মুছে ফেলুন
                </button>
                <button
                  onClick={calculateDetailed}
                  className="px-8 py-3 cta-gradient text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow flex items-center"
                >
                  <Calculator size={18} className="mr-2" /> হিসাব করুন
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quick" className="mt-0 outline-none">
            <div className="card-new p-6 md:p-8 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300 visible">
              <QuickCalculator
                quickData={quickData}
                quickResult={quickResult}
                onQuickDataChange={handleQuickDataChange}
                onCalculateQuick={calculateQuick}
              />
            </div>
          </TabsContent>

          <TabsContent value="rajuk" className="mt-0 outline-none">
            <div className="flex justify-center animate-in fade-in zoom-in-95 duration-300 mb-10 visible">
              <div className="w-full max-w-4xl card-new p-6 md:p-8">
                <SearchPanel onUseArea={handleUseArea} compact />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <ResultSection
          detailedResults={detailedResults}
          exportRef={exportRef}
          onDownloadPDF={downloadMultiPagePDF}
          onDownloadExcel={downloadExcel}
        />
        <div className="mt-20">
          <LatestBlogs />
        </div>
      </div>
    </>
  );
}
