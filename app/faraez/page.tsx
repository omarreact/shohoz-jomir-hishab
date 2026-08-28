"use client";

import { useState, useRef } from "react";
import AppHeader from "@/src/shared/components/AppHeader";
import AdBanner from "@/src/shared/components/AdBanner";
import AssetInput from "@/src/features/faraez/components/AssetInput";
import FamilyTreeInput from "@/src/features/faraez/components/FamilyTreeInput";
import { Religion, DeceasedGender, HeirsInput, HeirResult, AssetsInput } from "@/src/modules/faraez/types";
import { calculateMuslimFaraez } from "@/src/modules/faraez/muslim-law";
import { calculateHinduDayabhaga } from "@/src/modules/faraez/hindu-law";
import { validateMuslimFaraezInput } from "@/src/modules/faraez/validation";
import { prepareFaraezEstate } from "@/src/modules/faraez/estate";
import { applySunniAdjustments } from "@/src/modules/faraez/sunni-adjustments";
import { Calculator, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import dynamic from "next/dynamic";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardContent } from "@/src/shared/ui/Card";

const FaraezResult = dynamic(() => import("@/src/features/faraez/components/FaraezResult"), {
  ssr: false,
  loading: () => (
    <div className="text-center p-5 mt-4">
      <div className="w-10 h-10 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-slate-500 dark:text-slate-400 font-bold">বন্টননামা প্রস্তুত করা হচ্ছে...</p>
    </div>
  ),
});

