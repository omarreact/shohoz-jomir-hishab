"use client";

import Link from "next/link";
import {
  BookOpen,
  Calculator,
  ChevronRight,
  FileText,
  HelpCircle,
  Map,
  Phone,
  Ruler,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type Tool = {
  href: string;
  title: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  iconClass: string;
};

const TOOLS: Tool[] = [
  {
    href: FEATURE_ROUTES.records,
    title: "খতিয়ান হিসাব",
    short: "আনা · গন্ডা · শতাংশ",
    hint: "সিএস, এসএ, আরএস খতিয়ানের হিসাব করুন",
    icon: Calculator,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    title: "জমি পরিমাপ",
    short: "কাঠা · শতক · একর",
    hint: "জমির মাপ লিখে এককে রূপান্তর করুন",
    icon: Ruler,
    iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  {
    href: FEATURE_ROUTES.inheritance,
    title: "ফারায়েজ",
    short: "উত্তরাধিকার বণ্টন",
    hint: "ওয়ারিশদের অংশ সহজে হিসাব করুন",
    icon: Scale,
    iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  {
    href: FEATURE_ROUTES.landMap,
    title: "রাজউক মানচিত্র",
    short: "RS · MS প্লট",
    hint: "মানচিত্রে দাগ ও মৌজা দেখুন",
    icon: Map,
    iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    href: FEATURE_ROUTES.documents,
    title: "পর্চা",
    short: "নথি ও তথ্য",
    hint: "পর্চা সম্পর্কিত সহায়ক তথ্য দেখুন",
    icon: FileText,
    iconClass: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  },
  {
    href: FEATURE_ROUTES.blog,
    title: "ব্লগ ও গাইড",
    short: "সহজ ব্যাখ্যা",
    hint: "ভূমি বিষয়ে সহজ ভাষায় পড়ুন",
    icon: BookOpen,
    iconClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
];

const STEPS = [
  { n: "১", t: "প্রয়োজনীয় সেবা বেছে নিন" },
  { n: "২", t: "আপনার তথ্য লিখুন" },
  { n: "৩", t: "ফলাফল দেখুন বা সংরক্ষণ করুন" },
];

export default function EasyToolsHub() {
  return (
    <section id="tools" className="border-b border-[var(--border-color)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="landbd-section-kicker inline-flex px-3 py-1.5 text-xs font-bold">
              দ্রুত সেবা
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              প্রয়োজনীয় কাজ এক জায়গায়
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              আপনার প্রয়োজন অনুযায়ী টুল বেছে নিন—সব সেবা মোবাইল ও ডেস্কটপে সহজভাবে ব্যবহার করা যায়।
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--muted-foreground)]">
            {SITE_CONFIG.shortName}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group landbd-card flex min-h-[12rem] flex-col p-5 text-left no-underline transition hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--brand-gold)_35%,var(--border-color))] hover:shadow-[var(--shadow-md)]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tool.iconClass}`} aria-hidden>
                <tool.icon className="h-6 w-6" strokeWidth={2.1} />
              </div>

              <div className="mt-5 flex-1">
                <h3 className="text-lg font-extrabold text-[var(--foreground)]">{tool.title}</h3>
                <p className="mt-1 text-sm font-bold text-[#9a6700] dark:text-[#f7d36f]">{tool.short}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{tool.hint}</p>
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                খুলুন
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="landbd-card-elevated mt-10 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a6700] dark:text-[#f7d36f]">
                ব্যবহার পদ্ধতি
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">
                তিন ধাপে কাজ সম্পন্ন করুন
              </h3>
            </div>
          </div>
          <ol className="grid list-none gap-3 p-0 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="flex items-center gap-3 rounded-xl bg-[var(--brand-gold-faint)] px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold)] text-sm font-extrabold text-[var(--primary-foreground)]">
                  {step.n}
                </span>
                <span className="text-sm font-bold text-[var(--foreground)] sm:text-base">{step.t}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={FEATURE_ROUTES.faq}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 text-sm font-bold text-[var(--foreground)] no-underline shadow-sm transition hover:border-[color-mix(in_srgb,var(--brand-gold)_40%,var(--border-color))] hover:bg-[var(--brand-gold-faint)]"
          >
            <HelpCircle className="h-5 w-5 text-[#9a6700] dark:text-[#f7d36f]" />
            সাধারণ প্রশ্ন
          </Link>
          <Link
            href={FEATURE_ROUTES.contact}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 text-sm font-bold text-[var(--foreground)] no-underline shadow-sm transition hover:border-[color-mix(in_srgb,var(--brand-gold)_40%,var(--border-color))] hover:bg-[var(--brand-gold-faint)]"
          >
            <Phone className="h-5 w-5 text-[#9a6700] dark:text-[#f7d36f]" />
            যোগাযোগ
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-6 text-[var(--muted-foreground)]">
          {SITE_CONFIG.legalDisclaimer}
        </p>
      </div>
    </section>
  );
}
