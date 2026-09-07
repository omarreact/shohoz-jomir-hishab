import Link from "next/link";
import { MousePointerClick, Calculator, FileCheck, ArrowRight } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

const STEPS = [
  {
    id: 1,
    title: "টুল বেছে নিন",
    description:
      "খতিয়ান, জমি পরিমাপ, ফারায়েজ বা নগর পরিকল্পনা মানচিত্র—প্রয়োজনমতো টুল খুলুন।",
    icon: MousePointerClick,
  },
  {
    id: 2,
    title: "তথ্য দিন",
    description:
      "দাগ/খতিয়ান নম্বর, পরিমাপ একক বা ওয়ারিশদের তথ্য ইনপুট করুন। মানচিত্রে প্লটে ট্যাপও করতে পারেন।",
    icon: Calculator,
  },
  {
    id: 3,
    title: "ফলাফল দেখুন",
    description:
      "আনা-গন্ডা, অংশ বণ্টন বা RS/MS ফলাফল তাৎক্ষণিক দেখুন। প্রয়োজনে মূল নথির সাথে মিলিয়ে নিন।",
    icon: FileCheck,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/30 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#006a4e]">
            ব্যবহার
          </p>
          <h2 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            কিভাবে <span className="text-[#006a4e]">কাজ করে?</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-500 dark:text-slate-400 md:text-lg">
            মাত্র তিন ধাপে হিসাব বা মানচিত্র ফলাফল পান।
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f42a41] text-sm font-bold text-white">
                  {step.id}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#006a4e]/10">
                  <step.icon size={22} className="text-[#006a4e]" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="m-0 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={FEATURE_ROUTES.records}
            className="inline-flex items-center gap-2 rounded-full bg-[#006a4e] px-6 py-3 text-sm font-bold text-white no-underline shadow-md transition hover:bg-[#005a42]"
          >
            খতিয়ান দিয়ে শুরু করুন
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
