"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  FileSearch,
  MapPinned,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

const QUICK_CARDS = [
  {
    icon: MapPinned,
    title: "ভূমি মানচিত্র",
    desc: "RS/MS মানচিত্রে প্লট ও মৌজা দেখুন",
    href: FEATURE_ROUTES.landMap,
  },
  {
    icon: FileSearch,
    title: "খতিয়ান অনুসন্ধান",
    desc: "DLRMS থেকে খতিয়ানের তথ্য দেখুন",
    href: FEATURE_ROUTES.dlrmsKhatian,
  },
  {
    icon: Ruler,
    title: "জমি পরিমাপ",
    desc: "শতক, কাঠা ও একরের হিসাব করুন",
    href: FEATURE_ROUTES.landMeasurement,
  },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--card-bg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block"
        style={{
          background:
            "radial-gradient(circle at 70% 35%, rgba(244,185,40,.22), transparent 18rem), linear-gradient(135deg, rgba(244,185,40,.06), rgba(255,255,255,0))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-14 h-80 w-80 rounded-full border border-[color-mix(in_srgb,var(--brand-gold)_18%,transparent)] opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-32 h-56 w-56 rounded-full border border-[color-mix(in_srgb,var(--brand-gold)_22%,transparent)] opacity-50"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <div className="landbd-section-kicker mb-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold sm:text-sm">
            <ShieldCheck size={15} />
            বাংলাদেশের ভূমি হিসাবের সহজ ডিজিটাল প্ল্যাটফর্ম
          </div>

          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.02] tracking-[-0.04em] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
            Land<span className="text-[var(--brand-gold)]">BD</span>
          </h1>
          <p className="mt-4 text-2xl font-extrabold leading-tight text-[var(--foreground)] sm:text-3xl">
            সহজ জমির হিসাব
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
            খতিয়ান, জমি পরিমাপ, ফারায়েজ, মৌজা ও RAJUK GIS—প্রয়োজনীয় ভূমি তথ্য ও হিসাবের টুলগুলো এক জায়গায় ব্যবহার করুন।
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={FEATURE_ROUTES.dlrmsKhatian}
              className="landbd-primary-button inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold no-underline sm:text-base"
            >
              <FileSearch size={19} />
              খতিয়ান অনুসন্ধান করুন
              <ArrowRight size={17} />
            </Link>
            <Link
              href="#tools"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-3.5 text-sm font-extrabold text-[var(--foreground)] no-underline shadow-sm transition hover:border-[color-mix(in_srgb,var(--brand-gold)_45%,var(--border-color))] hover:bg-[var(--brand-gold-faint)] sm:text-base"
            >
              <Calculator size={18} />
              সব সেবা দেখুন
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-[var(--muted-foreground)]">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              লগইন ছাড়াই পাবলিক টুল
            </span>
            <span>বাংলা ইন্টারফেস</span>
            <span>মোবাইল উপযোগী</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute inset-8 rounded-[2rem] bg-[var(--brand-gold-soft)] blur-3xl" aria-hidden />
          <div className="relative grid gap-4 sm:grid-cols-2">
            {QUICK_CARDS.map(({ icon: Icon, title, desc, href }, index) => (
              <Link
                key={title}
                href={href}
                className={`group landbd-card-elevated flex min-h-[11rem] flex-col justify-between p-5 no-underline transition hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] ${
                  index === 0 ? "sm:col-span-2 sm:ml-auto sm:w-[72%]" : ""
                }`}
              >
                <span className="landbd-icon-tile h-12 w-12">
                  <Icon size={24} />
                </span>
                <div className="mt-6">
                  <h2 className="text-lg font-extrabold text-[var(--foreground)]">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#9a6700] dark:text-[#f7d36f]">
                    খুলুন <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
