"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  FileSearch,
  FileText,
  Home,
  Map,
  Menu,
  Ruler,
  Scale,
  X,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

type Tab = {
  href?: string;
  label: string;
  icon: LucideIcon;
  match?: (path: string) => boolean;
  action?: "menu";
};

const TABS: Tab[] = [
  { href: FEATURE_ROUTES.home, label: "হোম", icon: Home, match: (p) => p === "/" },
  {
    href: FEATURE_ROUTES.records,
    label: "রেকর্ড",
    icon: FileSearch,
    match: (p) =>
      p.startsWith("/khatiyan") ||
      p.startsWith("/dlrms-khatian") ||
      p.startsWith("/settlement-khatian") ||
      p.startsWith("/history"),
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    label: "হিসাব",
    icon: Ruler,
    match: (p) => p.startsWith("/land-measurement") || p.startsWith("/faraez"),
  },
  {
    href: FEATURE_ROUTES.landMap,
    label: "ম্যাপ",
    icon: Map,
    match: (p) =>
      p.startsWith("/dap-map") ||
      p.startsWith("/mouza-map") ||
      p.startsWith("/geospatial-map") ||
      p.startsWith("/map"),
  },
  { label: "মেনু", icon: Menu, action: "menu" },
];

const MENU_ITEMS = [
  { href: FEATURE_ROUTES.dlrmsKhatian, label: "DLRMS খতিয়ান", icon: FileSearch, group: "রেকর্ড" },
  { href: FEATURE_ROUTES.landMeasurement, label: "জমি পরিমাপ", icon: Ruler, group: "হিসাব" },
  { href: FEATURE_ROUTES.inheritance, label: "ফারায়েজ", icon: Scale, group: "হিসাব" },
  { href: FEATURE_ROUTES.mouzaDownload, label: "মৌজা ম্যাপ", icon: Map, group: "মানচিত্র" },
  { href: FEATURE_ROUTES.mouzaPorchaReport, label: "মৌজা পর্চা রিপোর্ট", icon: FileText, group: "ডকুমেন্ট" },
  { href: FEATURE_ROUTES.warishSanad, label: "ওয়ারিশ সনদ", icon: FileText, group: "ডকুমেন্ট" },
  { href: FEATURE_ROUTES.blog, label: "ব্লগ ও গাইড", icon: BookOpen, group: "গাইড" },
] as const;

function isActive(pathname: string, tab: Tab) {
  if (tab.action === "menu") return false;
  if (tab.match) return tab.match(pathname);
  return Boolean(tab.href && (pathname === tab.href || pathname.startsWith(`${tab.href}/`)));
}

export default function MobileFloatingNav() {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/geospatial-map")
  ) {
    return null;
  }

  const menuRouteActive = MENU_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <>
      <div
        className="h-[5.35rem] md:hidden print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-[1100] md:hidden print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="মোবাইল মেনু"
      >
        <div className="mx-auto max-w-lg px-2.5 pb-2 pt-1">
          <div className="flex items-stretch justify-between gap-0.5 rounded-[14px] border border-[var(--border-color)] bg-white/98 px-1 py-1.5 shadow-[0_-8px_30px_rgba(11,45,30,.10)] backdrop-blur-xl">
            {TABS.map((tab) => {
              const active = tab.action === "menu" ? menuOpen || menuRouteActive : isActive(pathname, tab);
              const Icon = tab.icon;
              const className = `flex min-h-[3.45rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 py-1.5 no-underline transition-colors ${
                active
                  ? "bg-[var(--brand-green-faint)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--canvas)] hover:text-[var(--foreground)]"
              }`;

              if (tab.action === "menu") {
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className={className}
                    aria-expanded={menuOpen}
                    aria-label="আরও সেবা খুলুন"
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? "bg-[var(--brand-green-soft)]" : ""}`}>
                      <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={active ? 2.5 : 2} />
                    </span>
                    <span className="max-w-full truncate text-[10.5px] font-bold leading-tight">{tab.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href!}
                  className={className}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? "bg-[var(--brand-green-soft)]" : ""}`}>
                    <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={active ? 2.5 : 2} aria-hidden />
                  </span>
                  <span className="max-w-full truncate text-[10.5px] font-bold leading-tight">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-[1400] md:hidden print:hidden" role="dialog" aria-modal="true" aria-label="LandBD সেবা">
          <button
            type="button"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
            aria-label="মেনু বন্ধ করুন"
          />
          <section className="absolute inset-x-2 bottom-2 max-h-[78%] overflow-hidden rounded-[16px] border border-[var(--border-color)] bg-white shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[var(--survey-teal)]">LANDBD</p>
                <h2 className="text-base font-black text-[var(--foreground)]">সব সেবা</h2>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--muted-foreground)]"
                onClick={() => setMenuOpen(false)}
                aria-label="মেনু বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid max-h-[60vh] gap-2 overflow-y-auto p-3 sm:grid-cols-2">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex min-h-[4.25rem] items-center gap-3 rounded-[12px] border p-3 no-underline ${
                      active
                        ? "border-[color-mix(in_srgb,var(--primary)_25%,var(--border-color))] bg-[var(--brand-green-faint)]"
                        : "border-[var(--border-color)] bg-white"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--canvas)] text-[var(--primary)]">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-[var(--foreground)]">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] font-bold text-[var(--muted-foreground)]">{item.group}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
