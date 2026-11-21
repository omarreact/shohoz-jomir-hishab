"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, Calculator, FileSearch, FileText, LayoutGrid, MapPinned, Ruler, Scale, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { LAND_SERVICES } from "@/src/shared/config/service-catalog";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "share-calculator": Calculator,
  "land-measurement": Ruler,
  faraez: Scale,
  "dlrms-khatian": FileSearch,
  "mouza-khatian-book": BookOpen,
  porcha: FileText,
  "geospatial-map": MapPinned,
  "mouza-map": MapPinned,
  "rajuk-plot": MapPinned,
};
const CATEGORY_ORDER = ["হিসাব", "খতিয়ান", "মানচিত্র"] as const;

/** Mobile service launcher: direct links, no redundant detail screen. */
export default function AllServicesWorkspace() {
  const { user, isLoggedIn } = useAuth();
  const isStaff = isLoggedIn && isStaffRole(user?.role);
  const [query, setQuery] = useState("");
  const services = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("bn-BD");
    return LAND_SERVICES
      .filter((service) => service.id !== "survey-khatian" && (isStaff || service.id !== "rajuk-plot"))
      .filter((item) => !q || [item.label, item.englishLabel, item.summary, item.category]
        .join(" ").toLocaleLowerCase("bn-BD").includes(q));
  }, [query, isStaff]);

  return (
    <section className="min-h-[calc(100dvh-5rem)] bg-[var(--canvas)] px-4 pb-12 pt-6 print:hidden sm:px-6" aria-labelledby="landbd-mobile-services-title">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--brand-green-faint)] px-3 py-1.5 text-sm font-bold text-[var(--primary)]">
            <LayoutGrid size={16} aria-hidden="true" /> LandBD সেবা কেন্দ্র
          </div>
          <h1 id="landbd-mobile-services-title" className="text-[clamp(1.7rem,6.5vw,2.4rem)] font-black leading-tight tracking-tight text-[var(--foreground)]">
            আপনার জমির কাজ, সহজে
          </h1>
          <p className="mt-2 leading-7 text-[var(--muted-foreground)]">সেবা বেছে নিন—সরাসরি কাজের পেজ খুলবে।</p>
        </header>

        <div className="relative mb-7">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]" size={21} aria-hidden="true" />
          <label htmlFor="landbd-mobile-service-search" className="sr-only">সেবা খুঁজুন</label>
          <input
            id="landbd-mobile-service-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="খতিয়ান, হিসাব বা ম্যাপ খুঁজুন"
            className="min-h-14 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] pl-12 pr-4 text-[18px] text-[var(--foreground)] shadow-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          />
        </div>

        {CATEGORY_ORDER.map((category) => {
          const items = services.filter((item) => item.category === category);
          if (!items.length) return null;
          return (
            <section key={category} className="mb-7" aria-label={category}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-[var(--foreground)]">{category}</h2>
                <span className="text-sm text-[var(--muted-foreground)]">{items.length}টি সেবা</span>
              </div>
              <div className="grid grid-cols-2 gap-3 min-[460px]:grid-cols-3">
                {items.map((service) => {
                  const Icon = SERVICE_ICONS[service.id] ?? LayoutGrid;
                  return (
                    <Link
                      key={service.id}
                      href={service.href}
                      aria-label={service.label}
                      className="group flex min-h-36 flex-col items-start gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-[var(--foreground)] no-underline shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-green-faint)] text-[var(--primary)]">
                        <Icon size={23} aria-hidden="true" />
                      </span>
                      <span className="flex w-full flex-1 items-end justify-between gap-1">
                        <strong className="min-w-0 text-[18px] font-bold leading-7">{service.label}</strong>
                        <ArrowUpRight size={17} className="shrink-0 text-[var(--primary)] opacity-70 transition group-hover:opacity-100" aria-hidden="true" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {services.length === 0 ? (
          <div role="status" className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-8 text-center text-[var(--foreground)]">
            কোনো সেবা পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।
          </div>
        ) : null}
        <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
          ভূমি সংক্রান্ত চূড়ান্ত সিদ্ধান্তের আগে সরকারি মূল রেকর্ড যাচাই করুন।
        </p>
      </div>
    </section>
  );
}
