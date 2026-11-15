"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  FileText,
  LayoutGrid,
  MapPinned,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { LAND_SERVICES, type LandService } from "@/src/shared/config/service-catalog";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "share-calculator": Calculator,
  "land-measurement": Calculator,
  faraez: Scale,
  "dlrms-khatian": FileSearch,
  "survey-khatian": FileSearch,
  "mouza-khatian-book": BookOpen,
  porcha: FileText,
  "geospatial-map": MapPinned,
  "mouza-map": MapPinned,
  "rajuk-plot": MapPinned,
};

const CATEGORY_ORDER = ["হিসাব", "খতিয়ান", "মানচিত্র"] as const;

function ServiceNavigationButton({
  service,
  active,
  onSelect,
}: {
  service: LandService;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = SERVICE_ICONS[service.id] ?? LayoutGrid;
  return (
    <button
      type="button"
      role="tab"
      id={`service-tab-${service.id}`}
      aria-selected={active}
      aria-controls={`service-panel-${service.id}`}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        active
          ? "bg-[var(--brand-gold)] text-[var(--primary-foreground)] shadow-sm"
          : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-white/16" : "bg-[var(--brand-green-faint)] text-[var(--primary)]"}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-base font-bold leading-6">{service.label}</span>
      <ArrowLeft size={17} className={active ? "opacity-100" : "opacity-35"} aria-hidden="true" />
    </button>
  );
}

/** Accessible service switcher: only the selected service panel is mounted. */
export default function AllServicesWorkspace() {
  const [activeId, setActiveId] = useState(LAND_SERVICES[0].id);
  const activeService = useMemo(
    () => LAND_SERVICES.find((service) => service.id === activeId) ?? LAND_SERVICES[0],
    [activeId],
  );
  const ActiveIcon = SERVICE_ICONS[activeService.id] ?? LayoutGrid;

  useEffect(() => {
    const updateFromHash = () => {
      const requested = window.location.hash.replace(/^#/, "");
      if (LAND_SERVICES.some((service) => service.id === requested)) setActiveId(requested);
    };
    const timer = window.setTimeout(updateFromHash, 0);
    window.addEventListener("hashchange", updateFromHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, []);

  const selectService = (id: string) => {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => document.getElementById("active-service-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <section className="min-h-[calc(100dvh-6rem)] bg-[linear-gradient(180deg,var(--brand-green-faint)_0,transparent_24rem)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 text-sm font-bold text-[var(--primary)] shadow-sm">
            <LayoutGrid size={18} aria-hidden="true" /> LandBD সেবা কেন্দ্র
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">সকল ভূমি সেবা, এক জায়গায়</h1>
          <p className="mt-4 text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
            বাম পাশের তালিকা থেকে একটি সেবা নির্বাচন করুন। নির্বাচিত সেবার তথ্য ডান পাশে দেখাবে এবং সেখান থেকে মূল সেবা পেজে যেতে পারবেন।
          </p>
        </header>

        <div className="mb-5 lg:hidden">
          <label htmlFor="mobile-service-selector" className="mb-2 block text-base font-bold">সেবা নির্বাচন করুন</label>
          <select
            id="mobile-service-selector"
            value={activeId}
            onChange={(event) => selectService(event.target.value)}
            className="min-h-14 w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 text-base font-bold text-[var(--foreground)] shadow-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_18%,transparent)]"
          >
            {CATEGORY_ORDER.map((category) => (
              <optgroup label={category} key={category}>
                {LAND_SERVICES.filter((service) => service.category === category).map((service) => (
                  <option key={service.id} value={service.id}>{service.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 shadow-[var(--shadow-md)] lg:block" aria-label="সেবার তালিকা">
            <div className="mb-3 border-b border-[var(--border-color)] px-3 pb-3 pt-2">
              <p className="text-lg font-black">সেবাসমূহ</p>
              <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">মোট {LAND_SERVICES.length}টি সেবা</p>
            </div>
            <div role="tablist" aria-orientation="vertical" className="space-y-4">
              {CATEGORY_ORDER.map((category) => (
                <section key={category} aria-label={category}>
                  <h2 className="px-3 pb-1 text-sm font-bold text-[var(--muted-foreground)]">{category}</h2>
                  <div className="space-y-1">
                    {LAND_SERVICES.filter((service) => service.category === category).map((service) => (
                      <ServiceNavigationButton key={service.id} service={service} active={service.id === activeId} onSelect={() => selectService(service.id)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>

          <section
            id="active-service-panel"
            className="scroll-mt-28"
            aria-live="polite"
          >
            <article
              key={activeService.id}
              id={`service-panel-${activeService.id}`}
              role="tabpanel"
              aria-labelledby={`service-tab-${activeService.id}`}
              className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-lg)] duration-300"
            >
              <div className="relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--brand-green-faint)] p-6 sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--primary)] opacity-[.06]" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-sm">
                    <ActiveIcon size={30} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--brand-gold-text)]">{activeService.category} সেবা</p>
                    <h2 className="mt-1 text-2xl font-black sm:text-3xl lg:text-4xl">{activeService.label}</h2>
                    <p lang="en" className="mt-1 text-base font-semibold text-[var(--muted-foreground)]">{activeService.englishLabel}</p>
                    <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[var(--foreground)]">{activeService.summary}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <h3 className="text-xl font-black">এই সেবা সম্পর্কে</h3>
                <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--muted-foreground)]">{activeService.description}</p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {activeService.highlights.map((highlight) => (
                    <div key={highlight} className="flex min-h-24 items-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] p-4">
                      <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                      <span className="text-base font-bold leading-6">{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border-color)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-[var(--muted-foreground)]">মূল সেবা পেজে আপনার কাজ চালিয়ে যান।</p>
                  <Link href={activeService.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-6 py-3 text-base font-black text-[var(--primary-foreground)] no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    সেবা খুলুন <ExternalLink size={18} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
    </section>
  );
}
