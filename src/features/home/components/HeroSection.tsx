"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileSearch,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import InteractiveCommandCenter from "@/src/features/home/components/InteractiveCommandCenter";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

export default function HeroSection() {
  return (
    <section className="relative overflow-visible border-b border-[var(--border-color)] bg-[var(--canvas)]">
      <div className="pointer-events-none absolute inset-0 landbd-cadastral-grid opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_82%_14%,rgba(12,127,122,.12),transparent_24rem),radial-gradient(circle_at_16%_0%,rgba(24,163,99,.10),transparent_25rem)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div className="max-w-2xl">
            <div className="landbd-section-kicker mb-5 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold sm:text-sm">
              <ShieldCheck size={15} />
              ভূমি তথ্য · হিসাব · মানচিত্র · ডকুমেন্ট
            </div>

            <h1 className="text-[clamp(2.8rem,7vw,5.9rem)] font-black leading-[.98] tracking-[-0.055em] text-[var(--foreground)]">
              জমির কাজ,
              <span className="block text-[var(--primary)]">স্পষ্ট পথে।</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
              খতিয়ান থেকে প্লট, জমির হিসাব থেকে ওয়ারিশ সনদ—LandBD এখন কাজের ধরন অনুযায়ী সাজানো একটি
              একীভূত ভূমি ওয়ার্কস্পেস।
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={FEATURE_ROUTES.dlrmsKhatian} className="landbd-primary-button inline-flex min-h-12 items-center gap-2 px-5 py-3 text-sm font-extrabold no-underline">
                <FileSearch size={18} />
                খতিয়ান অনুসন্ধান
                <ArrowRight size={16} />
              </Link>
              <Link href={FEATURE_ROUTES.landMap} className="landbd-secondary-button inline-flex min-h-12 items-center gap-2 px-5 py-3 text-sm font-extrabold no-underline">
                <MapPinned size={18} />
                মানচিত্র খুলুন
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["01", "তথ্য দিন", "প্রয়োজনীয় রেকর্ড বা জমির তথ্য"],
                ["02", "যাচাই করুন", "উৎস, অবস্থা ও প্রাসঙ্গিক সতর্কতা"],
                ["03", "ব্যবহার করুন", "প্রিন্ট, এক্সপোর্ট বা পরবর্তী কাজ"],
              ].map(([number, title, description]) => (
                <div key={number} className="landbd-step-card">
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-20 lg:pt-2">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[var(--survey-teal)]">COMMAND CENTER</p>
                <h2 className="mt-1 text-xl font-black text-[var(--foreground)] sm:text-2xl">জমির কোন কাজটি করতে চান?</h2>
              </div>
              <span className="hidden items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-white px-3 py-2 text-[11px] font-extrabold text-[var(--muted-foreground)] sm:inline-flex">
                <BadgeCheck size={14} className="text-[var(--primary)]" />
                Bangla-first
              </span>
            </div>
            <InteractiveCommandCenter />
          </div>
        </div>
      </div>
    </section>
  );
}
