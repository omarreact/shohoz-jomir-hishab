import { RefreshCcw, Save } from "lucide-react";

type Props = {
  dirty: boolean;
  dirtyCount: number;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export default function PageAccessSaveBar({
  dirty,
  dirtyCount,
  saving,
  onDiscard,
  onSave,
}: Props) {
  return (
    <div className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">
            {dirty
              ? `${dirtyCount.toLocaleString("bn-BD")}টি অসংরক্ষিত পরিবর্তন`
              : "সব পরিবর্তন সংরক্ষিত"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            সংরক্ষণ না করা পর্যন্ত লাইভ পেজে পরিবর্তন কার্যকর হবে না।
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={!dirty || saving}
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
          >
            পরিবর্তন বাতিল
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#17663A] px-5 text-sm font-bold text-white transition hover:bg-[#10552f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <RefreshCcw size={17} className="animate-spin" /> : <Save size={17} />}
            {saving ? "সংরক্ষণ হচ্ছে…" : "সব পরিবর্তন সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
