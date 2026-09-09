"use client";

import { useRef, useState } from "react";
import { FULL_UNIT_TIL } from "@/src/shared/constants";
import { makeBanglaStr, toBn, toEn } from "@/src/shared/utils";
import { buildDetailedResults } from "@/src/modules/khatiyan/calculations";
import { calculateQuickKhatiyan, totalOwnerTil } from "@/src/modules/khatiyan/quick-calculation";
import type {
  KhatiyanOwner,
  KhatiyanOwnerResult,
  KhatiyanPlot,
  KhatiyanQuickData,
} from "@/src/shared/types";

const initialPlot = (id: number): KhatiyanPlot => ({
  id,
  cs: "",
  rs: "",
  city: "",
  bds: "",
  t: "",
  a: "",
});

const initialOwner = (id: number): KhatiyanOwner => ({
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

const initialQuickData = (): KhatiyanQuickData => ({
  totalLand: "",
  a: 0,
  g: 0,
  k: 0,
  kr: 0,
  ti: 0,
});

export function useKhatiyanCalculator() {
  const nextPlotId = useRef(3);
  const nextOwnerId = useRef(4);

  const [plots, setPlots] = useState<KhatiyanPlot[]>([initialPlot(1)]);
  const [owners, setOwners] = useState<KhatiyanOwner[]>([initialOwner(2)]);
  const [detailedResults, setDetailedResults] = useState<KhatiyanOwnerResult[] | null>(null);
  const [quickData, setQuickData] = useState<KhatiyanQuickData>(initialQuickData);
  const [quickResult, setQuickResult] = useState<ReturnType<typeof calculateQuickKhatiyan>>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const addPlot = () => setPlots((current) => [...current, initialPlot(nextPlotId.current++)]);

  const removePlot = (id: number) => {
    setPlots((current) => current.filter((plot) => plot.id !== id));
  };

  const updatePlot = (id: number, field: keyof KhatiyanPlot, value: string) => {
    setPlots((current) => current.map((plot) => (
      plot.id === id
        ? {
            ...plot,
            [field]: ["cs", "rs", "city", "bds", "a"].includes(field)
              ? makeBanglaStr(value)
              : value,
          }
        : plot
    )));
  };

  const addOwner = () => setOwners((current) => [...current, initialOwner(nextOwnerId.current++)]);

  const removeOwner = (id: number) => {
    setOwners((current) => current.filter((owner) => owner.id !== id));
  };

  const updateOwner = <K extends keyof KhatiyanOwner>(id: number, field: K, value: KhatiyanOwner[K]) => {
    setOwners((current) => current.map((owner) => (
      owner.id === id ? { ...owner, [field]: value } : owner
    )));
  };

  const calculateDetailed = () => {
    setValidationAttempted(true);
    try {
      const { hasData, computedResults } = buildDetailedResults(owners, plots, FULL_UNIT_TIL, toEn, toBn);
      if (hasData && computedResults.length) {
        setDetailedResults(computedResults);
        setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 50);
      } else {
        alert("কমপক্ষে একজন মালিকের অংশ এবং জমির পরিমাণ ইনপুট দিন।");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "হিসাব করা যায়নি।");
      setDetailedResults(null);
    }
  };

  const calculateQuick = () => {
    const result = calculateQuickKhatiyan(quickData, toEn);
    if (result) {
      setQuickResult(result);
    } else {
      alert("দয়া করে জমির পরিমাণ এবং অংশ সঠিক ভাবে দিন।");
    }
  };

  const clearAll = () => {
    if (!confirm("সব ডাটা মুছে ফেলতে চান?")) return;

    nextPlotId.current = 3;
    nextOwnerId.current = 4;
    setPlots([initialPlot(1)]);
    setOwners([initialOwner(2)]);
    setDetailedResults(null);
    setQuickData(initialQuickData());
    setQuickResult(null);
    setValidationAttempted(false);
  };

  const handleQuickDataChange = (data: Partial<KhatiyanQuickData>) => {
    setQuickData((current) => ({
      ...current,
      ...data,
      ...(data.totalLand !== undefined ? { totalLand: makeBanglaStr(data.totalLand) } : {}),
    }));
  };

  return {
    plots,
    owners,
    detailedResults,
    quickData,
    quickResult,
    validationAttempted,
    totalOwnerTil: totalOwnerTil(owners),
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
  };
}
