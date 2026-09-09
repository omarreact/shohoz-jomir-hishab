"use client";

import { useRef, useState } from "react";
import { List, Zap, Calculator, Trash2, Printer } from "lucide-react";
import PrintStyles from "@/src/shared/components/PrintStyles";
import DetailedCalculator from "@/src/features/khatiyan/components/DetailedCalculator";
import QuickCalculator from "@/src/features/khatiyan/components/QuickCalculator";
import ResultSection from "@/src/features/khatiyan/components/ResultSection";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { useKhatiyanCalculator } from "@/src/features/khatiyan/hooks/useKhatiyanCalculator";

export default function SmartKhatiyanApp() {
  const [activeTab, setActiveTab] = useState("detailed");
  const exportRef = useRef<HTMLDivElement | null>(null);
  const {
    plots,
    owners,
    detailedResults,
    quickData,
    quickResult,
    validationAttempted,
    totalOwnerTil,
    addPlot,
    removePlot,
    updatePlot,
    addOwner,
    removeOwner,
    updateOwner,
    calculateDetailed,
    calculateQuick,
    clearAll,
    handleQuickDataChange,
  } = useKhatiyanCalculator();

  return <>
    <HeroBanner align="center" badge="খতিয়ান ক্যালকুলেটর" title={<>স্মার্ট <span className="text-[#1A6B3C]">খতিয়ান</span> হিসাব</>} description="খতিয়ানের আনা, গন্ডা, কড়া, ক্রান্তি ও তিল দিয়ে জমির হিস্যা বের করুন।" pattern="none" />
    <PrintStyles />
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 no-print">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-10 flex justify-center"><TabsList className="h-auto rounded-full border bg-slate-100 p-1 dark:bg-slate-900"><TabsTrigger value="detailed" className="min-h-11 rounded-full px-6 py-3 font-bold"><List size={18} className="mr-2" /> বিস্তারিত হিসাব</TabsTrigger><TabsTrigger value="quick" className="min-h-11 rounded-full px-6 py-3 font-bold"><Zap size={18} className="mr-2" /> কুইক</TabsTrigger></TabsList></div>
        <TabsContent value="detailed" className="mt-0"><div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900 md:p-8"><DetailedCalculator validationAttempted={validationAttempted} plots={plots} owners={owners} totalOwnerTil={totalOwnerTil} onAddPlot={addPlot} onRemovePlot={removePlot} onUpdatePlot={updatePlot} onAddOwner={addOwner} onRemoveOwner={removeOwner} onUpdateOwner={updateOwner} /><div className="mt-8 flex flex-col justify-center gap-3 border-t pt-8 sm:flex-row"><button onClick={clearAll} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-500 px-6 py-3 font-bold text-red-500"><Trash2 size={18} className="mr-2" /> মুছে ফেলুন</button><button onClick={calculateDetailed} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1A6B3C] px-8 py-3 font-bold text-white"><Calculator size={18} className="mr-2" /> হিসাব করুন</button></div></div></TabsContent>
        <TabsContent value="quick" className="mt-0"><div className="mx-auto max-w-3xl rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900 md:p-8"><QuickCalculator quickData={quickData} quickResult={quickResult} onQuickDataChange={handleQuickDataChange} onCalculateQuick={calculateQuick} /></div></TabsContent>
      </Tabs>
      {detailedResults && <div className="no-print mx-auto mt-5 flex max-w-7xl justify-end"><button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--secondary)]"><Printer size={16} /> প্রিন্ট করুন</button></div>}
      <ResultSection detailedResults={detailedResults} exportRef={exportRef} onDownloadPDF={() => window.print()} onDownloadExcel={() => {}} />
    </div>
  </>;
}
