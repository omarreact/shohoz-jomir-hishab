"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  FileSearch,
  FileText,
  Map as MapIcon,
  Ruler,
  Scale,
  Search,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";
import {
  FEATURE_LABELS,
  FEATURE_ROUTES,
  type FeatureRouteKey,
} from "@/src/shared/config/feature-routes";
import { GLOBAL_NAVIGATION, isFeatureRouteActive } from "@/src/shared/config/navigation";
import { SITE_CONFIG } from "@/src/shared/config/site";

type HeaderLink = {
  key: FeatureRouteKey;
  href: string;
  label: string;
  icon: LucideIcon;
};

const ICONS: Partial<Record<FeatureRouteKey, LucideIcon>> = {
  records: Calculator,
  landMeasurement: Ruler,
  inheritance: Scale,
  dlrmsKhatian: FileSearch,
  surveyKhatian: FileSearch,
  mouzaKhatianBook: BookOpen,
  documents: FileText,
  landMap: MapIcon,
  mouzaDownload: MapIcon,
  mapQa: MapIcon,
  blog: BookOpen,
  contact: Users,
  admin: ShieldCheck,
};

function routeLink(key: FeatureRouteKey, label = FEATURE_LABELS[key].bn): HeaderLink {
  return {
    key,
    href: FEATURE_ROUTES[key],
    label,
    icon: ICONS[key] ?? FileText,
  };
}

function isActive(pathname: string, href: string) {
  return isFeatureRouteActive(pathname, href);
}

/** One semantic, responsive global header for every public service page. */
export default function Navbar() {
  const pathname = usePathname() || "/";
  const isMapRoute = pathname.startsWith("/geospatial-map");
  const { user, isLoggedIn } = useAuth();
  const canAccessAdmin = isLoggedIn && isStaffRole(user?.role);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigationRef = useRef<HTMLDivElement | null>(null);

  const searchableLinks = useMemo(() => {
    const links = GLOBAL_NAVIGATION.flatMap((item) =>
      item.type === "link"
        ? [routeLink(item.key, item.label)]
        : item.keys.map((key) => routeLink(key)),
    );
    return Array.from(new Map(links.map((item) => [item.href, item])).values());
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return searchableLinks.filter((item) =>
      !normalized || `${item.label} ${FEATURE_LABELS[item.key].en} ${item.href}`.toLowerCase().includes(normalized),
    );
  }, [query, searchableLinks]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setOpenDropdown(null);
        setSearchOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (navigationRef.current && !navigationRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const shell = "border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_96%,transparent)] text-[var(--foreground)] shadow-[0_12px_36px_rgba(16,32,25,.08)] backdrop-blur-xl";

  return (
    <>
      <header
        className={`${isMapRoute ? "absolute inset-x-0 top-0" : "sticky top-0"} z-[1200] px-3 pt-3 print:hidden sm:px-4`}
        data-landbd-global-header
      >
        <div className={`mx-auto flex h-[4.5rem] max-w-[1600px] flex-nowrap items-center gap-3 rounded-2xl px-4 ${shell}`}>
          <Link
            href={FEATURE_ROUTES.home}
            aria-label={`${SITE_CONFIG.name} — হোম`}
            className="mr-1 flex min-w-0 shrink-0 items-center gap-2.5 no-underline"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold)] text-[var(--primary-foreground)] shadow-sm">
              <Calculator size={21} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span lang="en" className="block truncate text-xl font-black leading-none tracking-tight">{SITE_CONFIG.shortName}</span>
              <span className="hidden truncate text-sm font-semibold leading-tight text-[var(--muted-foreground)] 2xl:block">ডিজিটাল ভূমি সেবা</span>
            </span>
          </Link>

          <nav
            ref={navigationRef}
            aria-label="প্রধান নেভিগেশন"
            className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-0.5"
          >
            {GLOBAL_NAVIGATION.map((item) => {
              if (item.type === "link") {
                const link = routeLink(item.key, item.label);
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={item.key}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`whitespace-nowrap rounded-xl px-2.5 py-2.5 text-[18px] font-bold no-underline transition-colors 2xl:px-3 ${
                      active
                        ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }

              const open = openDropdown === item.id;
              const links = item.keys.map((key) => routeLink(key));
              const active = links.some((link) => isActive(pathname, link.href));
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                  onFocus={() => setOpenDropdown(item.id)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenDropdown(null);
                  }}
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpenDropdown(open ? null : item.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-[18px] font-bold transition-colors 2xl:px-3 ${
                      active
                        ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {item.label}
                    <ChevronDown size={17} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  <div className={`absolute left-1/2 top-full w-72 -translate-x-1/2 pt-2 transition ${open ? "visible opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
                    <div role="menu" aria-label={item.label} className={`rounded-2xl p-2 ${shell}`}>
                      <p className="px-3 pb-1 pt-2 text-sm font-bold text-[var(--muted-foreground)]">{item.label}</p>
                      {links.map((link) => {
                        const Icon = link.icon;
                        const linkActive = isActive(pathname, link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            role="menuitem"
                            onClick={() => setOpenDropdown(null)}
                            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-[18px] font-bold no-underline transition-colors ${
                              linkActive
                                ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]"
                                : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-green-faint)] text-[var(--primary)]">
                              <Icon size={18} aria-hidden="true" />
                            </span>
                            <span>{link.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="ml-1 flex shrink-0 items-center gap-2">
            {canAccessAdmin ? (
              <Link
                href={FEATURE_ROUTES.admin}
                aria-label="অ্যাডমিন ড্যাশবোর্ড"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-gold)] text-[var(--primary-foreground)] no-underline"
              >
                <ShieldCheck size={20} aria-hidden="true" />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="সেবা খুঁজুন"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary)] hover:bg-[var(--secondary)]"
            >
              <Search size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {searchOpen ? (
        <div className="fixed inset-0 z-[1500] flex items-start justify-center bg-black/45 p-4 pt-24 backdrop-blur-sm" onMouseDown={() => setSearchOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="সেবা খুঁজুন" className={`w-full max-w-2xl overflow-hidden rounded-2xl ${shell}`} onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4">
              <Search size={20} aria-hidden="true" />
              <label htmlFor="global-service-search" className="sr-only">সেবা খুঁজুন</label>
              <input
                id="global-service-search"
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="খতিয়ান, হিসাব, ম্যাপ বা সেবা খুঁজুন..."
                className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted-foreground)]"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="সার্চ বন্ধ করুন" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--secondary)]">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[min(60vh,32rem)] overflow-y-auto p-2">
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)} className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-base font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]">
                    <Icon size={19} className="text-[var(--primary)]" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    <span lang="en" className="text-sm font-semibold text-[var(--muted-foreground)]">{FEATURE_LABELS[item.key].en}</span>
                  </Link>
                );
              })}
              {!results.length ? <p className="p-8 text-center text-[var(--muted-foreground)]">কোনো সেবা পাওয়া যায়নি।</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
