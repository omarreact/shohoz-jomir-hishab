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
      p.startsWith("/dap-map") ||
      p.startsWith("/mouza-map") ||
      p.startsWith("/geospatial-map") ||
      p.startsWith("/map"),
  },
];

function isActive(pathname: string, tab: Tab) {
  if (tab.match) return tab.match(pathname);
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

/**
 * Mobile-only primary navigation.
 * Uses the same white + gold visual language as the reference mobile app and
 * preserves safe-area spacing on modern Android/iOS devices.
 */
export default function MobileFloatingNav() {
  const pathname = usePathname() || "/";

  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return null;
  }

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
          <div className="flex items-stretch justify-between gap-0.5 rounded-[1.15rem] border border-[var(--border-color)] bg-white/98 px-1 py-1.5 shadow-[0_-6px_28px_rgba(24,29,37,0.10)] backdrop-blur-xl">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab);
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex min-h-[3.45rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 no-underline transition-colors ${
                    active
                      ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      active ? "bg-[var(--brand-gold-soft)]" : "bg-transparent"
                    }`}
                  >
                    <Icon
                      className="h-[1.15rem] w-[1.15rem] shrink-0"
                      strokeWidth={active ? 2.5 : 2}
                      aria-hidden
                    />
                  </span>
                  <span className="max-w-full truncate text-[10.5px] font-bold leading-tight">
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
