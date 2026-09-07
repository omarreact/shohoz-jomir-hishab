import { Plus, Trash2, Users } from "lucide-react";
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
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors text-sm"
                      value={owner.rType || "পিতা"}
                      onChange={(e) =>
                        onUpdateOwner(
                          owner.id,
                          "rType",
                          e.target.value as RelationTypeBn,
                        )
                      }
                    >
                      <option value="পিতা">পিতা</option>
                      <option value="মাতা">মাতা</option>
                      <option value="স্বামী">স্বামী</option>
                      <option value="স্ত্রী">স্ত্রী</option>
                    </select>
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
                  <div className="grid grid-cols-5 gap-2">
                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">আনা</label>
                      <select
                        className="w-full h-9 text-center px-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-[#006a4e]"
                        value={owner.a?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "a", Number(e.target.value))
                        }
                      >
                        {anaOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">গন্ডা</label>
                      <select
                        className="w-full h-9 text-center px-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-[#006a4e]"
                        value={owner.g?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "g", Number(e.target.value))
                        }
                      >
                        {gondaOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">কড়া</label>
                      <select
                        className="w-full h-9 text-center px-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-[#006a4e]"
                        value={owner.k?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "k", Number(e.target.value))
                        }
                      >
                        {koraOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">ক্রান্তি</label>
                      <select
                        className="w-full h-9 text-center px-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-[#006a4e]"
                        value={owner.kr?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "kr", Number(e.target.value))
                        }
                      >
                        {krantiOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">তিল</label>
                      <select
                        className="w-full h-9 text-center px-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-[#006a4e]"
                        value={owner.ti?.toString() || "0"}
                        onChange={(e) =>
                          onUpdateOwner(owner.id, "ti", Number(e.target.value))
                        }
                      >
                        {tilOptions.map((opt) => (
                          <option key={opt.v} value={opt.v.toString()}>
                            {opt.t}
                          </option>
                        ))}
                      </select>
                    </div>
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
