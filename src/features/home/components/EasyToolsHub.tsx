"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
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
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type Tool = {
  href: string;
  title: string;
  description: string;
  meta: string;
  icon: LucideIcon;
};

type Domain = {
  id: string;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
  tools: Tool[];
};

const DOMAINS: Domain[] = [
  {
    id: "records",
    label: "রেকর্ড",
    eyebrow: "খতিয়ান ও ভূমি রেকর্ড",
    icon: FileSearch,
    tools: [
      { href: FEATURE_ROUTES.dlrmsKhatian, title: "DLRMS খতিয়ান", description: "জেলা, উপজেলা, মৌজা ও খতিয়ান নম্বরভিত্তিক অনুসন্ধান।", meta: "সরকারি উৎসভিত্তিক", icon: FileSearch },
      { href: FEATURE_ROUTES.records, title: "খতিয়ান হিসাব", description: "হিস্যা, আনা, গন্ডা ও জমির পরিমাণ হিসাব।", meta: "ক্যালকুলেশন", icon: Calculator },
      { href: FEATURE_ROUTES.settlementKhatian, title: "সেটেলমেন্ট খতিয়ান", description: "সেটেলমেন্ট রেকর্ড সম্পর্কিত ওয়ার্কস্পেস।", meta: "রেকর্ড", icon: ScrollText },
      { href: FEATURE_ROUTES.history, title: "কাজের ইতিহাস", description: "আগের হিসাব ও ব্যবহৃত টুলে দ্রুত ফিরে যান।", meta: "সাম্প্রতিক কাজ", icon: FileClock },
    ],
  },
  {
    id: "calculations",
    label: "হিসাব",
    eyebrow: "পরিমাপ ও উত্তরাধিকার",
    icon: Ruler,
    tools: [
      { href: FEATURE_ROUTES.landMeasurement, title: "জমি পরিমাপ", description: "শতক, কাঠা, বিঘা, একর ও বর্গফুট রূপান্তর।", meta: "লাইভ ফলাফল", icon: Ruler },
      { href: FEATURE_ROUTES.inheritance, title: "ফারায়েজ", description: "ওয়ারিশের তথ্য দিয়ে অংশ বণ্টনের সহায়ক হিসাব।", meta: "উত্তরাধিকার", icon: Scale },
    ],
  },
  {
    id: "maps",
    label: "মানচিত্র",
    eyebrow: "GIS, প্লট ও মৌজা",
    icon: MapPinned,
    tools: [
      { href: FEATURE_ROUTES.landMap, title: "RAJUK GIS", description: "প্লট, মৌজা, RS/MS ও উপলভ্য GIS স্তর দেখুন।", meta: "Map workspace", icon: MapPinned },
      { href: FEATURE_ROUTES.mouzaDownload, title: "মৌজা ম্যাপ", description: "RS/MS মৌজা নির্বাচন, প্রিভিউ ও এক্সপোর্ট।", meta: "Export", icon: Download },
    ],
  },
  {
    id: "documents",
    label: "ডকুমেন্ট",
    eyebrow: "রিপোর্ট ও সনদ",
    icon: FileText,
    tools: [
      { href: FEATURE_ROUTES.documents, title: "পর্চা", description: "পর্চা ও ভূমি নথির সহায়ক রিসোর্স।", meta: "নথি", icon: FileText },
      { href: FEATURE_ROUTES.mouzaPorchaReport, title: "মৌজা পর্চা রিপোর্ট", description: "রিপোর্ট, যাচাই ও প্রিন্ট ওয়ার্কস্পেস।", meta: "A4 / Export", icon: ScrollText },
      { href: FEATURE_ROUTES.warish, title: "ওয়ারিশ", description: "ওয়ারিশ তথ্যের কাঠামোবদ্ধ কাজের ধাপ।", meta: "Workflow", icon: Scale },
      { href: FEATURE_ROUTES.warishSanad, title: "ওয়ারিশ সনদ", description: "লাইভ প্রিভিউসহ সনদ তৈরির স্টুডিও।", meta: "Document studio", icon: FileText },
    ],
  },
  {
    id: "guides",
    label: "গাইড",
    eyebrow: "সহায়তা ও ব্যাখ্যা",
    icon: BookOpen,
    tools: [
      { href: FEATURE_ROUTES.blog, title: "ব্লগ ও গাইড", description: "ভূমি বিষয়ক ব্যাখ্যা, আপডেট ও ব্যবহারিক নির্দেশনা।", meta: "Knowledge", icon: BookOpen },
      { href: FEATURE_ROUTES.faq, title: "প্রশ্নোত্তর", description: "সাধারণ প্রশ্নের সংক্ষিপ্ত ও পরিষ্কার উত্তর।", meta: "FAQ", icon: HelpCircle },
      { href: FEATURE_ROUTES.contact, title: "যোগাযোগ", description: "সহায়তা বা মতামতের জন্য যোগাযোগ করুন।", meta: "Support", icon: Phone },
    ],
  },
];

