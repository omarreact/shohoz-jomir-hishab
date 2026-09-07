import { MapPin, X, Plus, ShieldCheck } from "lucide-react";
import { plotClassOptionsList } from "@/src/shared/constants";
import { toBn } from "@/src/shared/utils";
import type { KhatiyanPlot } from "@/src/shared/types";

interface PlotsCardProps {
  plots: KhatiyanPlot[];
  onAddPlot: () => void;
  onRemovePlot: (id: number) => void;
  onUpdatePlot: (id: number, field: keyof KhatiyanPlot, value: string) => void;
  lockedAreaIds?: readonly number[];
}

export default function PlotsCard({
  plots,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
  lockedAreaIds = [],
}: PlotsCardProps) {
  const locked = (id: number) => lockedAreaIds.includes(id);

  return (
    <div className="h-full flex flex-col border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      <div className="bg-[#006a4e] text-white py-4 px-6 flex flex-row justify-between items-center">
        <h3 className="text-lg font-bold flex items-center m-0">
          <MapPin size={18} className="mr-2" /> জমির দাগসমূহ
        </h3>
        <button
          onClick={onAddPlot}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors"
        >
          <Plus size={14} className="mr-1" /> দাগ যোগ
        </button>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-950 flex-1 p-4 md:p-6 overflow-y-auto">
        {plots.length === 0 && (
          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">
            কোনো দাগ যুক্ত করা হয়নি
          </div>
        )}
        
        <div className="space-y-4">
          {plots.map((p, index) => {
            const areaLocked = locked(p.id);
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative group">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-3 py-1 rounded-full text-xs font-bold">
                    দাগ নং: {toBn(index + 1)}
                  </span>
                  <div className="flex items-center gap-2">
                    {areaLocked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" title="RAJUK থেকে যাচাইকৃত জমির পরিমাণ">
                        <ShieldCheck size={13} /> GIS যাচাইকৃত
                      </span>
                    )}
                    <button
                      onClick={() => onRemovePlot(p.id)}
                      className="h-8 w-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-70 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">সিএস/এসএ দাগ</label>
                    <input type="text" value={p.cs} onChange={(e) => onUpdatePlot(p.id, "cs", e.target.value)} placeholder="১০১" className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">আরএস দাগ</label>
                    <input type="text" value={p.rs} onChange={(e) => onUpdatePlot(p.id, "rs", e.target.value)} placeholder="১০২" className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">সিটি দাগ</label>
                    <input type="text" value={p.city} onChange={(e) => onUpdatePlot(p.id, "city", e.target.value)} placeholder="১০৩" className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">বিডিএস দাগ</label>
                    <input type="text" value={p.bds} onChange={(e) => onUpdatePlot(p.id, "bds", e.target.value)} placeholder="১০৪" className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">শ্রেণী</label>
                    <select className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors text-sm" value={p.t || ""} onChange={(e) => onUpdatePlot(p.id, "t", e.target.value)}>
                      <option value="" disabled>নির্বাচন করুন</option>
                      {plotClassOptionsList.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">মোট জমি (শতাংশ)</label>
                    <input
                      type="text"
                      value={p.a}
                      readOnly={areaLocked}
                      aria-readonly={areaLocked}
                      onChange={(e) => { if (!areaLocked) onUpdatePlot(p.id, "a", e.target.value); }}
                      placeholder="০.০০"
                      className={`w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[#006a4e] font-bold focus:outline-none focus:border-[#006a4e] transition-colors text-sm ${areaLocked ? "cursor-not-allowed bg-emerald-50/60 dark:bg-emerald-900/10" : ""}`}
                    />
                    {areaLocked && <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">RAJUK server-validated area</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
