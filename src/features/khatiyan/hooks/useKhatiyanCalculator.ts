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
  const [errorMessage, setErrorMessage] = useState("");

  // Any edit invalidates both previews; otherwise an old receipt can be printed for new inputs.
  const invalidateResults = () => {
    setDetailedResults(null);
    setQuickResult(null);
    setValidationAttempted(false);
    setErrorMessage("");
  };

  const addPlot = () => {
    invalidateResults();
    setPlots((current) => [...current, initialPlot(nextPlotId.current++)]);
  };

  const removePlot = (id: number) => {
    invalidateResults();
    setPlots((current) => current.filter((plot) => plot.id !== id));
  };

  const updatePlot = (id: number, field: keyof KhatiyanPlot, value: string) => {
    invalidateResults();
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

  const addOwner = () => {
    invalidateResults();
    setOwners((current) => [...current, initialOwner(nextOwnerId.current++)]);
  };

  const removeOwner = (id: number) => {
    invalidateResults();
    setOwners((current) => current.filter((owner) => owner.id !== id));
  };

  const updateOwner = <K extends keyof KhatiyanOwner>(id: number, field: K, value: KhatiyanOwner[K]) => {
    invalidateResults();
    setOwners((current) => current.map((owner) => (
      owner.id === id ? { ...owner, [field]: value } : owner
    )));
  };

  const calculateDetailed = () => {
    setDetailedResults(null);
    setErrorMessage("");
    setValidationAttempted(true);
    try {
      const { hasData, computedResults } = buildDetailedResults(owners, plots, FULL_UNIT_TIL, toEn, toBn);
      if (hasData && computedResults.length) {
        setDetailedResults(computedResults);
        setTimeout(() => document.getElementById("resultSection")?.scrollIntoView({ behavior: "smooth" }), 50);
      } else {
        setDetailedResults(null);
        setErrorMessage("কমপক্ষে একজন মালিকের অংশ এবং জমির পরিমাণ লিখুন।");
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      setErrorMessage(
        /exceeds|exceed|full unit/i.test(detail)
          ? "মালিকদের অংশ ১৬ আনার বেশি হয়েছে। প্রতিটি মালিকের হিস্যা যাচাই করুন।"
          : "মালিকদের অংশ ও প্রতিটি দাগের জমির পরিমাণ সঠিকভাবে লিখুন।",
      );
      setDetailedResults(null);
    }
  };

  const calculateQuick = () => {
    setQuickResult(null);
    setErrorMessage("");
    const result = calculateQuickKhatiyan(quickData, toEn);
    if (result) {
      setQuickResult(result);
    } else {
      setErrorMessage("জমির পরিমাণ এবং অংশ সঠিকভাবে লিখুন।");
    }
  };

  const clearAll = () => {

    nextPlotId.current = 3;
    nextOwnerId.current = 4;
    setPlots([initialPlot(1)]);
    setOwners([initialOwner(2)]);
    setDetailedResults(null);
    setQuickData(initialQuickData());
    setQuickResult(null);
    setValidationAttempted(false);
    setErrorMessage("");
  };

  const handleQuickDataChange = (data: Partial<KhatiyanQuickData>) => {
    invalidateResults();
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
    errorMessage,
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
