import { Plus, Trash2, Users } from "lucide-react";
import ShareStepper from "./ShareStepper";
import { toBn } from "@/src/shared/utils";
import type { KhatiyanOwner, RelationTypeBn } from "@/src/shared/types";
import {
  anaOptions,
  gondaOptions,
  koraOptions,
  krantiOptions,
  tilOptions,
} from "@/src/shared/constants/options";

interface OwnersCardProps {
  owners: KhatiyanOwner[];
  onAddOwner: () => void;
  onRemoveOwner: (id: number) => void;
  onUpdateOwner: <Key extends keyof KhatiyanOwner>(
    id: number,
    field: Key,
    value: KhatiyanOwner[Key],
  ) => void;
}

const SHARE_FIELDS = [
  { key: "a" as const, label: "আনা", max: anaOptions[anaOptions.length - 1].v },
  { key: "g" as const, label: "গন্ডা", max: gondaOptions[gondaOptions.length - 1].v },
  { key: "k" as const, label: "কড়া", max: koraOptions[koraOptions.length - 1].v },
  { key: "kr" as const, label: "ক্রান্তি", max: krantiOptions[krantiOptions.length - 1].v },
  { key: "ti" as const, label: "তিল", max: tilOptions[tilOptions.length - 1].v },
];

export default function OwnersCard({
  owners,
  onAddOwner,
  onRemoveOwner,
  onUpdateOwner,
}: OwnersCardProps) {
  return (
    <div className="h-full flex flex-col border border-[#006a4e]/20 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
      <div className="bg-[#006a4e] text-white py-4 px-6 flex flex-row justify-between items-center">
        <h3 className="text-lg font-bold flex items-center m-0">
          <Users size={18} className="mr-2" /> অংশীদার/ওয়ারিশের তথ্য
        </h3>
        <button
          onClick={onAddOwner}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center transition-colors"
        >
          <Plus size={14} className="mr-1" /> নতুন যোগ
        </button>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-950 flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="space-y-4">
          {owners.map((owner, index) => (
            <div key={owner.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative group">
              {owners.length > 1 && (
                <button
                  onClick={() => onRemoveOwner(owner.id)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-70 group-hover:opacity-100 z-10"
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={14} />
                </button>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                    অংশীদারের নাম
                  </label>
                  <input
                    type="text"
                    value={owner.n || ""}
                    onChange={(e) =>
                      onUpdateOwner(owner.id, "n", e.target.value)
                    }
                    placeholder={`অংশীদার ${toBn(index + 1)}`}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                      সম্পর্ক
                    </label>
                    <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="সম্পর্ক">
                      {(["পিতা", "মাতা", "স্বামী", "স্ত্রী"] as const).map(relation => (
                        <button key={relation} type="button" aria-pressed={owner.rType === relation}
                          onClick={() => onUpdateOwner(owner.id, "rType", relation as RelationTypeBn)}
                          className={owner.rType === relation
                            ? "min-h-11 rounded-xl bg-[var(--primary)] px-1 text-xs font-bold text-white"
                            : "min-h-11 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-1 text-xs font-bold text-[var(--foreground)]"}>
                          {relation}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                      পিতা/স্বামীর নাম
                    </label>
                    <input
                      type="text"
                      value={owner.rName || ""}
                      onChange={(e) =>
                        onUpdateOwner(owner.id, "rName", e.target.value)
                      }
                      placeholder="নাম লিখুন"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <h6 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm">
                    খতিয়ানের হিস্যা (অংশ)
                  </h6>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 2xl:grid-cols-5">
                    {SHARE_FIELDS.map(({ key, label, max }) => (
                      <ShareStepper key={key} label={label} value={Number(owner[key] ?? 0)}
                        max={max} onChange={(next) => onUpdateOwner(owner.id, key, next)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
