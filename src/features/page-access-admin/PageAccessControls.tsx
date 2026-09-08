import { Search, SlidersHorizontal } from "lucide-react";
import type {
  PageAccessCategory,
  PageAccessLevel,
} from "@/src/shared/config/pageAccess";
import {
  ACCESS_LEVELS,
  ACCESS_META,
  PAGE_ACCESS_CATEGORIES,
} from "./pageAccessUi";

type Props = {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  category: PageAccessCategory | "সব";
  onCategoryChange: (value: PageAccessCategory | "সব") => void;
  accessFilter: PageAccessLevel | "সব";
  onAccessFilterChange: (value: PageAccessLevel | "সব") => void;
  filteredCount: number;
  onBulkChange: (level: PageAccessLevel) => void;
};

export default function PageAccessControls({
  searchText,
  onSearchTextChange,
  category,
  onCategoryChange,
  accessFilter,
  onAccessFilterChange,
  filteredCount,
  onBulkChange,
}: Props) {
  return (
    <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
            placeholder="পেজের নাম বা রুট খুঁজুন…"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/15 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as PageAccessCategory | "সব")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#17663A] dark:border-slate-700 dark:bg-slate-950"
          aria-label="পেজ বিভাগ"
        >
          <option value="সব">সব বিভাগ</option>
          {PAGE_ACCESS_CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select
          value={accessFilter}
          onChange={(event) => onAccessFilterChange(event.target.value as PageAccessLevel | "সব")}
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#17663A] dark:border-slate-700 dark:bg-slate-950"
          aria-label="অনুমতির ধরন"
        >
          <option value="সব">সব অনুমতি</option>
          {ACCESS_LEVELS.map((level) => (
            <option key={level} value={level}>{ACCESS_META[level].label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <SlidersHorizontal size={15} /> দেখানো হচ্ছে {filteredCount.toLocaleString("bn-BD")}টি পেজ
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="mr-1 self-center text-xs font-semibold text-slate-500">দেখানো সব পেজ:</span>
          {ACCESS_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onBulkChange(level)}
              disabled={!filteredCount}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-[#17663A]/40 hover:text-[#17663A] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {ACCESS_META[level].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
