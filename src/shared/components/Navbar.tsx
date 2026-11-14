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
  Home,
  LogIn,
  Map,
  Ruler,
  Search,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole, isStaffRole } from "@/src/modules/auth/roles";
import { NAV_SECTIONS, isFeatureRouteActive } from "@/src/shared/config/navigation";
import {
  FEATURE_LABELS,
  FEATURE_ROUTES,
  type FeatureRouteKey,
} from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";
import MobileSidebar from "@/src/shared/components/MobileSidebar";

type NavItem = {
  key: FeatureRouteKey | "cms";
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

const NAV_ICONS: Partial<Record<FeatureRouteKey, LucideIcon>> = {
  home: Home,
  records: Calculator,
  dlrmsKhatian: Search,
  landMeasurement: Ruler,
  inheritance: Users,
  landMap: Map,
  mouzaDownload: Map,
  mapQa: Map,
  documents: FileText,
  blog: BookOpen,
  faq: BookOpen,
  contact: Users,
  privacy: ShieldCheck,
  terms: FileText,
  login: LogIn,
  admin: ShieldCheck,
};

function navItem(key: FeatureRouteKey, options?: { adminOnly?: boolean }): NavItem {
  return {
    key,
    href: FEATURE_ROUTES[key],
    label: FEATURE_LABELS[key].bn,
    icon: NAV_ICONS[key] ?? FileText,
    adminOnly: options?.adminOnly,
  };
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  records: FileSearch,
  calculations: Calculator,
  maps: Map,
  documents: FileText,
  guides: BookOpen,
};

const NAV_GROUPS: NavGroup[] = NAV_SECTIONS.map((section) => ({
  id: section.id,
  label: section.label,
  icon: SECTION_ICONS[section.id] ?? FileText,
  items: section.keys.map(key => navItem(key, { adminOnly: key === "mapQa" })),
}));

function activePath(pathname: string, href: string) {
  return isFeatureRouteActive(pathname, href);
}

function groupIsActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => activePath(pathname, item.href));
}

