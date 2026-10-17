"use client";

import Link from "next/link";
import {
  ArrowRight, BookOpen, Calculator, FileSearch, FileText,
  History, MapPinned, Ruler, Scale, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

type Action = { href: string; title: string; subtitle: string; icon: LucideIcon };

const PRIMARY_ACTIONS: readonly Action[] = [
  {
    href: FEATURE_ROUTES.dlrmsKhatian, title: "খতিয়ান অনুসন্ধান",
    subtitle: "ভূমি রেকর্ড", icon: FileSearch,
  },
  {
    href: FEATURE_ROUTES.landMeasurement, title: "জমির হিসাব",
    subtitle: "মাপ ও রূপান্তর", icon: Ruler,
  },
  {
    href: FEATURE_ROUTES.landMap, title: "রাজউক মানচিত্র",
    subtitle: "GIS ও মৌজা", icon: MapPinned,
  },
  {
    href: FEATURE_ROUTES.inheritance, title: "ফারায়েজ হিসাব",
    subtitle: "উত্তরাধিকার", icon: Scale,
  },
];

const MORE_ACTIONS: readonly Action[] = [
  {
    href: FEATURE_ROUTES.records, title: "খতিয়ান ভাগ",
    subtitle: "অংশের হিসাব", icon: Calculator,
  },
  {
    href: FEATURE_ROUTES.mouzaPorchaReport, title: "পর্চা রিপোর্ট",
    subtitle: "নথি ও প্রিন্ট", icon: FileText,
  },
  {
    href: FEATURE_ROUTES.history, title: "কাজের ইতিহাস",
    subtitle: "পূর্বের হিসাব", icon: History,
  },
  {
    href: FEATURE_ROUTES.blog, title: "গাইড ও ব্লগ",
    subtitle: "জমির তথ্য", icon: BookOpen,
  },
];

export default function MobileHomeScreen() {
  return (
    <section className="landbd-mobile-dashboard mx-auto max-w-screen-sm px-4 pb-6 pt-4 md:hidden" aria-label="LandBD মোবাইল হোম">
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0B5D3B] via-[#0D7550] to-[#199265] px-5 pb-6 pt-6 text-white shadow-[0_15px_35px_rgba(11,93,59,.17)]">
        <div className="pointer-events-none absolute -right-12 -top-10 h-48 w-48 rounded-full border-[34px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-36 w-36 rounded-full bg-white/[.04]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-extrabold">
            <ShieldCheck size={15} /> বাংলাদেশ ভূমি সেবা
          </div>
          <h1 className="mt-4 max-w-xs text-[29px] font-black leading-[1.22] tracking-tight">
            জমির তথ্য ও হিসাব, এখন হাতের মুঠোয়।
          </h1>
          <p className="mt-3 max-w-sm text-[13px] leading-6 text-white/85">
            খতিয়ান, পরিমাপ, মানচিত্র ও সনদ—প্রয়োজনীয় সেবায় সরাসরি যান।
          </p>
          <Link href="/explore"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-white px-4 py-2 text-sm font-black text-[#0B5D3B] no-underline shadow-sm active:scale-[.98]">
            সব সেবা দেখুন <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <div className="mb-3 mt-7 flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-[var(--brand-gold-text)]">
            QUICK ACCESS
          </p>
          <h2 className="mt-1 text-lg font-black">আজ কী করতে চান?</h2>
        </div>
        <Link href="/explore" className="inline-flex min-h-11 items-center gap-1 text-xs font-black text-[var(--primary)] no-underline">
          সবগুলো <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PRIMARY_ACTIONS.map(({ href, title, subtitle, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex min-h-[9rem] flex-col items-start justify-between gap-2 rounded-[22px] border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-[var(--foreground)] no-underline shadow-sm active:scale-[.98]">
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--brand-green-soft)] text-[var(--primary)]">
              <Icon size={24} />
            </span>
            <span className="block">
              <strong className="block text-sm font-black leading-5">{title}</strong>
              <span className="mt-1 block text-[11px] leading-4 text-[var(--muted-foreground)]">{subtitle}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-7 text-lg font-black">আরও দরকারি কাজ</h2>
      <div className="overflow-hidden rounded-[22px] border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
        {MORE_ACTIONS.map(({ href, title, subtitle, icon: Icon }, index) => (
          <Link key={href} href={href}
            className={[
              "flex min-h-[4.3rem] items-center gap-3 px-4 py-3 text-[var(--foreground)] no-underline active:bg-[var(--brand-green-faint)]",
              index > 0 ? "border-t border-[var(--border-color)]" : "",
            ].join(" ")}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--secondary)] text-[var(--primary)]">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-extrabold">{title}</strong>
              <small className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">{subtitle}</small>
            </span>
            <ArrowRight size={17} className="shrink-0 text-[var(--muted-foreground)]" />
          </Link>
        ))}
      </div>
    </section>
  );
}
