"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Download,
  FileSearch,
  MapPinned,
  Ruler,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

const HERO_FEATURES = [
  { icon: FileSearch, label: "DLRMS খতিয়ান", href: FEATURE_ROUTES.dlrmsKhatian },
  { icon: MapPinned, label: "RAJUK GIS", href: FEATURE_ROUTES.landMap },
  { icon: Download, label: "মৌজা ম্যাপ", href: FEATURE_ROUTES.mouzaDownload },
  { icon: Scale, label: "ফারায়েজ", href: FEATURE_ROUTES.inheritance },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border-color)] bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(244,185,40,.18),transparent_28rem)]" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full border border-amber-200/70" aria-hidden />
      <div className="pointer-events-none absolute right-8 top-44 h-52 w-52 rounded-full border border-amber-200/60" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-20">
        <div>
          <div className="landbd-section-kicker mb-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold sm:text-sm">
            <ShieldCheck size={15} />
            ভূমি তথ্য, হিসাব ও মানচিত্র — এক প্ল্যাটফর্মে
          </div>

          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
            Land<span className="text-[var(--brand-gold)]">BD</span>
          </h1>
          <p className="mt-4 text-2xl font-extrabold text-[var(--foreground)] sm:text-3xl">
            বাংলাদেশের স্মার্ট ভূমি সহায়ক
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
            DLRMS খতিয়ান, খতিয়ান হিসাব, জমি পরিমাপ, ফারায়েজ, RAJUK GIS, RS/MS মৌজা ম্যাপ ও পর্চা—LandBD-এর বর্তমান গুরুত্বপূর্ণ সেবাগুলো এখন আরও সহজভাবে এক জায়গায়।
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={FEATURE_ROUTES.dlrmsKhatian}
              className="landbd-primary-button inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold no-underline sm:text-base"
            >
              <FileSearch size={19} />
              খতিয়ান অনুসন্ধান
              <ArrowRight size={17} />
            </Link>
            <Link
              href={FEATURE_ROUTES.landMap}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-6 py-3.5 text-sm font-extrabold text-[var(--foreground)] no-underline shadow-sm transition hover:border-amber-300 hover:bg-[var(--brand-gold-faint)] sm:text-base"
            >
              <MapPinned size={18} />
              মানচিত্র খুলুন
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {HERO_FEATURES.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--foreground)] no-underline shadow-sm transition hover:border-amber-300 hover:bg-[var(--brand-gold-faint)]"
              >
                <Icon size={14} className="text-[#9a6700]" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="landbd-card-elevated overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a6700]">দ্রুত কাজ</p>
                <h2 className="mt-1 text-xl font-extrabold text-[var(--foreground)]">আজ কী করতে চান?</h2>
              </div>
              <div className="landbd-icon-tile h-12 w-12"><Calculator size={23} /></div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href={FEATURE_ROUTES.records} className="group rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4 no-underline transition hover:border-amber-300 hover:bg-[var(--brand-gold-faint)]">
                <Calculator className="h-5 w-5 text-[#9a6700]" />
                <h3 className="mt-3 font-extrabold text-[var(--foreground)]">খতিয়ান হিসাব</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">আনা, গন্ডা ও হিস্যার হিসাব</p>
              </Link>
              <Link href={FEATURE_ROUTES.landMeasurement} className="group rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4 no-underline transition hover:border-amber-300 hover:bg-[var(--brand-gold-faint)]">
                <Ruler className="h-5 w-5 text-blue-600" />
                <h3 className="mt-3 font-extrabold text-[var(--foreground)]">জমি পরিমাপ</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">শতক, কাঠা, বিঘা ও একক রূপান্তর</p>
              </Link>
              <Link href={FEATURE_ROUTES.inheritance} className="group rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4 no-underline transition hover:border-amber-300 hover:bg-[var(--brand-gold-faint)]">
                <Scale className="h-5 w-5 text-violet-600" />
                <h3 className="mt-3 font-extrabold text-[var(--foreground)]">ফারায়েজ</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">উত্তরাধিকার বণ্টনের সহায়ক হিসাব</p>
              </Link>
              <Link href={FEATURE_ROUTES.mouzaDownload} className="group rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4 no-underline transition hover:border-amber-300 hover:bg-[var(--brand-gold-faint)]">
                <Download className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 font-extrabold text-[var(--foreground)]">মৌজা ম্যাপ</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">RS/MS মৌজা নির্বাচন ও এক্সপোর্ট</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
