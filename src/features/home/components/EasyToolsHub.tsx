"use client";

import Link from "next/link";
import {
  Calculator,
  Ruler,
  Scale,
  Map,
  FileText,
  BookOpen,
  HelpCircle,
  Phone,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type Tool = {
  href: string;
  number: string;
  title: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
};

/** সব প্রধান সুবিধা — এক ট্যাপে খোলা যায় */
const TOOLS: Tool[] = [
  {
    href: FEATURE_ROUTES.records,
    number: "১",
    title: "খতিয়ান হিসাব",
    short: "আনা · গন্ডা · শতাংশ",
    hint: "সিএস, এসএ, আরএস খতিয়ানের হিসাব করুন",
    icon: Calculator,
    accent: "bg-emerald-600",
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    number: "২",
    title: "জমি পরিমাপ",
    short: "কাঠা · শতক · একর",
    hint: "জমির মাপ লিখে এককে রূপান্তর করুন",
    icon: Ruler,
    accent: "bg-teal-600",
  },
  {
    href: FEATURE_ROUTES.inheritance,
    number: "৩",
    title: "ফারায়েজ",
    short: "উত্তরাধিকার বণ্টন",
    hint: "ওয়ারিশদের অংশ সহজে হিসাব করুন",
    icon: Scale,
    accent: "bg-cyan-700",
  },
  {
    href: FEATURE_ROUTES.landMap,
    number: "৪",
    title: "মানচিত্র",
    short: "RS · MS প্লট",
    hint: "মানচিত্রে দাগ দেখুন ও ট্যাপ করুন",
    icon: Map,
    accent: "bg-[#006a4e]",
  },
  {
    href: FEATURE_ROUTES.documents,
    number: "৫",
    title: "পর্চা",
    short: "নথি ও তথ্য",
    hint: "পর্চা সম্পর্কিত সহায়ক তথ্য",
    icon: FileText,
    accent: "bg-slate-700",
  },
  {
    href: FEATURE_ROUTES.blog,
    number: "৬",
    title: "ব্লগ ও গাইড",
    short: "সহজ ব্যাখ্যা",
    hint: "ভূমি বিষয়ে সহজ ভাষায় পড়ুন",
    icon: BookOpen,
    accent: "bg-indigo-700",
  },
];

const STEPS = [
  { n: "১", t: "উপরে একটি বোতাম চাপুন" },
  { n: "২", t: "প্রয়োজনীয় তথ্য লিখুন" },
  { n: "৩", t: "ফলাফল দেখুন বা সংরক্ষণ করুন" },
];

export default function EasyToolsHub() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Title — large, clear for all ages */}
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-base font-bold text-[#006a4e] sm:text-lg">
            {SITE_CONFIG.name}
          </p>
          <h1 className="mb-3 text-3xl font-extrabold leading-snug text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            আপনি কী করতে চান?
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300 sm:text-xl">
            নিচের বড় বোতামগুলো থেকে বেছে নিন। কোনো অ্যাকাউন্ট লাগবে না।
          </p>
        </div>

        {/* Big tool grid */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex min-h-[7.5rem] items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left no-underline shadow-sm transition hover:border-[#006a4e] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006a4e] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500 sm:min-h-[8.5rem] sm:gap-5 sm:p-5"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white sm:h-16 sm:w-16 ${tool.accent}`}
                aria-hidden
              >
                <tool.icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                    {tool.number}
                  </span>
                  <h2 className="m-0 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
                    {tool.title}
                  </h2>
                </div>
                <p className="m-0 text-base font-semibold text-[#006a4e] dark:text-emerald-400">
                  {tool.short}
                </p>
                <p className="m-0 mt-1 text-sm leading-snug text-slate-600 dark:text-slate-400 sm:text-base">
                  {tool.hint}
                </p>
              </div>
              <ChevronRight
                className="h-7 w-7 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#006a4e] dark:text-slate-500"
                aria-hidden
              />
            </Link>
          ))}
        </div>

        {/* 3 easy steps */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <h2 className="mb-4 text-center text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
            কীভাবে ব্যবহার করবেন?
          </h2>
          <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006a4e] text-lg font-extrabold text-white">
                  {s.n}
                </span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">
                  {s.t}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Help row */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={FEATURE_ROUTES.faq}
            className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-base font-bold text-slate-800 no-underline transition hover:border-[#006a4e] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <HelpCircle className="h-5 w-5 text-[#006a4e]" />
            সাধারণ প্রশ্ন (FAQ)
          </Link>
          <Link
            href={FEATURE_ROUTES.contact}
            className="inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 text-base font-bold text-slate-800 no-underline transition hover:border-[#006a4e] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <Phone className="h-5 w-5 text-[#006a4e]" />
            যোগাযোগ
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {SITE_CONFIG.legalDisclaimer}
        </p>
      </div>
    </section>
  );
}
