import type { PageAccessLevel } from "@/src/shared/config/pageAccess";
import { ACCESS_LEVELS, ACCESS_META } from "./pageAccessUi";

type Props = {
  counts: Record<PageAccessLevel, number>;
  activeFilter: PageAccessLevel | "সব";
  onFilterChange: (level: PageAccessLevel | "সব") => void;
};

export default function PageAccessSummary({
  counts,
  activeFilter,
  onFilterChange,
}: Props) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {ACCESS_LEVELS.map((level) => {
        const meta = ACCESS_META[level];
        const Icon = meta.icon;
        const active = activeFilter === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onFilterChange(active ? "সব" : level)}
            aria-pressed={active}
            className={`rounded-2xl border bg-white p-4 text-left transition dark:bg-slate-900 ${
              active
                ? "border-[#17663A] ring-2 ring-[#17663A]/15"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.badge}`}>
                <Icon size={18} />
              </span>
              <span className="text-xl font-bold tabular-nums">
                {counts[level].toLocaleString("bn-BD")}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold">{meta.label}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">{meta.description}</p>
          </button>
        );
      })}
    </section>
  );
}
