"use client";

import { useEffect, useRef, useState } from "react";
import { List, Zap, Calculator, Trash2, Printer, MapPinned, ShieldCheck } from "lucide-react";
import { FULL_UNIT_TIL } from "@/src/shared/constants";
import { toBn, toEn, makeBanglaStr } from "@/src/shared/utils";
import { buildDetailedResults } from "@/src/modules/khatiyan/calculations";
import { useKhatiyanGisBridge } from "@/src/modules/khatiyan/gis-bridge";
import { useHistoryStore } from "@/src/shared/stores/useHistoryStore";
import PrintStyles from "@/src/shared/components/PrintStyles";
import DetailedCalculator from "@/src/features/khatiyan/components/DetailedCalculator";
import QuickCalculator from "@/src/features/khatiyan/components/QuickCalculator";
import ResultSection from "@/src/features/khatiyan/components/ResultSection";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/shared/ui/tabs";

type Plot = { id: number; cs: string; rs: string; city: string; bds: string; t: string; a: string };
type Owner = { id: number; n: string; rType: any; rName: string; a: number; g: number; k: number; kr: number; ti: number };
type QuickData = { totalLand: string; a: number; g: number; k: number; kr: number; ti: number };
type QuickResult = { land: number; sqft: number; katha: number };
const initialPlot = (id: number): Plot => ({ id, cs: "", rs: "", city: "", bds: "", t: "", a: "" });
const initialOwner = (id: number): Owner => ({ id, n: "", rType: "পিতা", rName: "", a: 0, g: 0, k: 0, kr: 0, ti: 0 });

