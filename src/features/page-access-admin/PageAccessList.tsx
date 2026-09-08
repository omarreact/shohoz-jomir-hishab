import type {
  PageAccessDefinition,
  PageAccessLevel,
} from "@/src/shared/config/pageAccess";
import { ACCESS_LEVELS, ACCESS_META } from "./pageAccessUi";

type Props = {
  pages: readonly PageAccessDefinition[];
  accessRules: Record<string, PageAccessLevel>;
  savedRules: Record<string, PageAccessLevel>;
  onChange: (pageId: string, level: PageAccessLevel) => void;
};

export default function PageAccessList({
  pages,
  accessRules,
  savedRules,
  onChange,
}: Props) {
  if (!pages.length) {
    return (
      <div className="p-10 text-center text-sm text-slate-500">
        এই ফিল্টারে কোনো পেজ পাওয়া যায়নি।
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {pages.map((page) => {
        const currentLevel = accessRules[page.id] ?? page.defaultAccess;
        const meta = ACCESS_META[currentLevel];
        const Icon = meta.icon;
        const changed = savedRules[page.id] !== currentLevel;

        return (
          <article
            key={page.id}
            className={`p-4 sm:p-5 ${changed ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-950 dark:text-white">{page.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {page.category}
                  </span>
                  {changed ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      পরিবর্তিত
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{page.description}</p>
                <code className="mt-2 inline-block break-all rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                  {page.id}
                </code>
              </div>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.badge}`}>
                    <Icon size={14} />
                  </span>
                  বর্তমান অনুমতি: {meta.label}
                </span>
                <select
                  value={currentLevel}
                  onChange={(event) => onChange(page.id, event.target.value as PageAccessLevel)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/15 dark:border-slate-700 dark:bg-slate-950"
                  aria-label={`${page.name} পেজের অনুমতি`}
                >
                  {ACCESS_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {ACCESS_META[level].label} — {ACCESS_META[level].description}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>
        );
      })}
    </div>
  );
}
