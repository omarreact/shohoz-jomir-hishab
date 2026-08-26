"use client";

import Link from "next/link";
import { Calculator, Ruler, Scale, Map, ArrowRight, ShieldCheck } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

const HIGHLIGHTS = [
  { icon: Calculator, title: "আনা-গন্ডা হিসাব", desc: "সিএস, এসএ, আরএস খতিয়ান" },
  { icon: Scale, title: "নির্ভুল বণ্টন", desc: "ফারায়েজ হিসাব সহায়তা" },
  { icon: Ruler, title: "জমি পরিমাপ", desc: "শতাংশ, কাঠা ও একর" },
  { icon: Map, title: "RS · MS মানচিত্র", desc: "মৌজা ও প্লট তথ্য" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--background)] py-14 sm:py-18 lg:py-24">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#1A6B3C]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#F0A500]/10 blur-3xl" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div>
            <div className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#1A6B3C]/20 bg-[var(--card-bg)] px-3.5 py-2 shadow-sm">
              <span className="rounded-full bg-[#F0A500]/15 px-2.5 py-1 text-xs font-bold text-[#8a5d00]">বিনামূল্যে</span>
              <span className="text-sm font-semibold text-[var(--foreground)]">বাংলাদেশের ভূমি হিসাবের সহজ টুল</span>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.2] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              {SITE_CONFIG.name}
            </h1>
            <p className="mt-4 text-xl font-semibold leading-relaxed text-[#1A6B3C] sm:text-2xl">
              খতিয়ান · পরিমাপ · ফারায়েজ · মানচিত্র
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
              খতিয়ানের হিস্যা, জমির পরিমাপ, ফারায়েজ এবং RS/MS মানচিত্র—প্রয়োজনীয় কাজগুলো এক জায়গায় সহজভাবে করুন।
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={FEATURE_ROUTES.records}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1A6B3C] px-6 py-3.5 text-sm font-bold text-white no-underline shadow-md transition hover:-translate-y-0.5 hover:bg-[#155b33] hover:shadow-lg"
              >
                <Calculator size={18} />
                খতিয়ান হিসাব শুরু করুন
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#tools"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-3.5 text-sm font-bold text-[var(--foreground)] no-underline transition hover:border-[#1A6B3C]/40 hover:bg-[var(--secondary)]"
              >
                সব টুল দেখুন
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-[#1A6B3C]" /> লগইন ছাড়াই ব্যবহার</span>
              <span>•</span>
              <span>বিনামূল্যে</span>
              <span>•</span>
              <span>বাংলা ভাষায়</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className={`rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${index % 2 ? "sm:mt-8" : ""}`}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1A6B3C]/10 text-[#1A6B3C]">
                  <Icon size={22} />
                </div>
                <h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
