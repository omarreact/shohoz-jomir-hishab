"use client";

import Link from "next/link";
import {
  BookOpen,
  Calculator,
  ChevronRight,
  Download,
  FileClock,
  FileSearch,
  FileText,
  HelpCircle,
  MapPinned,
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
  featured?: boolean;
};

const TOOLS: Tool[] = [
  {
    href: FEATURE_ROUTES.dlrmsKhatian,
    title: "DLRMS খতিয়ান",
    short: "সরকারি উৎসভিত্তিক অনুসন্ধান",
    hint: "জেলা, উপজেলা, মৌজা ও খতিয়ান অনুযায়ী উপলভ্য রেকর্ড দেখুন।",
    icon: FileSearch,
    iconClass: "bg-amber-100 text-amber-700",
    featured: true,
  },
  {
    href: FEATURE_ROUTES.records,
    title: "খতিয়ান হিসাব",
    short: "আনা · গন্ডা · কড়া · শতাংশ",
    hint: "খতিয়ানের হিস্যা ও জমির পরিমাণ দ্রুত হিসাব করুন।",
    icon: Calculator,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    href: FEATURE_ROUTES.landMap,
    title: "RAJUK GIS মানচিত্র",
    short: "RS · MS · Satellite",
    hint: "ইন্টারঅ্যাকটিভ মানচিত্রে প্লট, মৌজা ও উপলভ্য GIS স্তর দেখুন।",
    icon: MapPinned,
    iconClass: "bg-blue-100 text-blue-700",
    featured: true,
  },
  {
    href: FEATURE_ROUTES.mouzaDownload,
    title: "মৌজা ম্যাপ",
    short: "মৌজা নির্বাচন ও এক্সপোর্ট",
    hint: "নির্বাচিত মৌজার RS/MS ম্যাপ দেখুন এবং উপলভ্য ফরম্যাটে সংরক্ষণ করুন।",
    icon: Download,
    iconClass: "bg-cyan-100 text-cyan-700",
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    title: "জমি পরিমাপ",
    short: "শতক · কাঠা · বিঘা · একর",
    hint: "বাংলাদেশে ব্যবহৃত জমির এককগুলোর মধ্যে সহজে রূপান্তর করুন।",
    icon: Ruler,
    iconClass: "bg-orange-100 text-orange-700",
  },
  {
    href: FEATURE_ROUTES.inheritance,
    title: "ফারায়েজ",
    short: "উত্তরাধিকার বণ্টন",
    hint: "ওয়ারিশের তথ্য দিয়ে অংশ বণ্টনের সহায়ক হিসাব দেখুন।",
    icon: Scale,
    iconClass: "bg-violet-100 text-violet-700",
  },
  {
    href: FEATURE_ROUTES.documents,
    title: "পর্চা ও নথি",
    short: "রেকর্ড সহায়তা",
    hint: "পর্চা ও ভূমি নথি সম্পর্কিত তথ্য ও সহায়ক রিসোর্স দেখুন।",
    icon: FileText,
    iconClass: "bg-rose-100 text-rose-700",
  },
  {
    href: FEATURE_ROUTES.history,
    title: "হিসাবের ইতিহাস",
    short: "সাম্প্রতিক কাজ",
    hint: "আগের হিসাব ও ব্যবহৃত টুলের ইতিহাস দ্রুত ফিরে দেখুন।",
    icon: FileClock,
    iconClass: "bg-slate-100 text-slate-700",
  },
];

export default function EasyToolsHub() {
  return (
    <section id="tools" className="border-b border-[var(--border-color)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="landbd-section-kicker inline-flex px-3 py-1.5 text-xs font-bold">LandBD সেবা</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              আপডেটেড ভূমি টুলস ও সেবা
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
              খতিয়ান অনুসন্ধান থেকে GIS মানচিত্র, মৌজা এক্সপোর্ট, জমির হিসাব ও ফারায়েজ—বর্তমান LandBD ফিচারগুলো কাজের ধরন অনুযায়ী সাজানো হয়েছে।
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            এক প্ল্যাটফর্ম · বাংলা ইন্টারফেস · মোবাইল উপযোগী
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group flex min-h-[13rem] flex-col rounded-2xl border bg-white p-5 text-left no-underline shadow-sm transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)] ${
                tool.featured ? "border-amber-200 ring-1 ring-amber-100" : "border-[var(--border-color)] hover:border-amber-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tool.iconClass}`} aria-hidden>
                  <tool.icon className="h-6 w-6" strokeWidth={2.1} />
                </div>
                {tool.featured ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">প্রধান সেবা</span>
                ) : null}
              </div>

              <div className="mt-5 flex-1">
                <h3 className="text-lg font-extrabold text-[var(--foreground)]">{tool.title}</h3>
                <p className="mt-1 text-sm font-bold text-[#9a6700]">{tool.short}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{tool.hint}</p>
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                সেবা খুলুন <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <div className="landbd-card-elevated p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a6700]">কাজের সহজ পথ</p>
            <h3 className="mt-1 text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">তিন ধাপে ফলাফল পান</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["১", "সেবা নির্বাচন", "আপনার কাজের জন্য সঠিক LandBD টুল বেছে নিন।"],
                ["২", "তথ্য দিন", "প্রয়োজনীয় রেকর্ড, জমির পরিমাণ বা লোকেশন দিন।"],
                ["৩", "ফলাফল ব্যবহার", "ফলাফল দেখুন, প্রিন্ট করুন বা যেখানে সমর্থিত সেখানে এক্সপোর্ট করুন।"],
              ].map(([n, title, desc]) => (
                <div key={n} className="rounded-2xl bg-[var(--brand-gold-faint)] p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-gold)] text-sm font-extrabold text-[var(--primary-foreground)]">{n}</span>
                  <h4 className="mt-3 font-extrabold text-[var(--foreground)]">{title}</h4>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="landbd-card p-5 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><BookOpen size={21} /></div>
            <h3 className="mt-4 text-lg font-extrabold text-[var(--foreground)]">সহায়তা ও গাইড</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">ভূমি বিষয়ক গাইড পড়ুন, সাধারণ প্রশ্ন দেখুন অথবা আমাদের সাথে যোগাযোগ করুন।</p>
            <div className="mt-5 grid gap-2">
              <Link href={FEATURE_ROUTES.blog} className="inline-flex items-center justify-between rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--brand-gold-faint)]">ব্লগ ও গাইড <ChevronRight size={16} /></Link>
              <Link href={FEATURE_ROUTES.faq} className="inline-flex items-center justify-between rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--brand-gold-faint)]">প্রশ্নোত্তর <HelpCircle size={16} /></Link>
              <Link href={FEATURE_ROUTES.contact} className="inline-flex items-center justify-between rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--brand-gold-faint)]">যোগাযোগ <Phone size={16} /></Link>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-[var(--muted-foreground)]">
          {SITE_CONFIG.legalDisclaimer}
        </p>
      </div>
    </section>
  );
}
