"use client";

import { useEffect, useRef, useState } from "react";
import AssetInput from "@/src/features/faraez/components/AssetInput";
import FamilyTreeInput from "@/src/features/faraez/components/FamilyTreeInput";
import { Religion, DeceasedGender, HeirsInput, HeirResult, AssetsInput } from "@/src/modules/faraez/types";
import { calculateHinduDayabhaga } from "@/src/modules/faraez/hindu-law";
import { validateMuslimFaraezInput } from "@/src/modules/faraez/validation";
import { calculateFaraez } from "@/src/modules/faraez/faraez.engine";
import type { FaraezInput, FaraezResult as FaraezDomainResult } from "@/src/modules/faraez/contracts";
import { consumePendingPlot } from "@/src/modules/khatiyan/gis-bridge";
import { useHistoryStore } from "@/src/shared/stores/useHistoryStore";
import { Calculator, HelpCircle, ChevronDown, ChevronUp, MapPinned, ShieldCheck, Trash2 } from "lucide-react";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import dynamic from "next/dynamic";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Card, CardContent } from "@/src/shared/ui/Card";

const FaraezResult = dynamic(() => import("@/src/features/faraez/components/FaraezResult"), {
  ssr: false,
  loading: () => <div className="text-center p-5 mt-4"><div className="w-10 h-10 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-4 text-slate-500 dark:text-slate-400 font-bold">বন্টননামা প্রস্তুত করা হচ্ছে...</p></div>,
});

function rationalToNumber(value: { numerator: bigint; denominator: bigint }): number {
  return Number(value.numerator) / Number(value.denominator);
}

function toUiResults(result: FaraezDomainResult, assets: AssetsInput): HeirResult[] {
  const totalLand = assets.land - assets.funeralCost - assets.debt - assets.wasiyat;
  const totalGold = assets.gold;
  const totalCash = assets.cash - assets.funeralCost - assets.debt - assets.wasiyat;
  let measurementIndex = 0;
  return result.allocations.map((allocation) => {
    const fraction = rationalToNumber(allocation.fraction);
    const measurements = result.measurementAllocations.slice(measurementIndex, measurementIndex + allocation.count).map((m) => ({ ana: m.ana, gonda: m.gonda, kora: m.kora, kranti: m.kranti, til: m.til }));
    measurementIndex += allocation.count;
    return {
      heirType: allocation.heirType,
      count: allocation.count,
      fraction,
      totalShare: rationalToNumber(allocation.totalShare),
      reasoning: allocation.reasoning,
      assets: { land: Math.max(0, totalLand) * fraction, gold: Math.max(0, totalGold) * fraction, cash: Math.max(0, totalCash) * fraction },
      measurements,
    };
  });
}