export default function FaraezPage() {
  const [religion, setReligion] = useState<Religion>("muslim");
  const [gender, setGender] = useState<DeceasedGender>("male");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [assets, setAssets] = useState<AssetsInput>({ land: 0, gold: 0, cash: 0, funeralCost: 0, debt: 0, wasiyat: 0 });
  const exportRef = useRef<HTMLDivElement | null>(null);

  const [heirs, setHeirs] = useState<HeirsInput>({
    spouse: 1, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0, father: 0, mother: 0,
    paternalGrandFather: 0, paternalGrandMother: 0, maternalGrandMother: 0,
    fullBrothers: 0, fullSisters: 0, consanguineBrothers: 0, consanguineSisters: 0,
    uterineBrothers: 0, uterineSisters: 0, fullBrotherSon: 0, consBrotherSon: 0,
    fullBrotherSonSon: 0, consBrotherSonSon: 0, fullPaternalUncle: 0, consPaternalUncle: 0,
    fullCousin: 0, consCousin: 0, fullCousinSon: 0, consCousinSon: 0,
    fullCousinSonSon: 0, consCousinSonSon: 0,
  });
  const [results, setResults] = useState<HeirResult[]>([]);

  const handleCalculate = () => {
    try {
      if (religion === "muslim") {
        const validationErrors = validateMuslimFaraezInput(heirs, assets);
        if (validationErrors.length > 0) {
          setResults([]);
          alert(`ইনপুটে সমস্যা আছে:\n\n${validationErrors.join("\n")}`);
          return;
        }
        const preparedEstate = prepareFaraezEstate(assets);
        const baseResults = calculateMuslimFaraez(heirs, gender, preparedEstate.assets);
        setResults(applySunniAdjustments(heirs, gender, baseResults));
      } else {
        setResults(calculateHinduDayabhaga(heirs, gender, assets));
      }
      setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) {
      console.error("Faraez calculation failed:", error);
      setResults([]);
      alert("হিসাব করা যায়নি। অনুগ্রহ করে ইনপুটগুলো যাচাই করে আবার চেষ্টা করুন।");
    }
  };

  const downloadMultiPagePDF = async () => {
    if (!exportRef.current) return;
    const element = exportRef.current;
    const originalWidth = element.style.width;
    element.style.width = "800px";
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [15, 10, 15, 10] as [number, number, number, number],
        filename: "Faraez_Result.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("PDF তৈরিতে সমস্যা হয়েছে।");
    } finally {
      element.style.width = originalWidth;
    }
  };

  const downloadExcel = () => {
    if (!results || results.length === 0) return;
    let csvContent = "ওয়ারিশ,অংশ (%),প্রাপ্ত জমি (শতাংশ),প্রাপ্ত স্বর্ণ (ভরি),প্রাপ্ত অর্থ (টাকা),আইনি ব্যাখ্যা\n";
    results.filter((r) => r.count > 0).forEach((res) => {
      for (let i = 1; i <= res.count; i++) {
        const isExcluded = res.fraction === 0;
        const heirName = res.count > 1 ? `${res.heirType} ${i}` : res.heirType;
        const fractionText = isExcluded ? "বঞ্চিত" : `${(res.fraction * 100).toFixed(2)}%`;
        const land = res.assets.land > 0 ? res.assets.land.toFixed(3) : "0";
        const gold = res.assets.gold > 0 ? res.assets.gold.toFixed(3) : "0";
        const cash = res.assets.cash > 0 ? res.assets.cash.toFixed(2) : "0";
        const reasoning = res.reasoning.replace(/,/g, " ");
        csvContent += `${heirName},${fractionText},${land},${gold},${cash},${reasoning}\n`;
      }
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Faraez_Result.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            {isGuideOpen && <div className="p-5 bg-muted/30 border-t border-border text-muted-foreground leading-relaxed animate-in slide-in-from-top-2"><ol className="list-decimal list-inside space-y-2 ml-2"><li>প্রথমে <strong className="text-foreground">ধর্ম এবং মৃত ব্যক্তির লিঙ্গ</strong> নির্বাচন করুন।</li><li><strong className="text-foreground">সম্পত্তির বিবরণ</strong> অংশে মোট জমি, স্বর্ণ বা নগদ অর্থ দিন (এটি না দিলেও শুধু অংশের হার দেখা যাবে)।</li><li>নিচের তালিকা থেকে মৃত ব্যক্তির <strong className="text-foreground">জীবিত ওয়ারিশদের সংখ্যা</strong> (+ বা -) বাটনে চেপে নির্ধারণ করুন।</li><li>সবশেষে <strong className="text-foreground">সম্পত্তি বন্টন করুন</strong> বাটনে ক্লিক করলে প্রত্যেকের প্রাপ্ত অংশ দেখতে পাবেন।</li></ol></div>}
          </Card>
          <Card className="mb-8"><CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6">
            <div className="flex-1"><label className="font-bold text-muted-foreground text-sm block mb-3 uppercase tracking-wider">ধর্ম (আইন)</label><div className="flex bg-muted/50 p-1 rounded-xl border border-border"><button onClick={() => setReligion("muslim")} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all focus:outline-none ${religion === "muslim" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>মুসলিম</button><button onClick={() => setReligion("hindu")} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all focus:outline-none ${religion === "hindu" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>হিন্দু (দায়ভাগ)</button></div></div>
            <div className="flex-1"><label className="font-bold text-muted-foreground text-sm block mb-3 uppercase tracking-wider">মৃত ব্যক্তির লিঙ্গ</label><div className="flex bg-muted/50 p-1 rounded-xl border border-border"><button onClick={() => { setGender("male"); setHeirs((h) => ({ ...h, spouse: 1 })); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all focus:outline-none ${gender === "male" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:text-foreground"}`}>পুরুষ</button><button onClick={() => { setGender("female"); setHeirs((h) => ({ ...h, spouse: 1 })); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all focus:outline-none ${gender === "female" ? "bg-foreground text-background shadow-md" : "text-muted-foreground hover:text-foreground"}`}>মহিলা</button></div></div>
          </CardContent></Card>
          <div className="space-y-8"><AssetInput assets={assets} setAssets={setAssets} /><FamilyTreeInput heirs={heirs} setHeirs={setHeirs} gender={gender} /></div>
          <div className="text-center mt-12 mb-8"><button onClick={handleCalculate} className="px-8 py-4 cta-gradient text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center mx-auto text-lg hover:-translate-y-1"><Calculator size={24} className="mr-3" /> সম্পত্তি বন্টন করুন</button></div>
          {results.length > 0 && <div className="mt-12 fade-in visible" id="resultSection"><FaraezResult results={results} exportRef={exportRef} onDownloadPDF={downloadMultiPagePDF} onDownloadExcel={downloadExcel} religion={religion} /></div>}
        </div>
        <div className="mt-20"><LatestBlogs /></div>
      </div>
    </>
  );
}