export default function Navbar() {
  const pathname = usePathname();
  const isMapRoute =
    pathname.startsWith("/geospatial-map") || pathname.startsWith("/lios-map");
  const { user, isLoggedIn } = useAuth();
  const canSeeMapQa = isLoggedIn && isAdminRole(user?.role);
  const canAccessAdmin = isLoggedIn && isStaffRole(user?.role);

  const [cmsGroups,setCmsGroups]=useState<NavGroup[]>([]);
  useEffect(()=>{
    let alive=true;
    void fetch("/api/public/navigation",{cache:"no-store"}).then(r=>r.json()).then((data:{sections?:Array<{title:string;links:Array<{href:string;label:string}>}>})=>{
      if(!alive)return;
      setCmsGroups((data.sections??[]).map((section,i)=>({
        id:"cms-"+i,label:section.title,icon:FileText,
        items:section.links.map(link=>({key:"cms" as const,href:link.href,label:link.label,icon:FileText}))
      })));
    }).catch(()=>undefined);
    return()=>{alive=false;};
  },[]);
  const visibleGroups = useMemo(() => {
    // Five stable desktop dropdown groups, even on tablet widths. Additional
    // CMS links stay accessible under Guides rather than adding top-level tabs.
    const cmsItems = cmsGroups.flatMap((group) => group.items);
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: [
        ...group.items.filter((item) => !item.adminOnly || canSeeMapQa),
        ...(group.id === "guides" ? cmsItems : []),
      ],
    })).filter((group) => group.items.length > 0);
  }, [canSeeMapQa, cmsGroups]);

  const searchableNav = useMemo<NavItem[]>(
    () => [navItem("home"), ...visibleGroups.flatMap((group) => group.items)],
    [visibleGroups],
  );

  const [desktopOpenGroup, setDesktopOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const desktopNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDesktopOpenGroup(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
            setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
            setDesktopOpenGroup(null);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        desktopOpenGroup &&
        desktopNavRef.current &&
        !desktopNavRef.current.contains(event.target as Node)
      ) {
        setDesktopOpenGroup(null);
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [desktopOpenGroup]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchableNav.filter(
      (item) =>
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    );
  }, [query, searchableNav]);

  const shell =
    "border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_94%,transparent)] text-[var(--foreground)] shadow-sm backdrop-blur-xl";

  return (
    <>
      <nav
        className={`${isMapRoute ? "absolute left-0 right-0 top-0" : "sticky top-0"} z-[1100] px-3 pt-3 sm:px-4`}
        aria-label="প্রধান নেভিগেশন"
      >
        <div
          className={`mx-auto flex h-14 max-w-[1440px] items-center gap-3 rounded-[14px] px-3 sm:px-4 ${shell}`}
        >
          <Link
            href={FEATURE_ROUTES.home}
            className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
            aria-label={`${SITE_CONFIG.name} — হোম`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--brand-gold)] text-[var(--primary-foreground)] shadow-sm">
              <Calculator size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight sm:text-base">
                {SITE_CONFIG.name}
              </span>
              <span className="hidden text-[10px] font-medium leading-none text-[var(--muted-foreground)] xl:block">
                {SITE_CONFIG.shortName}
              </span>
            </span>
          </Link>

          <div
            ref={desktopNavRef}
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex"
          >
            {visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              const active = groupIsActive(pathname, group);
              const open = desktopOpenGroup === group.id;

              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => setDesktopOpenGroup(group.id)}
                  onMouseLeave={() => setDesktopOpenGroup(null)}
                  onFocus={() => setDesktopOpenGroup(group.id)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDesktopOpenGroup(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setDesktopOpenGroup(open ? null : group.id)}
                    className={`flex items-center gap-1 rounded-[12px] px-1.5 py-2 text-[11px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-gold)_40%,transparent)] lg:gap-1.5 lg:px-2.5 lg:text-[13px] 2xl:px-3 2xl:text-sm ${
                      active
                        ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <GroupIcon size={15} className="hidden shrink-0 xl:block" />
                    <span className="whitespace-nowrap">{group.label}</span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-2 transition-all duration-150 ${
                      open
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div
                      className={`max-h-[min(72vh,36rem)] overflow-y-auto rounded-[14px] p-1.5 shadow-xl shadow-black/10 ${shell}`}
                      role="menu"
                      aria-label={group.label}
                    >
                      <div className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        {group.label}
                      </div>
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const itemActive = activePath(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setDesktopOpenGroup(null)}
                            className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-semibold no-underline transition-colors ${
                              itemActive
                                ? "bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)]"
                                : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                itemActive
                                  ? "bg-[var(--brand-gold)] text-[var(--primary-foreground)]"
                                  : "bg-[var(--secondary)] text-[var(--foreground)]"
                              }`}
                            >
                              <ItemIcon size={15} />
                            </span>
                            <span className="min-w-0 flex-1">{item.label}</span>
                            {itemActive ? (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-gold-strong)]" />
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {canAccessAdmin ? (
              <Link
                href={FEATURE_ROUTES.admin}
                className="hidden min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-2 text-xs font-bold text-[var(--primary-foreground)] no-underline hover:opacity-90 md:inline-flex xl:px-3"
                aria-label="LandBD Admin Dashboard খুলুন"
              >
                <ShieldCheck size={16} /><span className="hidden xl:inline">ড্যাশবোর্ড</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                            setSearchOpen(true);
              }}
              className="hidden min-h-10 items-center gap-2 rounded-[12px] border border-[var(--border-color)] bg-white px-2 text-xs font-bold text-[var(--muted-foreground)] shadow-[var(--shadow-xs)] transition hover:border-[color-mix(in_srgb,var(--primary)_24%,var(--border-color))] hover:bg-[var(--brand-green-faint)] hover:text-[var(--foreground)] md:flex xl:px-3"
              aria-label="LandBD কমান্ড সার্চ খুলুন"
            >
              <Search size={16} />
              <span className="hidden 2xl:inline">সার্চ</span>
              <kbd className="hidden rounded-md border border-[var(--border-color)] bg-[var(--canvas)] px-1.5 py-0.5 text-[9px] font-extrabold text-[var(--muted-foreground)] xl:inline">
                Ctrl K
              </kbd>
            </button>
            <MobileSidebar />
          </div>
        </div>
      </nav>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[1300] flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm"
          onMouseDown={() => setSearchOpen(false)}
        >
          <div
            className={`w-full max-w-xl overflow-hidden rounded-[14px] ${shell}`}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="সাইট সার্চ"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4">
              <Search size={18} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="টুল, মানচিত্র, ব্লগ বা পেজ খুঁজুন..."
                className="h-14 flex-1 bg-transparent text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="সার্চ বন্ধ করুন"
                className="flex h-9 w-9 items-center justify-center rounded-[12px] hover:bg-[var(--secondary)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSearchOpen(false)}
                  className={`flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm font-semibold no-underline transition-colors ${
                    activePath(pathname, href)
                      ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon size={17} /> {label}
                </Link>
              ))}
              {!results.length && (
                <p className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]">
                  কোনো ফলাফল পাওয়া যায়নি
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
