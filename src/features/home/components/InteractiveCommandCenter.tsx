"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Download,
  FileSearch,
  FileText,
  MapPinned,
  Ruler,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

type Action = {
  label: string;
  description: string;
  group: string;
  href: string;
  icon: LucideIcon;
  keywords: string;
};

const ACTIONS: Action[] = [
  {
    label: "DLRMS খতিয়ান খুঁজুন",
    description: "জেলা, উপজেলা, মৌজা ও খতিয়ান নম্বর দিয়ে অনুসন্ধান",
    group: "রেকর্ড",
    href: FEATURE_ROUTES.dlrmsKhatian,
    icon: FileSearch,
    keywords: "dlrms khatian khatiyan record খতিয়ান রেকর্ড",
  },
  {
    label: "খতিয়ান হিসাব",
    description: "আনা, গন্ডা, কড়া ও হিস্যার হিসাব",
    group: "রেকর্ড",
    href: FEATURE_ROUTES.records,
    icon: FileText,
    keywords: "share khatian হিস্যা খতিয়ান",
  },
  {
    label: "জমি পরিমাপ",
    description: "শতক, কাঠা, বিঘা, একর ও বর্গফুট রূপান্তর",
    group: "হিসাব",
    href: FEATURE_ROUTES.landMeasurement,
    icon: Ruler,
    keywords: "measurement decimal katha bigha acre পরিমাপ",
  },
  {
    label: "ফারায়েজ হিসাব",
    description: "উত্তরাধিকার বণ্টনের সহায়ক হিসাব",
    group: "হিসাব",
    href: FEATURE_ROUTES.inheritance,
    icon: Scale,
    keywords: "inheritance faraez warish উত্তরাধিকার ফারায়েজ",
  },
  {
    label: "RAJUK GIS মানচিত্র",
    description: "প্লট, মৌজা, RS/MS ও উপলভ্য GIS স্তর দেখুন",
    group: "মানচিত্র",
    href: FEATURE_ROUTES.landMap,
    icon: MapPinned,
    keywords: "map gis rajuk plot rs ms মানচিত্র প্লট",
  },
  {
    label: "মৌজা ম্যাপ",
    description: "RS/MS মৌজা নির্বাচন, প্রিভিউ ও এক্সপোর্ট",
    group: "মানচিত্র",
    href: FEATURE_ROUTES.mouzaDownload,
    icon: Download,
    keywords: "mouza map export download মৌজা ম্যাপ",
  },
  {
    label: "মৌজা পর্চা রিপোর্ট",
    description: "রিপোর্ট ও ডকুমেন্ট ওয়ার্কস্পেস খুলুন",
    group: "ডকুমেন্ট",
    href: FEATURE_ROUTES.mouzaPorchaReport,
    icon: FileText,
    keywords: "report porcha document রিপোর্ট পর্চা",
  },
  {
    label: "ওয়ারিশ সনদ",
    description: "ওয়ারিশ তথ্য ও সনদ তৈরির ওয়ার্কস্পেস",
    group: "ডকুমেন্ট",
    href: FEATURE_ROUTES.warishSanad,
    icon: FileText,
    keywords: "warish sanad heir certificate ওয়ারিশ সনদ",
  },
  {
    label: "ভূমি গাইড",
    description: "ব্লগ, ব্যাখ্যা ও ব্যবহারিক নির্দেশনা",
    group: "গাইড",
    href: FEATURE_ROUTES.blog,
    icon: BookOpen,
    keywords: "guide blog help গাইড ব্লগ সহায়তা",
  },
];

const QUICK = ACTIONS.slice(0, 6);

export default function InteractiveCommandCenter() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;
    return ACTIONS.filter((item) =>
      `${item.label} ${item.description} ${item.group} ${item.keywords}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  const choose = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative">
      <div className="landbd-command-panel p-3 sm:p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (results[activeIndex]) choose(results[activeIndex].href);
          }}
          className="relative"
        >
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--survey-teal)]"
            aria-hidden
          />
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            aria-expanded={open}
            aria-controls="landbd-command-results"
            aria-activedescendant={open && results[activeIndex] ? `landbd-command-${activeIndex}` : undefined}
            placeholder="খতিয়ান, মৌজা, দাগ, হিসাব বা গাইড খুঁজুন…"
            className="h-14 w-full rounded-[14px] border border-[var(--border-color)] bg-white pl-12 pr-24 text-base font-semibold text-[var(--foreground)] shadow-[var(--shadow-xs)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--canvas)] px-2 py-1 text-[10px] font-extrabold text-[var(--muted-foreground)] sm:inline-flex">
            <Sparkles size={12} />
            ENTER
          </span>
        </form>

        {open ? (
          <div
            id="landbd-command-results"
            className="absolute left-0 right-0 top-[calc(100%+.55rem)] z-40 overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-white shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2.5">
              <p className="text-xs font-extrabold text-[var(--foreground)]">
                {query ? "মিলেছে" : "জনপ্রিয় কাজ"}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--muted-foreground)]">
                ↑↓ নির্বাচন · Enter খুলুন
              </span>
            </div>
            <div className="max-h-[21rem] overflow-y-auto p-2">
              {results.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeIndex;
                return (
                  <button
                    key={item.href}
                    id={`landbd-command-${index}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(item.href)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-[var(--brand-green-faint)] text-[var(--foreground)]"
                        : "hover:bg-[var(--canvas)]"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] bg-white text-[var(--primary)]">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <strong className="truncate text-sm">{item.label}</strong>
                        <span className="landbd-status-chip hidden sm:inline-flex">{item.group}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                        {item.description}
                      </span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-[var(--muted-foreground)]" />
                  </button>
                );
              })}
              {!results.length ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-extrabold text-[var(--foreground)]">কোনো সরাসরি মিল পাওয়া যায়নি</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">অন্য শব্দ লিখুন বা নিচের দ্রুত কাজ থেকে বেছে নিন।</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="landbd-action-chip group"
            >
              <Icon size={14} />
              <span>{item.label}</span>
              <ArrowUpRight size={12} className="opacity-50 transition group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-[var(--primary)]" />
          উৎস ও যাচাই অবস্থা ফলাফলে দৃশ্যমান
        </span>
        <span>দাপ্তরিক সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন</span>
      </div>
    </div>
  );
}
