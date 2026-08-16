import { Ruler, LayoutGrid, Calculator } from "lucide-react";
import { toBn } from "@/src/shared/utils";
import type { KhatiyanQuickData } from "@/src/shared/types";
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
  return (
    <div className="w-full">
      <div className="border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-[#006a4e] text-white text-center py-6 px-6">
          <h3 className="text-2xl font-bold mb-1">দ্রুত জমির হিসাব</h3>
          <p className="text-white/80 text-sm m-0">
            শুধুমাত্র মোট জমি দিয়ে নিজের অংশ বের করুন
          </p>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
              মোট জমির পরিমাণ (শতাংশ)
            </label>
            <input
              type="text"
              value={quickData.totalLand}
              onChange={(e) =>
                onQuickDataChange({
                  ...quickData,
                  totalLand: e.target.value,
                })
              }
              className="w-full h-14 text-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors"
              placeholder="উদাহরণ: ৫০"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8">
            <h6 className="font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 text-sm">
              আপনার অংশ/হিস্যা সিলেক্ট করুন
            </h6>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block text-center">আনা</label>
                <select
                  value={quickData.a}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      a: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 text-center px-2 text-sm justify-center font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:border-[#006a4e]"
                >
                  {anaOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block text-center">গন্ডা</label>
                <select
                  value={quickData.g}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      g: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 text-center px-2 text-sm justify-center font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:border-[#006a4e]"
                >
                  {gondaOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block text-center">কড়া</label>
                <select
                  value={quickData.k}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      k: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 text-center px-2 text-sm justify-center font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:border-[#006a4e]"
                >
                  {koraOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5 col-span-1 sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block text-center">ক্রান্তি</label>
                <select
                  value={quickData.kr}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      kr: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 text-center px-2 text-sm justify-center font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:border-[#006a4e]"
                >
                  {krantiOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5 col-span-1 sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block text-center">তিল</label>
                <select
                  value={quickData.ti}
                  onChange={(e) =>
                    onQuickDataChange({
                      ...quickData,
                      ti: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-12 text-center px-2 text-sm justify-center font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:border-[#006a4e]"
                >
                  {tilOptions.map((o) => (
                    <option key={o.v} value={o.v}>
                      {o.t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={onCalculateQuick}
            className="w-full h-14 bg-[#006a4e] text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            <Calculator size={20} /> ফলাফল দেখুন
          </button>
        </div>

        {quickResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-200 dark:border-green-900/50 flex flex-col items-center justify-center p-8">
            <span className="text-green-700 dark:text-green-400 font-bold block mb-2 text-sm">
              আপনার প্রাপ্ত জমি
            </span>
            <h2 className="text-green-700 dark:text-green-400 font-bold text-4xl mb-6">
              {toBn(quickResult.land.toFixed(3))} শতাংশ
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center shadow-sm">
                <Ruler size={18} className="text-[#006a4e] mr-2" />
                {toBn(quickResult.sqft.toFixed(1))} বর্গফুট
              </span>
              <span className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center shadow-sm">
                <LayoutGrid size={18} className="text-[#006a4e] mr-2" />
                {toBn(quickResult.katha.toFixed(2))} কাঠা
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
