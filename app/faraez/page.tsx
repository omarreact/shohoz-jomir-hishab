"use client";

import { useState } from "react";
import AssetInput from "@/src/features/faraez/components/AssetInput";
import FamilyTreeInput from "@/src/features/faraez/components/FamilyTreeInput";
import { Calculator, HelpCircle, ChevronDown, ChevronUp, MapPinned, ShieldCheck, Trash2 } from "lucide-react";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import dynamic from "next/dynamic";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardContent } from "@/src/shared/ui/Card";
import { useFaraezCalculator } from "@/src/features/faraez/hooks/useFaraezCalculator";

const FaraezResult = dynamic(() => import("@/src/features/faraez/components/FaraezResult"), {
  ssr: false,
  loading: () => (
    <div className="text-center p-5 mt-4">
      <div className="w-10 h-10 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold">বন্টননামা প্রস্তুত করা হচ্ছে...</p>
    </div>
  ),
});

export default function FaraezPage() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const {
    religion,
    setReligion,
    gender,
    setGender,
    assets,
    setAssets,
    gisPlot,
    heirs,
    setHeirs,
    results,
    exportRef,
    calculate,
    clearCalculation,
    downloadPDF,
    downloadExcel,
  } = useFaraezCalculator();

  return (
    <>
      <HeroBanner align="center" badge="উত্তরাধিকার ক্যালকুলেটর" title={<><span>স্মার্ট </span><span className="accent-text">ফারায়েজ</span><span> ও বন্টন</span></>} description="বাংলাদেশী মুসলিম ফারায়েজ ও হিন্দু দায়ভাগ আইন অনুযায়ী পৈতৃক সম্পত্তির নিখুঁত হিসাব করুন মাত্র কয়েক ক্লিকে।" pattern="none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in visible">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 overflow-hidden">
            <button onClick={() => setIsGuideOpen(!isGuideOpen)} className="w-full flex items-center justify-between p-5 text-left text-foreground font-bold hover:bg-muted/50 transition-colors focus:outline-none">
              <div className="flex items-center"><HelpCircle size={20} className="mr-3 text-primary" /> কীভাবে ব্যবহার করবেন? (নির্দেশিকা)</div>
              {isGuideOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isGuideOpen && <div className="p-5 bg-muted/30 border-t border-border text-muted-foreground leading-relaxed"><ol className="list-decimal list-inside space-y-2 ml-2"><li>প্রথমে <strong className="text-foreground">ধর্ম এবং মৃত ব্যক্তির লিঙ্গ</strong> নির্বাচন করুন।</li><li><strong className="text-foreground">সম্পত্তির বিবরণ</strong> অংশে মোট জমি, স্বর্ণ বা নগদ অর্থ দিন।</li><li>নিচের তালিকা থেকে মৃত ব্যক্তির <strong className="text-foreground">জীবিত ওয়ারিশদের সংখ্যা</strong> নির্ধারণ করুন।</li><li>সবশেষে <strong className="text-foreground">সম্পত্তি বন্টন করুন</strong> বাটনে ক্লিক করুন।</li></ol></div>}
          </Card>

          {gisPlot && <Card className="mb-8 border-primary/30 bg-primary/5"><CardContent className="p-5"><div className="flex items-start gap-3"><ShieldCheck className="text-primary mt-0.5" size={22} /><div className="min-w-0"><div className="font-bold text-foreground flex items-center gap-2"><MapPinned size={16} /> RAJUK/GIS যাচাইকৃত প্লট</div><p className="text-sm text-muted-foreground mt-1">এই জমির পরিমাণ সার্ভার-যাচাইকৃত GIS প্লট থেকে এসেছে এবং লক করা আছে।</p><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm"><div><span className="text-muted-foreground">Plot ID</span><div className="font-bold">{gisPlot.plot.plotId}</div></div><div><span className="text-muted-foreground">RS</span><div className="font-bold">{gisPlot.plot.rs || "—"}</div></div><div><span className="text-muted-foreground">জমি (শতাংশ)</span><div className="font-bold text-primary">{gisPlot.plot.a}</div></div><div><span className="text-muted-foreground">উৎস</span><div className="font-bold">RAJUK</div></div></div></div></div></CardContent></Card>}

          <Card className="mb-8"><CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6"><div className="flex-1"><label className="font-bold text-muted-foreground text-sm block mb-3 uppercase tracking-wider">ধর্ম (আইন)</label><div className="flex bg-muted/50 p-1 rounded-xl border border-border"><button onClick={() => setReligion("muslim")} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${religion === "muslim" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>মুসলিম</button><button onClick={() => setReligion("hindu")} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${religion === "hindu" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>হিন্দু (দায়ভাগ)</button></div></div><div className="flex-1"><label className="font-bold text-muted-foreground text-sm block mb-3 uppercase tracking-wider">মৃত ব্যক্তির লিঙ্গ</label><div className="flex bg-muted/50 p-1 rounded-xl border border-border"><button onClick={() => { setGender("male"); setHeirs((h) => ({ ...h, spouse: 1 })); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${gender === "male" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>পুরুষ</button><button onClick={() => { setGender("female"); setHeirs((h) => ({ ...h, spouse: 1 })); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${gender === "female" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>মহিলা</button></div></div></CardContent></Card>

          <div className="space-y-8"><AssetInput assets={assets} setAssets={setAssets} landLocked={Boolean(gisPlot)} /><FamilyTreeInput heirs={heirs} setHeirs={setHeirs} gender={gender} /></div>
          <div className="text-center mt-12 mb-8 flex flex-col sm:flex-row gap-3 justify-center"><button onClick={calculate} className="px-8 py-4 cta-gradient text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-lg hover:-translate-y-1"><Calculator size={24} className="mr-3" /> সম্পত্তি বন্টন করুন</button><button type="button" onClick={clearCalculation} className="px-6 py-4 rounded-full border border-border text-muted-foreground font-bold hover:bg-muted transition-colors flex items-center justify-center"><Trash2 size={20} className="mr-2" /> হিসাব পরিষ্কার করুন</button></div>
          {results.length > 0 && <div className="mt-12 fade-in visible"><FaraezResult results={results} exportRef={exportRef} onDownloadPDF={downloadPDF} onDownloadExcel={downloadExcel} religion={religion} /></div>}
        </div>
        <div className="mt-20"><LatestBlogs /></div>
      </div>
    </>
  );
}
