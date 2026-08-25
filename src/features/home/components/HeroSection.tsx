"use client";

import Link from "next/link";
import {
  Calculator,
  Ruler,
  Scale,
  Map,
  FileText,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

const PRIMARY_CTAS = [
  {
    href: FEATURE_ROUTES.records,
    label: "খতিয়ান ক্যালকুলেটর",
    icon: Calculator,
    primary: true,
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    label: "জমি পরিমাপ",
    icon: Ruler,
    primary: false,
  },
] as const;

const QUICK_LINKS = [
  { href: FEATURE_ROUTES.landMap, label: "নগর পরিকল্পনা মানচিত্র", icon: Map },
  { href: FEATURE_ROUTES.inheritance, label: "ফারায়েজ", icon: Scale },
  { href: FEATURE_ROUTES.documents, label: "পর্চা", icon: FileText },
  { href: FEATURE_ROUTES.blog, label: "ব্লগ", icon: BookOpen },
] as const;

const HIGHLIGHTS = [
  {
    icon: Calculator,
    title: "আনা-গন্ডা হিসাব",
    desc: "সিএস, এসএ, আরএস খতিয়ান",
    tone: "dark" as const,
  },
  {
    icon: Scale,
    title: "নির্ভুল বন্টন",
    desc: "কোরআনিক নিয়মে ফারায়েজ",
    tone: "light" as const,
  },
  {
    icon: Ruler,
    title: "জমি মাপ",
    desc: "স্কয়ার ফিট, শতাংশ, কাঠা",
    tone: "light" as const,
  },
  {
    icon: Map,
    title: "RS · MS মানচিত্র",
    desc: "মৌজা টাইল ও প্লট ট্যাপ",
    tone: "light" as const,
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 lg:py-16">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#006a4e]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#006a4e]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#006a4e]/25 bg-white px-3 py-1.5 shadow-sm dark:bg-slate-900">
              <span className="rounded-full bg-[#f42a41] px-2.5 py-0.5 text-[11px] font-bold text-white">
                ১০০% ফ্রি
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">
                বাংলাদেশের ভূমি হিসাব টুলস
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.75rem]">
              {SITE_CONFIG.name}
              <span className="mt-1 block text-[#006a4e]">
                খতিয়ান · পরিমাপ · ফারায়েজ · মানচিত্র
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:mx-0 lg:text-lg">
              খতিয়ানের আনা-গন্ডা, জমির সঠিক পরিমাপ, আইনি উত্তরাধিকার (ফারায়েজ)
              এবং RS/MS মৌজা মানচিত্র—এক জায়গায়। কোনো খাতা-কলমের প্রয়োজন নেই।
            </p>

            <div className="mb-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              {PRIMARY_CTAS.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={
                    cta.primary
                      ? "inline-flex items-center gap-2 rounded-full bg-[#006a4e] px-6 py-3.5 text-sm font-bold text-white no-underline shadow-lg shadow-[#006a4e]/25 transition hover:-translate-y-0.5 hover:bg-[#005a42] hover:shadow-xl"
                      : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-[#006a4e]/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  }
                >
                  <cta.icon size={18} className={cta.primary ? "" : "text-[#006a4e]"} />
                  {cta.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white no-underline transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <link.icon size={13} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Feature tiles — desktop */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {HIGHLIGHTS.map((item, i) => {
                const dark = item.tone === "dark";
                return (
                  <div
                    key={item.title}
                    className={`rounded-3xl border p-5 text-center shadow-lg transition hover:-translate-y-1 ${
                      dark
                        ? "border-slate-800 bg-slate-900 text-white"
                        : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                    } ${i % 2 === 1 ? "-mt-4" : "mt-4"}`}
                  >
                    <div
                      className={`mb-3 inline-flex rounded-2xl p-3 ${
                        dark ? "bg-white/10" : "bg-[#006a4e]/10"
                      }`}
                    >
                      <item.icon
                        size={28}
                        className={dark ? "text-white" : "text-[#006a4e]"}
                      />
                    </div>
                    <h3
                      className={`mb-1 text-base font-bold ${
                        dark ? "text-white" : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={`m-0 text-sm ${
                        dark ? "text-white/70" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <ArrowRight size={12} className="text-[#006a4e]" />
              টুল বেছে নিন — হিসাব শুরু করুন
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
