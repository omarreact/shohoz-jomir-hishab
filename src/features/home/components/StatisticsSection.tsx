import { ShieldCheck, WifiOff, Languages, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TrustItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

/** Honest trust signals — no inflated fake counts. */
const TRUST: TrustItem[] = [
  {
    icon: Sparkles,
    title: "১০০% বিনামূল্যে",
    description: "খতিয়ান, পরিমাপ, ফারায়েজ ও মানচিত্র—কোনো চার্জ নেই।",
  },
  {
    icon: Languages,
    title: "বাংলা-প্রথম",
    description: "ভূমি অফিসের পরিচিত পরিভাষা ও ইন্টারফেস।",
  },
  {
    icon: WifiOff,
    title: "দ্রুত হিসাব",
    description: "ব্রাউজারেই হিসাব; অতিরিক্ত অ্যাপ ইনস্টল লাগে না।",
  },
  {
    icon: ShieldCheck,
    title: "সহায়ক টুল",
    description: "প্রাথমিক হিসাব—সরকারি রেকর্ডের বিকল্প নয়।",
  },
];

export default function StatisticsSection() {
  return (
    <section className="border-y border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-950 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
            কেন <span className="text-[#006a4e]">সহজ জমির হিসাব</span>
          </h2>
          <p className="mx-auto max-w-xl text-slate-500 dark:text-slate-400">
            স্বচ্ছ, দ্রুত এবং বাংলাদেশের ভূমি ব্যবহারকারীর জন্য তৈরি।
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {TRUST.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center transition hover:border-[#006a4e]/30 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006a4e]/10">
                <item.icon size={22} className="text-[#006a4e]" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white md:text-base">
                {item.title}
              </h3>
              <p className="m-0 text-xs leading-relaxed text-slate-500 dark:text-slate-400 md:text-sm">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
