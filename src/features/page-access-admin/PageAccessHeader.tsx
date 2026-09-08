import { Shield } from "lucide-react";
import { PAGE_ACCESS_PAGES } from "@/src/shared/config/pageAccess";

type Props = {
  updatedAt: string | null;
  updatedBy: string | null;
};

export default function PageAccessHeader({ updatedAt, updatedBy }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm dark:border-slate-800 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#17663A]/10 px-3 py-1.5 text-xs font-bold text-[#17663A] dark:text-emerald-300">
            <Shield size={15} /> সুপার অ্যাডমিন নিয়ন্ত্রণ
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            পেজ অ্যাক্সেস নিয়ন্ত্রণ
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            ল্যান্ডবিডির সব ব্যবহারকারী-মুখী পেজ কে দেখতে পারবে তা একটি জায়গা থেকে নিয়ন্ত্রণ করুন। নিবন্ধিত রুট, ডাইনামিক পেজ এবং পরীক্ষামূলক পেজ একই কেন্দ্রীয় নীতির অধীনে থাকে।
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs leading-6 text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
          <div>
            <strong className="text-slate-700 dark:text-slate-200">মোট নিয়ন্ত্রিত পেজ:</strong>{" "}
            {PAGE_ACCESS_PAGES.length.toLocaleString("bn-BD")}
          </div>
          <div>
            <strong className="text-slate-700 dark:text-slate-200">শেষ আপডেট:</strong>{" "}
            {updatedAt ? new Date(updatedAt).toLocaleString("bn-BD") : "এখনও সংরক্ষণ করা হয়নি"}
          </div>
          {updatedBy ? (
            <div>
              <strong className="text-slate-700 dark:text-slate-200">আপডেট করেছেন:</strong>{" "}
              {updatedBy}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
