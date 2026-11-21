import { MapPin, X, Plus } from "lucide-react";
import { plotClassOptionsList } from "@/src/shared/constants";
import { toBn } from "@/src/shared/utils";
import type { KhatiyanPlot } from "@/src/shared/types";

interface PlotsCardProps {
  plots: KhatiyanPlot[];
  onAddPlot: () => void;
  onRemovePlot: (id: number) => void;
  onUpdatePlot: (id: number, field: keyof KhatiyanPlot, value: string) => void;
}

export default function PlotsCard({
  plots,
  onAddPlot,
  onRemovePlot,
  onUpdatePlot,
}: PlotsCardProps) {
  return (
    <div className="h-full min-w-0 flex flex-col border border-[var(--border-color)] rounded-3xl shadow-sm overflow-hidden bg-[var(--card-bg)]">
      <div className="bg-[var(--primary)] text-white py-4 px-6 flex flex-row justify-between items-center">
        <h3 className="text-lg font-bold flex items-center m-0">
          <MapPin size={18} className="mr-2" /> জমির দাগসমূহ
        </h3>
        <button
          type="button" onClick={onAddPlot}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors"
        >
          <Plus size={14} className="mr-1" /> দাগ যোগ
        </button>
      </div>
      
      <div className="bg-[var(--secondary)] flex-1 p-4 md:p-6 overflow-y-auto">
        {plots.length === 0 && (
          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-[var(--card-bg)]">
            কোনো দাগ যুক্ত করা হয়নি
          </div>
        )}
        
        <div className="space-y-4">
          {plots.map((p, index) => (
              <div key={p.id} className="bg-[var(--card-bg)] p-3 sm:p-5 rounded-2xl shadow-sm border border-[var(--border-color)] relative group">
                <div className="flex justify-between items-center mb-4">
                  <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-3 py-1 rounded-full text-xs font-bold">
                    দাগ নং: {toBn(index + 1)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button" aria-label={`দাগ ${toBn(index + 1)} মুছুন`} onClick={() => onRemovePlot(p.id)}
                      className="min-h-11 min-w-11 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-70 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label htmlFor={`plot-cs-${p.id}`} className="block text-base font-bold text-[var(--muted-foreground)]">সিএস/এসএ দাগ</label>
                    <input id={`plot-cs-${p.id}`} type="text" value={p.cs} onChange={(e) => onUpdatePlot(p.id, "cs", e.target.value)} placeholder="১০১" className="w-full min-h-12 min-w-0 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`plot-rs-${p.id}`} className="block text-base font-bold text-[var(--muted-foreground)]">আরএস দাগ</label>
                    <input id={`plot-rs-${p.id}`} type="text" value={p.rs} onChange={(e) => onUpdatePlot(p.id, "rs", e.target.value)} placeholder="১০২" className="w-full min-h-12 min-w-0 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`plot-city-${p.id}`} className="block text-base font-bold text-[var(--muted-foreground)]">সিটি দাগ</label>
                    <input id={`plot-city-${p.id}`} type="text" value={p.city} onChange={(e) => onUpdatePlot(p.id, "city", e.target.value)} placeholder="১০৩" className="w-full min-h-12 min-w-0 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`plot-bds-${p.id}`} className="block text-base font-bold text-[var(--muted-foreground)]">বিডিএস দাগ</label>
                    <input id={`plot-bds-${p.id}`} type="text" value={p.bds} onChange={(e) => onUpdatePlot(p.id, "bds", e.target.value)} placeholder="১০৪" className="w-full min-h-12 min-w-0 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-base font-bold text-[var(--muted-foreground)]">শ্রেণী</label>
                    <div role="group" aria-label="জমির শ্রেণী" className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
                      {plotClassOptionsList.map((category: string) => (
                        <button key={category} type="button" aria-pressed={p.t === category}
                          onClick={() => onUpdatePlot(p.id, "t", category)}
                          className={p.t === category
                            ? "min-h-11 shrink-0 rounded-full bg-[var(--primary)] px-4 text-sm font-bold text-white"
                            : "min-h-11 shrink-0 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 text-sm font-bold text-[var(--foreground)]"}>
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`plot-a-${p.id}`} className="block text-base font-bold text-[var(--muted-foreground)]">মোট জমি (শতাংশ)</label>
                    <input
                      id={`plot-a-${p.id}`}
                      type="text"
                      inputMode="decimal"
                      value={p.a}
                      onChange={(e) => onUpdatePlot(p.id, "a", e.target.value)}
                      placeholder="০.০০"
                      className="w-full min-h-12 min-w-0 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] text-[var(--primary)] font-bold focus:outline-none focus:border-[var(--primary)] transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}
