"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FileSearch, Home, MapPinned, Ruler, type LucideIcon } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { NAV_SECTIONS, isFeatureRouteActive } from "@/src/shared/config/navigation";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

const sectionMatches = (section: string, pathname: string) =>
  NAV_SECTIONS.find(s => s.id === section)?.keys.some(
    key => isFeatureRouteActive(pathname, FEATURE_ROUTES[key]),
  ) ?? false;

const TABS: readonly Tab[] = [
  { href: "/", label: "হোম", icon: Home, match: p => p === "/" },
  { href: FEATURE_ROUTES.records, label: "রেকর্ড", icon: FileSearch, match: p => sectionMatches("records", p) },
  { href: FEATURE_ROUTES.landMeasurement, label: "হিসাব", icon: Ruler, match: p => sectionMatches("calculations", p) },
  { href: FEATURE_ROUTES.landMap, label: "মানচিত্র", icon: MapPinned, match: p => sectionMatches("maps", p) },
  { href: "/explore", label: "সব সেবা", icon: Compass, match: p => p === "/explore" },
];

/** Fixed 5-destination native navigation: all other screens open as full pages, never modal sheets. */
export default function MobileFloatingNav() {
  const pathname = usePathname() || "/";
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/403") ||
    pathname.startsWith("/geospatial-map") ||
    pathname.startsWith("/lios-map") ||
    pathname.startsWith("/warishsanad") ||
    pathname.startsWith("/warish/")
  ) return null;

  return (
    <>
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden print:hidden" aria-hidden="true" />
      <nav className="landbd-native-tabbar fixed inset-x-0 bottom-0 z-[1100] md:hidden print:hidden"
        aria-label="LandBD মোবাইল ট্যাব">
        <div className="mx-auto grid max-w-screen-sm grid-cols-5 gap-1 px-2 pt-1.5"
          style={{ paddingBottom: "max(.5rem, env(safe-area-inset-bottom))" }}>
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-[3.5rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1 text-center no-underline transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)]",
                  active ? "bg-[var(--brand-green-faint)] text-[var(--primary)]" :
                  "text-[var(--muted-foreground)] active:bg-[var(--muted)]",
                ].join(" ")}
              >
                <Icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span className="max-w-full truncate text-[10px] font-extrabold leading-4">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