export default function FaraezPage() {
  const [religion, setReligion] = useState<Religion>("muslim");
  const [gender, setGender] = useState<DeceasedGender>("male");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [assets, setAssets] = useState<AssetsInput>({ land: 0, gold: 0, cash: 0, funeralCost: 0, debt: 0, wasiyat: 0 });
  const [gisPlot, setGisPlot] = useState<ReturnType<typeof consumePendingPlot>>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [heirs, setHeirs] = useState<HeirsInput>({ spouse: 1, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0, father: 0, mother: 0, paternalGrandFather: 0, paternalGrandMother: 0, maternalGrandMother: 0, fullBrothers: 0, fullSisters: 0, consanguineBrothers: 0, consanguineSisters: 0, uterineBrothers: 0, uterineSisters: 0, fullBrotherSon: 0, consBrotherSon: 0, fullBrotherSonSon: 0, consBrotherSonSon: 0, fullPaternalUncle: 0, consPaternalUncle: 0, fullCousin: 0, consCousin: 0, fullCousinSon: 0, consCousinSon: 0, fullCousinSonSon: 0, consCousinSonSon: 0 });
  const [results, setResults] = useState<HeirResult[]>([]);

  const saveDraft = useHistoryStore((state) => state.saveDraft);
  const deleteCalculation = useHistoryStore((state) => state.deleteCalculation);
  const faraezDraftIdRef = useRef<string | null>(null);
  const hydratingRef = useRef(true);
  const skipNextAutosaveRef = useRef(false);

  useEffect(() => {
    const historyState = useHistoryStore.getState();
    const activeId = historyState.activeDraftId;
    const activeDraft = activeId ? historyState.drafts[activeId] : null;

    if (!activeDraft || activeDraft.domain !== "faraez") {
      hydratingRef.current = false;
      return;
    }

    faraezDraftIdRef.current = activeDraft.id;

    const input = activeDraft.input as {
      assets?: AssetsInput;
      heirs?: HeirsInput;
      religion?: Religion;
      gender?: DeceasedGender;
    };

    if (input.assets) setAssets(input.assets);
    if (input.heirs) setHeirs(input.heirs);
    if (input.religion) setReligion(input.religion);
    if (input.gender) setGender(input.gender);
    setResults(Array.isArray(activeDraft.result) ? activeDraft.result as HeirResult[] : []);

    if (activeDraft.provenance) {
      setGisPlot(activeDraft.provenance as ReturnType<typeof consumePendingPlot>);
    }

    hydratingRef.current = false;
  }, []);

  useEffect(() => {
    const pending = consumePendingPlot();
    if (!pending) return;
    const land = Number.parseFloat(pending.plot.a);
    if (!Number.isFinite(land) || land <= 0) return;
    setGisPlot(pending);
    setAssets((current) => ({ ...current, land }));
  }, []);

  useEffect(() => {
    if (hydratingRef.current) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const provenance = gisPlot
        ? {
            ...(gisPlot as unknown as Record<string, unknown>),
            source: "rajuk" as const,
            plotId: gisPlot.plot.plotId,
            selectedAt: Date.now(),
          }
        : undefined;

      const id = saveDraft({
        id: faraezDraftIdRef.current ?? undefined,
        domain: "faraez",
        input: { assets, heirs, religion, gender },
        result: results,
        provenance,
        calculationVersion: "v1",
      });

      faraezDraftIdRef.current = id;
    }, 500);

    return () => window.clearTimeout(timer);
  }, [assets, heirs, religion, gender, results, gisPlot, saveDraft]);

  const handleClearCalculation = () => {
    skipNextAutosaveRef.current = true;
    const draftId = faraezDraftIdRef.current;
    if (draftId) deleteCalculation(draftId);
    faraezDraftIdRef.current = null;

    setAssets({ land: 0, gold: 0, cash: 0, funeralCost: 0, debt: 0, wasiyat: 0 });
    setHeirs({ spouse: 1, sons: 0, deadSons: 0, daughters: 0, deadDaughters: 0, father: 0, mother: 0, paternalGrandFather: 0, paternalGrandMother: 0, maternalGrandMother: 0, fullBrothers: 0, fullSisters: 0, consanguineBrothers: 0, consanguineSisters: 0, uterineBrothers: 0, uterineSisters: 0, fullBrotherSon: 0, consBrotherSon: 0, fullBrotherSonSon: 0, consBrotherSonSon: 0, fullPaternalUncle: 0, consPaternalUncle: 0, fullCousin: 0, consCousin: 0, fullCousinSon: 0, consCousinSon: 0, fullCousinSonSon: 0, consCousinSonSon: 0 });
    setReligion("muslim");
    setGender("male");
    setResults([]);
    setGisPlot(null);
  };

  const handleCalculate = () => {
    try {
      if (religion === "muslim") {
        const validationErrors = validateMuslimFaraezInput(heirs, assets);
        if (validationErrors.length > 0) { setResults([]); alert(`ইনপুটে সমস্যা আছে:\n\n${validationErrors.join("\n")}`); return; }
        const input: FaraezInput = { religion: "muslim", deceasedGender: gender, heirs, estate: { land: assets.land, gold: assets.gold, cash: assets.cash, funeralCost: assets.funeralCost, debt: assets.debt, wasiyat: assets.wasiyat }, ruleset: "existing-sunni-project-rules" };
        setResults(toUiResults(calculateFaraez(input), assets));
      } else setResults(calculateHinduDayabhaga(heirs, gender, assets));
      setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (error) { console.error("Faraez calculation failed:", error); setResults([]); alert("হিসাব করা যায়নি। অনুগ্রহ করে ইনপুটগুলো যাচাই করে আবার চেষ্টা করুন।"); }
  };

  const downloadMultiPagePDF = async () => {
    if (!exportRef.current) return;
    const element = exportRef.current; const originalWidth = element.style.width; element.style.width = "800px";
    try { const html2pdf = (await import("html2pdf.js")).default; await html2pdf().set({ margin: [15, 10, 15, 10] as [number, number, number, number], filename: "Faraez_Result.pdf", image: { type: "jpeg" as const, quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, windowWidth: 800 }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const } }).from(element).save(); }
    catch (err) { console.error(err); alert("PDF তৈরিতে সমস্যা হয়েছে।"); } finally { element.style.width = originalWidth; }
  };

  const downloadExcel = () => {
    if (!results.length) return;
    let csvContent = "ওয়ারিশ,অংশ (%),খতিয়ানি অংশ,প্রাপ্ত জমি (শতাংশ),প্রাপ্ত স্বর্ণ (ভরি),প্রাপ্ত অর্থ (টাকা),আইনি ব্যাখ্যা\n";
    results.filter((r) => r.count > 0).forEach((res) => { for (let i = 1; i <= res.count; i++) { const m = res.measurements?.[i - 1]; const measurementText = m ? `${m.ana}A ${m.gonda}G ${m.kora}K ${m.kranti}Kr ${m.til}T` : ""; const heirName = res.count > 1 ? `${res.heirType} ${i}` : res.heirType; csvContent += `${heirName},${res.fraction === 0 ? "বঞ্চিত" : `${(res.fraction * 100).toFixed(2)}%`},${measurementText},${res.assets.land.toFixed(3)},${res.assets.gold.toFixed(3)},${res.assets.cash.toFixed(2)},${res.reasoning.replace(/,/g, " ")}\n`; } });
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "Faraez_Result.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  return <>
    <HeroBanner align="center" badge="উত্তরাধিকার ক্যালকুলেটর" title={<><span>স্মার্ট </span><span className="accent-text">ফারায়েজ</span><span> ও বন্টন</span></>} description="বাংলাদেশী মুসলিম ফারায়েজ ও হিন্দু দায়ভাগ আইন অনুযায়ী পৈতৃক সম্পত্তির নিখুঁত হিসাব করুন মাত্র কয়েক ক্লিকে।" pattern="none" />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 fade-in visible"><div className="max-w-4xl mx-auto">
      <Card className="mb-8 overflow-hidden"><button onClick={() => setIsGuideOpen(!isGuideOpen)} className="w-full flex items-center justify-between p-5 text-left text-foreground font-bold hover:bg-muted/50 transition-colors focus:outline-none"><div className="flex items-center"><HelpCircle size={20} className="mr-3 text-primary" /> কীভাবে ব্যবহার করবেন? (নির্দেশিকা)</div>{isGuideOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>{isGuideOpen && <div className="p-5 bg-muted/30 border-t border-border text-muted-foreground leading-relaxed"><ol className="list-decimal list-inside space-y-2 ml-2"><li>প্রথমে <strong className="text-foreground">ধর্ম এবং মৃত ব্যক্তির লিঙ্গ</strong> নির্বাচন করুন।</li><li><strong className="text-foreground">সম্পত্তির বিবরণ</strong> অংশে মোট জমি, স্বর্ণ বা নগদ অর্থ দিন।</li><li>নিচের তালিকা থেকে মৃত ব্যক্তির <strong className="text-foreground">জীবিত ওয়ারিশদের সংখ্যা</strong> নির্ধারণ করুন।</li><li>সবশেষে <strong className="text-foreground">সম্পত্তি বন্টন করুন</strong> বাটনে ক্লিক করুন।</li></ol></div>}</Card>
      {gisPlot && <Card className="mb-8 border-primary/30 bg-primary/5"><CardContent className="p-5"><div className="flex items-start gap-3"><ShieldCheck className="text-primary mt-0.5" size={22} /><div className="min-w-0"><div className="font-bold text-foreground flex items-center gap-2"><MapPinned size={16} /> RAJUK/GIS যাচাইকৃত প্লট</div><p className="text-sm text-muted-foreground mt-1">এই জমির পরিমাণ সার্ভার-যাচাইকৃত GIS প্লট থেকে এসেছে এবং লক করা আছে।</p><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm"><div><span className="text-muted-foreground">Plot ID</span><div className="font-bold">{gisPlot.plot.plotId}</div></div><div><span className="text-muted-foreground">RS</span><div className="font-bold">{gisPlot.plot.rs || "—"}</div></div><div><span className="text-muted-foreground">জমি (শতাংশ)</span><div className="font-bold text-primary">{gisPlot.plot.a}</div></div><div><span className="text-muted-foreground">উৎস</span><div className="font-bold">RAJUK</div></div></div></div></div></CardContent></Card>}
      <Card className="mb-8"><CardContent className="p-6 flex flex-col md:flex-row justify-between gap-6"><div className="flex-1"><label className="font-bold text-muted-foreground text-sm block mb-3 uppercase tracking-wider">ধর্ম (আইন)</label><div className="flex bg-muted/50 p-1 rounded-xl border border-border"><button onClick={() => setReligion("muslim")} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${religion === "muslim" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>মুসলিম</button><button onClick={() => setReligion("hindu")} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${religion === "hindu" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"}`}>হিন্দু (দায়ভাগ)</button></div></div><div className="flex-1"><label className="font-bold text-muted-foreground text-sm block mb-3 uppercase tracking-wider">মৃত ব্যক্তির লিঙ্গ</label><div className="flex bg-muted/50 p-1 rounded-xl border border-border"><button onClick={() => { setGender("male"); setHeirs((h) => ({ ...h, spouse: 1 })); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${gender === "male" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>পুরুষ</button><button onClick={() => { setGender("female"); setHeirs((h) => ({ ...h, spouse: 1 })); }} className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm ${gender === "female" ? "bg-foreground text-background shadow-md" : "text-muted-foreground"}`}>মহিলা</button></div></div></CardContent></Card>
      <div className="space-y-8"><AssetInput assets={assets} setAssets={setAssets} landLocked={Boolean(gisPlot)} /><FamilyTreeInput heirs={heirs} setHeirs={setHeirs} gender={gender} /></div>
      <div className="text-center mt-12 mb-8 flex flex-col sm:flex-row gap-3 justify-center"><button onClick={handleCalculate} className="px-8 py-4 cta-gradient text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-lg hover:-translate-y-1"><Calculator size={24} className="mr-3" /> সম্পত্তি বন্টন করুন</button><button type="button" onClick={handleClearCalculation} className="px-6 py-4 rounded-full border border-border text-muted-foreground font-bold hover:bg-muted transition-colors flex items-center justify-center"><Trash2 size={20} className="mr-2" /> হিসাব পরিষ্কার করুন</button></div>
      {results.length > 0 && <div className="mt-12 fade-in visible"><FaraezResult results={results} exportRef={exportRef} onDownloadPDF={downloadMultiPagePDF} onDownloadExcel={downloadExcel} religion={religion} /></div>}
    </div><div className="mt-20"><LatestBlogs /></div></div>
  </>;
}
