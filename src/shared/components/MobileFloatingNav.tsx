"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calculator,
  Ruler,
  Scale,
  Map,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: FEATURE_ROUTES.home,
    label: "হোম",
    icon: Home,
    match: (p) => p === "/",
  },
  {
    href: FEATURE_ROUTES.records,
    label: "খতিয়ান",
    icon: Calculator,
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    label: "পরিমাপ",
    icon: Ruler,
  },
  {
    href: FEATURE_ROUTES.inheritance,
    label: "ফারায়েজ",
    icon: Scale,
  },
  {
    href: FEATURE_ROUTES.landMap,
    label: "মানচিত্র",
    icon: Map,
    match: (p) =>
      p.startsWith(FEATURE_ROUTES.landMap) ||
      p.startsWith("/geospatial-map") ||
      p.startsWith("/mouza-map") ||
      p.startsWith("/dap-map"),
  },
];

function isActive(pathname: string, tab: Tab) {
  if (tab.match) return tab.match(pathname);
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

/**
 * Mobile-only bottom floating nav — large targets for all ages.
 * Hidden on md+ and on admin/login routes.
 */
export default function MobileFloatingNav() {
  const pathname = usePathname() || "/";

  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <>
      {/* Mobile spacer so page content / footer clear the fixed bottom nav */}
      <div
        className="h-[4.75rem] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden
      />

      <nav
        className="fixed inset-x-0 bottom-0 z-[1100] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="মোবাইল মেনু"
      >
        <div className="mx-auto max-w-lg px-2 pb-2 pt-1">
          <div className="flex items-stretch justify-between gap-0.5 rounded-2xl border border-slate-200/90 bg-white/95 px-1 py-1.5 shadow-[0_-4px_24px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)]">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 no-underline transition ${
                    active
                      ? "bg-[#006a4e] text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    strokeWidth={active ? 2.5 : 2}
                    aria-hidden
                  />
                  <span
                    className={`max-w-full truncate text-[11px] font-bold leading-tight ${
                      active ? "text-white" : ""
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