export default function EasyToolsHub() {
  const [activeDomain, setActiveDomain] = useState("records");
  const domain = useMemo(
    () => DOMAINS.find((item) => item.id === activeDomain) ?? DOMAINS[0],
    [activeDomain],
  );

  return (
    <section id="tools" className="border-b border-[var(--border-color)] bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="landbd-section-kicker inline-flex px-3 py-1.5 text-xs font-extrabold">PRODUCT DOMAINS</span>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
              একটি পণ্য, পাঁচটি কাজের ক্ষেত্র
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
              প্রতিটি টুলের নিজস্ব কাজ আছে, কিন্তু নেভিগেশন, স্টেট, ফলাফল ও উৎস দেখানোর ভাষা একই।
            </p>
          </div>
          <div className="landbd-trust-note">
            <ShieldCheck size={17} />
            ফলাফল + উৎস + যাচাই অবস্থা
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="LandBD কাজের ক্ষেত্র">
          {DOMAINS.map((item) => {
            const Icon = item.icon;
            const selected = item.id === domain.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveDomain(item.id)}
                className={selected ? "landbd-domain-tab landbd-domain-tab-active" : "landbd-domain-tab"}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[16px] border border-[var(--border-color)] bg-[var(--canvas)] p-3 sm:p-5">
          <div className="flex flex-col gap-2 border-b border-[var(--border-color)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--survey-teal)]">{domain.eyebrow}</p>
              <h3 className="mt-1 text-2xl font-black text-[var(--foreground)]">{domain.label}</h3>
            </div>
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">{domain.tools.length}টি প্রধান ওয়ার্কস্পেস</span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {domain.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href} className="landbd-tool-card group">
                  <span className="landbd-tool-icon"><Icon size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-base text-[var(--foreground)]">{tool.title}</strong>
                      <span className="landbd-status-chip">{tool.meta}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">{tool.description}</span>
                  </span>
                  <ArrowUpRight size={17} className="shrink-0 text-[var(--muted-foreground)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="landbd-card p-5 sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--primary)]">CONSISTENT FLOW</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["১", "তথ্য দিন", "ফর্ম, সার্চ বা ম্যাপ থেকে ইনপুট দিন।"],
                ["২", "যাচাই করুন", "উৎস, সতর্কতা ও প্রাসঙ্গিক অবস্থা দেখুন।"],
                ["৩", "পরবর্তী কাজ", "প্রিন্ট, এক্সপোর্ট, সংরক্ষণ বা সংশ্লিষ্ট টুলে যান।"],
              ].map(([n, title, copy]) => (
                <div key={n} className="rounded-[14px] border border-[var(--border-color)] bg-white p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-green-faint)] text-sm font-black text-[var(--primary)]">{n}</span>
                  <h4 className="mt-3 font-black text-[var(--foreground)]">{title}</h4>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="landbd-card p-5 sm:p-6">
            <BookOpen size={20} className="text-[var(--survey-teal)]" />
            <h3 className="mt-3 text-lg font-black text-[var(--foreground)]">গাইড দরকার?</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              জটিল ভূমি কাজের আগে গাইড ও সাধারণ প্রশ্ন দেখে নিন।
            </p>
            <div className="mt-4 grid gap-2">
              <Link href={FEATURE_ROUTES.blog} className="landbd-compact-link">ব্লগ ও গাইড <ChevronRight size={15} /></Link>
              <Link href={FEATURE_ROUTES.faq} className="landbd-compact-link">প্রশ্নোত্তর <HelpCircle size={15} /></Link>
              <Link href={FEATURE_ROUTES.contact} className="landbd-compact-link">যোগাযোগ <Phone size={15} /></Link>
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
