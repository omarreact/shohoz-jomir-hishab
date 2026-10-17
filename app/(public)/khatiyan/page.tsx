"use client";
import MobilePageIntro from "@/src/shared/components/MobilePageIntro";
import ServicePaywallGate from "@/src/components/services/ServicePaywallGate";

import { useRef, useState } from "react";
import { List, Zap, Calculator, Trash2 } from "lucide-react";
import DetailedCalculator from "@/src/features/khatiyan/components/DetailedCalculator";
import QuickCalculator from "@/src/features/khatiyan/components/QuickCalculator";
import ResultSection from "@/src/features/khatiyan/components/ResultSection";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";
import { useKhatiyanCalculator } from "@/src/features/khatiyan/hooks/useKhatiyanCalculator";

export default function SmartKhatiyanApp() {
  const [activeTab, setActiveTab] = useState("detailed");
  const [confirmClear, setConfirmClear] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const {
    plots,
    owners,
    detailedResults,
    quickData,
    quickResult,
    validationAttempted,
    errorMessage,
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

  const clearWithConfirmation = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAll();
    setConfirmClear(false);
  };

  return <ServicePaywallGate serviceId="khatiyan">
    <MobilePageIntro eyebrow="খতিয়ান ও রেকর্ড" title="খতিয়ান হিসাব" description="মালিকের অংশ ও জমির পরিমাণ দিয়ে হিস্যা গণনা করুন।" />
      <div className="hidden md:block"><HeroBanner align="center" badge="খতিয়ান ক্যালকুলেটর" title={<>স্মার্ট <span className="text-[#1A6B3C]">খতিয়ান</span> হিসাব</>} description="জমির পরিমাণ ও মালিকদের অংশ লিখে হিস্যা বের করুন। বিস্তারিত ও দ্রুত হিসাবের জন্য নিচের ট্যাব ব্যবহার করুন।" pattern="none" /></div>
    <div className="no-print mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-12 lg:px-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-5 flex justify-center sm:mb-10"><TabsList className="grid h-auto w-full max-w-lg grid-cols-2 rounded-2xl border bg-[var(--secondary)] p-1"><TabsTrigger value="detailed" className="min-h-12 rounded-xl px-2 py-3 text-xs font-black sm:px-6 sm:text-sm"><List size={18} className="mr-2" /> বিস্তারিত হিসাব</TabsTrigger><TabsTrigger value="quick" className="min-h-12 rounded-xl px-2 py-3 text-xs font-black sm:px-6 sm:text-sm"><Zap size={18} className="mr-2" /> কুইক</TabsTrigger></TabsList></div>
        <TabsContent value="detailed" className="mt-0"><div className="rounded-3xl border bg-white p-3 shadow-sm dark:bg-slate-900 sm:p-6 md:p-8"><DetailedCalculator validationAttempted={validationAttempted} plots={plots} owners={owners} totalOwnerTil={totalOwnerTil} onAddPlot={addPlot} onRemovePlot={removePlot} onUpdatePlot={updatePlot} onAddOwner={addOwner} onRemoveOwner={removeOwner} onUpdateOwner={updateOwner} /><div className="mt-8 flex flex-col justify-center gap-3 border-t pt-8 sm:flex-row"><button onClick={clearWithConfirmation} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-500 px-6 py-3 font-bold text-red-500"><Trash2 size={18} className="mr-2" /> {confirmClear ? "নিশ্চিত করুন" : "মুছে ফেলুন"}</button><button onClick={calculateDetailed} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1A6B3C] px-8 py-3 font-bold text-white"><Calculator size={18} className="mr-2" /> হিসাব করুন</button></div></div></TabsContent>
        <TabsContent value="quick" className="mt-0"><div className="mx-auto max-w-3xl rounded-3xl border bg-white p-3 shadow-sm dark:bg-slate-900 sm:p-6 md:p-8"><QuickCalculator quickData={quickData} quickResult={quickResult} onQuickDataChange={handleQuickDataChange} onCalculateQuick={calculateQuick} /></div></TabsContent>
      </Tabs>
      {confirmClear ? (
        <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          সব তথ্য মুছতে আবার “নিশ্চিত করুন” চাপুন।
          <button type="button" onClick={() => setConfirmClear(false)} className="min-h-11 rounded-xl border border-amber-300 px-4">বাতিল</button>
        </div>
      ) : null}
      {errorMessage ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{errorMessage}</div>
      ) : null}
      <ResultSection detailedResults={detailedResults} exportRef={exportRef} />
    </div>
  </ServicePaywallGate>;
}
