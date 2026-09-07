import Link from "next/link";
import { FEATURE_ROUTES, FEATURE_LABELS } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-bold text-[#006a4e] mb-2">৪০৪</p>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
        পেজ পাওয়া যায়নি
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        আপনি যে ঠিকানায় গেছেন সেটি নেই বা সরানো হয়েছে। {SITE_CONFIG.name} এর মূল
        সেবাগুলো থেকে বেছে নিন।
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href={FEATURE_ROUTES.home}
          className="rounded-full bg-[#006a4e] px-6 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#00523b]"
        >
          হোমে যান
        </Link>
        <Link
          href={FEATURE_ROUTES.records}
          className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 no-underline"
        >
          {FEATURE_LABELS.records.bn}
        </Link>
        <Link
          href={FEATURE_ROUTES.landMap}
          className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 no-underline"
        >
          {FEATURE_LABELS.landMap.bn}
        </Link>
        <Link
          href={FEATURE_ROUTES.blog}
          className="rounded-full border border-slate-200 dark:border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 no-underline"
        >
          {FEATURE_LABELS.blog.bn}
        </Link>
      </div>
    </div>
  );
}