export default function SmartKhatiyanApp() {
  const [activeTab, setActiveTab] = useState("detailed");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const nextPlotId = useRef(3);
  const nextOwnerId = useRef(4);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const historyDraftId = useRef<string | undefined>(undefined);
  const historyHydrated = useRef(false);
  const [plots, setPlots] = useState<Plot[]>([initialPlot(1)]);
  const [owners, setOwners] = useState<Owner[]>([initialOwner(2)]);
  const [detailedResults, setDetailedResults] = useState<any[] | null>(null);
  const [quickData, setQuickData] = useState<QuickData>({ totalLand: "", a: 0, g: 0, k: 0, kr: 0, ti: 0 });
  const [quickResult, setQuickResult] = useState<QuickResult | null>(null);
  const [gisSelection, setGisSelection] = useState<ReturnType<typeof useKhatiyanGisBridge.getState>["pendingPlot"]>(null);

  useEffect(() => {
    const state = useHistoryStore.getState();
    const activeId = state.activeDraftId;
    const activeDraft = activeId ? state.drafts[activeId] : null;
    const existingId = activeDraft?.domain === "khatiyan"
      ? activeDraft.id
      : state.history.find((id) => state.drafts[id]?.domain === "khatiyan");
    if (existingId) {
      const draft = state.loadDraft(existingId);
      if (draft?.domain === "khatiyan") {
        const input = draft.input as Partial<{ plots: Plot[]; owners: Owner[]; quickData: QuickData; quickResult: QuickResult | null }>;
        if (input.plots?.length) setPlots(input.plots);
        if (input.owners?.length) setOwners(input.owners);
        if (input.quickData) setQuickData(input.quickData);
        if (input.quickResult !== undefined) setQuickResult(input.quickResult);
        if (draft.result) setDetailedResults(draft.result as any[]);
        if (draft.provenance?.source === "rajuk") {
          setGisSelection({
            plot: draft.provenance.plot as never,
            source: "rajuk",
            selectedAt: Number(draft.provenance.selectedAt ?? Date.now()),
            selectionId: String(draft.provenance.selectionId ?? draft.id),
          });
        }
        historyDraftId.current = draft.id;
      }
    }

    const pending = useKhatiyanGisBridge.getState().consumePendingPlot();
    if (pending) {
      setGisSelection(pending);
      setPlots([pending.plot]);
      setDetailedResults(null);
      setValidationAttempted(false);
      historyDraftId.current = undefined;
    }
    historyHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!historyHydrated.current) return;
    const timer = window.setTimeout(() => {
      historyDraftId.current = useHistoryStore.getState().saveDraft({
        id: historyDraftId.current,
        domain: "khatiyan",
        input: { plots, owners, quickData, quickResult },
        result: detailedResults,
        provenance: gisSelection
          ? {
              source: gisSelection.source,
              plotId: gisSelection.plot.plotId,
              selectionId: gisSelection.selectionId,
              selectedAt: gisSelection.selectedAt,
              measurementProfile: gisSelection.plot.measurementProfile,
              shapeAreaUnit: gisSelection.plot.shapeAreaUnit,
              lockedArea: gisSelection.plot.a,
              plot: gisSelection.plot,
            }
          : undefined,
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [plots, owners, quickData, quickResult, detailedResults, gisSelection]);

  const addPlot = () => setPlots((p) => [...p, initialPlot(nextPlotId.current++)]);
  const removePlot = (id: number) => setPlots((p) => p.filter((x) => x.id !== id));
  const updatePlot = (id: number, field: keyof Plot, value: string) => setPlots((p) => p.map((x) => x.id === id ? { ...x, [field]: ["cs", "rs", "city", "bds", "a"].includes(field) ? makeBanglaStr(value) : value } : x));
  const addOwner = () => setOwners((p) => [...p, initialOwner(nextOwnerId.current++)]);
  const removeOwner = (id: number) => setOwners((p) => p.filter((x) => x.id !== id));
  const updateOwner = <K extends keyof Owner>(id: number, field: K, value: Owner[K]) => setOwners((p) => p.map((x) => x.id === id ? { ...x, [field]: value } : x));
  const totalOwnerTil = owners.reduce((s, o) => s + Number(o.a) * 4800 + Number(o.g) * 240 + Number(o.k) * 60 + Number(o.kr) * 20 + Number(o.ti), 0);

  const calculateDetailed = () => {
    setValidationAttempted(true);
    try {
      const { hasData, computedResults } = buildDetailedResults(owners, plots, FULL_UNIT_TIL, toEn, toBn);
      if (hasData && computedResults.length) {
        setDetailedResults(computedResults);
        setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 50);
      } else alert("কমপক্ষে একজন মালিকের অংশ এবং জমির পরিমাণ ইনপুট দিন।");
    } catch (error) {
      alert(error instanceof Error ? error.message : "হিসাব করা যায়নি।");
      setDetailedResults(null);
    }
  };

  const calculateQuick = () => {
    const total = toEn(quickData.totalLand);
    const shareTil = Number(quickData.a) * 4800 + Number(quickData.g) * 240 + Number(quickData.k) * 60 + Number(quickData.kr) * 20 + Number(quickData.ti);
    const share = shareTil / FULL_UNIT_TIL;
    if (total > 0 && share > 0) setQuickResult({ land: total * share, sqft: total * share * 435.6, katha: total * share / 1.65 });
    else alert("দয়া করে জমির পরিমাণ এবং অংশ সঠিক ভাবে দিন।");
  };

  const clearAll = () => {
    if (!confirm("সব ডাটা মুছে ফেলতে চান?")) return;
    nextPlotId.current = 3; nextOwnerId.current = 4;
    setPlots([initialPlot(1)]); setOwners([initialOwner(2)]); setDetailedResults(null); setQuickData({ totalLand: "", a: 0, g: 0, k: 0, kr: 0, ti: 0 }); setQuickResult(null); setValidationAttempted(false); setGisSelection(null); useKhatiyanGisBridge.getState().clearPendingPlot();
    if (historyDraftId.current) useHistoryStore.getState().deleteCalculation(historyDraftId.current);
    historyDraftId.current = undefined;
  };
  const handleQuickDataChange = (d: Partial<QuickData>) => setQuickData((p) => ({ ...p, ...d, ...(d.totalLand !== undefined ? { totalLand: makeBanglaStr(d.totalLand) } : {}) }));

  return <>
    <HeroBanner align="center" badge="খতিয়ান ক্যালকুলেটর" title={<>স্মার্ট <span className="text-[#1A6B3C]">খতিয়ান</span> হিসাব</>} description="খতিয়ানের আনা, গন্ডা, কড়া, ক্রান্তি ও তিল দিয়ে জমির হিস্যা বের করুন।" pattern="none" />
    <PrintStyles />
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 no-print">
      {gisSelection && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><MapPinned className="mt-0.5 shrink-0" size={20} /><div><p className="font-bold">RAJUK GIS প্লট সংযুক্ত হয়েছে</p><p className="text-sm">Plot ID: {gisSelection.plot.id} · রেকর্ডকৃত এলাকা: <strong>{gisSelection.plot.a} শতাংশ</strong></p></div></div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold"><ShieldCheck size={15} /> Server validated</span>
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-10 flex justify-center"><TabsList className="h-auto rounded-full border bg-slate-100 p-1 dark:bg-slate-900"><TabsTrigger value="detailed" className="min-h-11 rounded-full px-6 py-3 font-bold"><List size={18} className="mr-2" /> বিস্তারিত হিসাব</TabsTrigger><TabsTrigger value="quick" className="min-h-11 rounded-full px-6 py-3 font-bold"><Zap size={18} className="mr-2" /> কুইক</TabsTrigger></TabsList></div>
        <TabsContent value="detailed" className="mt-0"><div className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900 md:p-8"><DetailedCalculator validationAttempted={validationAttempted} plots={plots} owners={owners} totalOwnerTil={totalOwnerTil} onAddPlot={addPlot} onRemovePlot={removePlot} onUpdatePlot={updatePlot} onAddOwner={addOwner} onRemoveOwner={removeOwner} onUpdateOwner={updateOwner} lockedAreaIds={gisSelection ? [gisSelection.plot.id] : []} /><div className="mt-8 flex flex-col justify-center gap-3 border-t pt-8 sm:flex-row"><button onClick={clearAll} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-500 px-6 py-3 font-bold text-red-500"><Trash2 size={18} className="mr-2" /> মুছে ফেলুন</button><button onClick={calculateDetailed} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1A6B3C] px-8 py-3 font-bold text-white"><Calculator size={18} className="mr-2" /> হিসাব করুন</button></div></div></TabsContent>
        <TabsContent value="quick" className="mt-0"><div className="mx-auto max-w-3xl rounded-3xl border bg-white p-6 shadow-sm dark:bg-slate-900 md:p-8"><QuickCalculator quickData={quickData} quickResult={quickResult} onQuickDataChange={handleQuickDataChange} onCalculateQuick={calculateQuick} /></div></TabsContent>
      </Tabs>
      {detailedResults && <div className="no-print mx-auto mt-5 flex max-w-7xl justify-end"><button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--secondary)]"><Printer size={16} /> প্রিন্ট করুন</button></div>}
      <ResultSection detailedResults={detailedResults} exportRef={exportRef} onDownloadPDF={() => window.print()} onDownloadExcel={() => {}} />
      <div className="mt-20"><LatestBlogs /></div>
    </div>
  </>;
}