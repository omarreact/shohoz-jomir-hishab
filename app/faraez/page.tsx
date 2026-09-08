"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Calculator, HelpCircle, ChevronDown, ChevronUp, MapPinned, ShieldCheck, Trash2 } from "lucide-react";
import AssetInput from "@/src/features/faraez/components/AssetInput";
import FamilyTreeInput from "@/src/features/faraez/components/FamilyTreeInput";
import { useFaraezCalculator } from "@/src/features/faraez/hooks/useFaraezCalculator";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardContent } from "@/src/shared/ui/Card";

const FaraezResult = dynamic(() => import("@/src/features/faraez/components/FaraezResult"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 p-5 text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#006a4e] border-t-transparent" />
      <p className="mt-4 font-bold text-slate-500 dark:text-slate-400">বন্টননামা প্রস্তুত করা হচ্ছে...</p>
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
  } = useFaraezCalculator();

  return (
    <>
      <HeroBanner
        align="center"
        badge="উত্তরাধিকার ক্যালকুলেটর"
        title={<><span>স্মার্ট </span><span className="accent-text">ফারায়েজ</span><span> ও বন্টন</span></>}
        description="বাংলাদেশী মুসলিম ফারায়েজ ও হিন্দু দায়ভাগ আইন অনুযায়ী পৈতৃক সম্পত্তির নিখুঁত হিসাব করুন মাত্র কয়েক ক্লিকে।"
        pattern="none"
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 fade-in visible">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-8 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsGuideOpen((value) => !value)}
              className="flex w-full items-center justify-between p-5 text-left font-bold text-foreground transition-colors hover:bg-muted/50 focus:outline-none"
            >
              <div className="flex items-center"><HelpCircle size={20} className="mr-3 text-primary" /> কীভাবে ব্যবহার করবেন? (নির্দেশিকা)</div>
              {isGuideOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isGuideOpen ? (
              <div className="border-t border-border bg-muted/30 p-5 leading-relaxed text-muted-foreground">
                <ol className="ml-2 list-inside list-decimal space-y-2">
                  <li>প্রথমে <strong className="text-foreground">ধর্ম এবং মৃত ব্যক্তির লিঙ্গ</strong> নির্বাচন করুন।</li>
                  <li><strong className="text-foreground">সম্পত্তির বিবরণ</strong> অংশে মোট জমি, স্বর্ণ বা নগদ অর্থ দিন।</li>
                  <li>নিচের তালিকা থেকে মৃত ব্যক্তির <strong className="text-foreground">জীবিত ওয়ারিশদের সংখ্যা</strong> নির্ধারণ করুন।</li>
                  <li>সবশেষে <strong className="text-foreground">সম্পত্তি বন্টন করুন</strong> বাটনে ক্লিক করুন।</li>
                </ol>
              </div>
            ) : null}
          </Card>

          {gisPlot ? (
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-primary" size={22} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-bold text-foreground"><MapPinned size={16} /> রাজউক/জিআইএস যাচাইকৃত প্লট</div>
                    <p className="mt-1 text-sm text-muted-foreground">এই জমির পরিমাণ সার্ভার-যাচাইকৃত জিআইএস প্লট থেকে এসেছে এবং লক করা আছে।</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div><span className="text-muted-foreground">প্লট আইডি</span><div className="font-bold">{gisPlot.plot.plotId}</div></div>
                      <div><span className="text-muted-foreground">আরএস</span><div className="font-bold">{gisPlot.plot.rs || "—"}</div></div>
                      <div><span className="text-muted-foreground">জমি (শতাংশ)</span><div className="font-bold text-primary">{gisPlot.plot.a}</div></div>
                      <div><span className="text-muted-foreground">উৎস</span><div className="font-bold">রাজউক</div></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="mb-8">
            <CardContent className="flex flex-col justify-between gap-6 p-6 md:flex-row">
              <div className="flex-1">
                <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-muted-foreground">ধর্ম (আইন)</label>
                <div className="flex rounded-xl border border-border bg-muted/50 p-1">
                  <button type="button" onClick={() => setReligion("muslim")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${religion === "muslim" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>মুসলিম</button>
                  <button type="button" onClick={() => setReligion("hindu")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${religion === "hindu" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>হিন্দু (দায়ভাগ)</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-muted-foreground">মৃত ব্যক্তির লিঙ্গ</label>
                <div className="flex rounded-xl border border-border bg-muted/50 p-1">
                  <button type="button" onClick={() => { setGender("male"); setHeirs((value) => ({ ...value, spouse: 1 })); }} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${gender === "male" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>পুরুষ</button>
                  <button type="button" onClick={() => { setGender("female"); setHeirs((value) => ({ ...value, spouse: 1 })); }} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${gender === "female" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>মহিলা</button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <AssetInput assets={assets} setAssets={setAssets} landLocked={Boolean(gisPlot)} />
            <FamilyTreeInput heirs={heirs} setHeirs={setHeirs} gender={gender} />
          </div>

          <div className="mb-8 mt-12 flex flex-col justify-center gap-3 text-center sm:flex-row">
            <button type="button" onClick={calculate} className="cta-gradient flex items-center justify-center rounded-full px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"><Calculator size={24} className="mr-3" /> সম্পত্তি বন্টন করুন</button>
            <button type="button" onClick={clearCalculation} className="flex items-center justify-center rounded-full border border-border px-6 py-4 font-bold text-muted-foreground transition-colors hover:bg-muted"><Trash2 size={20} className="mr-2" /> হিসাব পরিষ্কার করুন</button>
          </div>

          {results.length > 0 ? (
            <div className="mt-12 fade-in visible">
              <FaraezResult results={results} exportRef={exportRef} religion={religion} />
            </div>
          ) : null}
        </div>

        <div className="mt-20"><LatestBlogs /></div>
      </div>
    </>
  );
}
