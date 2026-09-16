"use client";

import { useRef } from "react";
import { Ruler, LayoutGrid, Calculator } from "lucide-react";
import { toBn } from "@/src/shared/utils";
import type { KhatiyanQuickData } from "@/src/shared/types";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import ResultDocument from "@/src/shared/components/ResultDocument";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import {
  anaOptions,
  gondaOptions,
  koraOptions,
  krantiOptions,
  tilOptions,
} from "@/src/shared/constants/options";

interface QuickResult {
  land: number;
  sqft: number;
  katha: number;
}

interface QuickCalculatorProps {
  quickData: KhatiyanQuickData;
  quickResult: QuickResult | null;
  onQuickDataChange: (data: Partial<KhatiyanQuickData>) => void;
  onCalculateQuick: () => void;
}

export default function QuickCalculator({
  quickData,
  quickResult,
  onQuickDataChange,
  onCalculateQuick,
}: QuickCalculatorProps) {
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: resultRef,
    fileName: "LandBD-Khatiyan-Quick-Result-A4-Portrait",
  });

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-[#006a4e] px-6 py-6 text-center text-white">
          <h3 className="mb-1 text-2xl font-bold">দ্রুত জমির হিসাব</h3>
          <p className="m-0 text-sm text-white/80">শুধুমাত্র মোট জমি দিয়ে নিজের অংশ বের করুন</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">মোট জমির পরিমাণ (শতাংশ)</label>
            <input
              type="text"
              value={quickData.totalLand}
              onChange={(e) => onQuickDataChange({ ...quickData, totalLand: e.target.value })}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg text-slate-900 transition-colors focus:border-[#006a4e] focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="উদাহরণ: ৫০"
            />
          </div>

          <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <h6 className="mb-4 border-b border-slate-200 pb-3 text-sm font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400">আপনার অংশ/হিস্যা সিলেক্ট করুন</h6>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {[
                ["আনা", quickData.a, "a", anaOptions],
                ["গন্ডা", quickData.g, "g", gondaOptions],
                ["কড়া", quickData.k, "k", koraOptions],
                ["ক্রান্তি", quickData.kr, "kr", krantiOptions],
                ["তিল", quickData.ti, "ti", tilOptions],
              ].map(([label, value, key, options]) => (
                <div key={String(key)} className="space-y-1.5">
                  <label className="block text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{String(label)}</label>
                  <select
                    value={Number(value)}
                    onChange={(e) => onQuickDataChange({ [String(key)]: parseInt(e.target.value, 10) })}
                    className="h-12 w-full justify-center rounded-xl border border-slate-200 bg-white px-2 text-center text-sm font-medium shadow-sm focus:border-[#006a4e] focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                  >
                    {(options as typeof anaOptions).map((option) => (
                      <option key={option.v} value={option.v}>{option.t}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onCalculateQuick}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#006a4e] text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <Calculator size={20} /> ফলাফল দেখুন
          </button>
        </div>

        {quickResult ? (
          <div className="border-t border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20">
            <div className="no-print flex justify-end px-6 pt-5">
              <ResultDownloadButton onClick={() => void generatePDF()} loading={isGenerating} />
            </div>
            {pdfError ? <p className="no-print px-6 pt-2 text-right text-xs font-semibold text-red-600">{pdfError}</p> : null}

            <ResultDocument ref={resultRef} className="m-0 border-0 bg-white p-8 text-slate-900 shadow-none">
              <div className="mb-6 border-b border-emerald-100 pb-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006a4e]">LandBD</p>
                <h2 className="mt-1 text-xl font-black">দ্রুত খতিয়ান হিসাবের ফলাফল</h2>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="mb-2 block text-sm font-bold text-green-700">আপনার প্রাপ্ত জমি</span>
                <h2 className="mb-6 text-4xl font-bold text-green-700">{toBn(quickResult.land.toFixed(3))} শতাংশ</h2>
                <div className="flex flex-wrap justify-center gap-4">
                  <span className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm">
                    <Ruler size={18} className="mr-2 text-[#006a4e]" /> {toBn(quickResult.sqft.toFixed(1))} বর্গফুট
                  </span>
                  <span className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm">
                    <LayoutGrid size={18} className="mr-2 text-[#006a4e]" /> {toBn(quickResult.katha.toFixed(2))} কাঠা
                  </span>
                </div>
              </div>

              <p className="mt-7 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">
                এই ফলাফল LandBD-এর ডিজিটাল হিসাব থেকে প্রস্তুত। দাপ্তরিক কাজে সংশ্লিষ্ট সরকারি রেকর্ড যাচাই করুন।
              </p>
            </ResultDocument>
          </div>
        ) : null}
      </div>
    </div>
  );
}
