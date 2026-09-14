"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  FileText,
  Home,
  LogIn,
  LogOut,
  Map,
  Menu,
  Moon,
  Ruler,
  Search,
  ShieldCheck,
  Sun,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole } from "@/src/modules/auth/roles";
import {
  FEATURE_LABELS,
  FEATURE_ROUTES,
  type FeatureRouteKey,
} from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type NavItem = {
  key: FeatureRouteKey;
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
  history: BookOpen,
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

const NAV_GROUPS: NavGroup[] = [
  {
    id: "records",
    label: "খতিয়ান ও রেকর্ড",
    icon: FileText,
    items: [
      navItem("records"),
      navItem("dlrmsKhatian"),
      navItem("documents"),
      navItem("history"),
    ],
  },
  {
    id: "calculations",
    label: "হিসাব ও উত্তরাধিকার",
    icon: Calculator,
    items: [navItem("landMeasurement"), navItem("inheritance")],
  },
  {
    id: "maps",
    label: "মানচিত্র ও প্লট",
    icon: Map,
    items: [
      navItem("landMap"),
      navItem("mouzaDownload"),
      navItem("mapQa", { adminOnly: true }),
    ],
  },
  {
    id: "help",
    label: "সহায়তা",
    icon: BookOpen,
    items: [navItem("blog"), navItem("faq"), navItem("contact")],
  },
  {
    id: "policies",
    label: "তথ্য ও নীতিমালা",
    icon: ShieldCheck,
    items: [navItem("terms"), navItem("privacy")],
  },
];

function normalizePath(value: string) {
  if (!value || value === "/") return "/";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function activePath(pathname: string, href: string) {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  return target === "/" ? current === "/" : current === target || current.startsWith(`${target}/`);
}

function groupIsActive(pathname: string, group: NavGroup) {
  return group.items.some((item) => activePath(pathname, item.href));
}

export default function Navbar() {
  const pathname = usePathname();
  const isMapRoute =
    pathname.startsWith("/geospatial-map") || pathname.startsWith("/lios-map");
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth();
  const canSeeMapQa = isAdminRole(user?.role);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.adminOnly || canSeeMapQa),
      })).filter((group) => group.items.length > 0),
    [canSeeMapQa],
  );

  const searchableNav = useMemo<NavItem[]>(
    () => [navItem("home"), ...visibleGroups.flatMap((group) => group.items)],
    [visibleGroups],
  );

  const activeGroupId = useMemo(
    () => visibleGroups.find((group) => groupIsActive(pathname, group))?.id ?? null,
    [pathname, visibleGroups],
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarGroup, setSidebarGroup] = useState<string | null>(null);
  const [desktopOpenGroup, setDesktopOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const desktopNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSidebarOpen(false);
    setDesktopOpenGroup(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSidebarOpen(false);
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
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

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };

  const openSidebar = () => {
    setSidebarGroup(activeGroupId ?? "records");
    setSidebarOpen(true);
  };

  const openSearchFromSidebar = () => {
    setSidebarOpen(false);
    setSearchOpen(true);
  };

  const shell =
    "border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_94%,transparent)] text-[var(--foreground)] shadow-sm backdrop-blur-xl";

  const effectiveTheme = resolvedTheme ?? theme;

  return (
    <>
      <nav
        className={`${isMapRoute ? "absolute left-0 right-0 top-0" : "sticky top-0"} z-[1100] px-3 pt-3 sm:px-4`}
        aria-label="প্রধান নেভিগেশন"
      >
        <div
          className={`mx-auto flex h-14 max-w-[1440px] items-center gap-3 rounded-2xl px-3 sm:px-4 ${shell}`}
        >
          <Link
            href={FEATURE_ROUTES.home}
            className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
            onClick={() => setSidebarOpen(false)}
            aria-label={`${SITE_CONFIG.name} — হোম`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--primary-foreground)] shadow-sm">
              <Calculator size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight sm:text-base">
                {SITE_CONFIG.name}
              </span>
              <span className="hidden text-[10px] font-medium leading-none text-[var(--muted-foreground)] sm:block">
                {SITE_CONFIG.shortName}
              </span>
            </span>
          </Link>

          <div
            ref={desktopNavRef}
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex"
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
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setDesktopOpenGroup(open ? null : group.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006a4e]/35 2xl:px-3 2xl:text-sm ${
                      active
                        ? "bg-[var(--secondary)] text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <GroupIcon size={15} className="shrink-0" />
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
                      className={`rounded-2xl p-1.5 shadow-xl shadow-black/10 ${shell}`}
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
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-colors ${
                              itemActive
                                ? "bg-[#006a4e] text-white"
                                : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                itemActive
                                  ? "bg-white/15 text-white"
                                  : "bg-[var(--secondary)] text-[var(--foreground)]"
                              }`}
                            >
                              <ItemIcon size={15} />
                            </span>
                            <span className="min-w-0 flex-1">{item.label}</span>
                            {itemActive ? (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
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

          <div className="ml-auto flex shrink-0 items-center">
            <button
              type="button"
              aria-label="সাইডবার মেনু খুলুন"
              aria-expanded={sidebarOpen}
              onClick={openSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--secondary)_75%,var(--foreground)_8%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006a4e]/35"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[1300] flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm"
          onMouseDown={() => setSearchOpen(false)}
        >
          <div
            className={`w-full max-w-xl overflow-hidden rounded-2xl ${shell}`}
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
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold no-underline transition-colors ${
                    activePath(pathname, href)
                      ? "bg-[var(--secondary)] text-[var(--foreground)]"
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

      {sidebarOpen && (
        <div className="fixed inset-0 z-[1250]" role="dialog" aria-modal="true" aria-label="সাইডবার মেনু">
          <button
            type="button"
            aria-label="সাইডবার বন্ধ করুন"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          <aside
            className={`absolute right-0 top-0 flex h-full w-[370px] max-w-[94vw] flex-col border-l p-4 shadow-2xl ${shell}`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
              <Link
                href={FEATURE_ROUTES.home}
                className="flex min-w-0 items-center gap-2 no-underline"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--primary-foreground)]">
                  <Calculator size={19} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{SITE_CONFIG.name}</strong>
                  <span className="block text-[10px] text-[var(--muted-foreground)]">
                    {SITE_CONFIG.shortName}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="সাইডবার বন্ধ করুন"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] transition-colors hover:bg-[var(--secondary)]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <section aria-label="দ্রুত নিয়ন্ত্রণ">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  দ্রুত নিয়ন্ত্রণ
                </p>

                <button
                  type="button"
                  onClick={openSearchFromSidebar}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-3 py-3 text-left transition-colors hover:text-[var(--foreground)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--card-bg)]">
                    <Search size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">সার্চ</span>
                    <span className="block text-[11px] text-[var(--muted-foreground)]">
                      পেজ, টুল, মানচিত্র বা ব্লগ খুঁজুন
                    </span>
                  </span>
                  <kbd className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                    Ctrl K
                  </kbd>
                </button>

                {mounted ? (
                  <div className="mt-2 rounded-xl border border-[var(--border-color)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--secondary)]">
                          {effectiveTheme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
                        </span>
                        <div>
                          <p className="text-sm font-bold">থিম</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            লাইট অথবা ডার্ক মোড নির্বাচন করুন
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        aria-pressed={effectiveTheme === "light"}
                        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                          effectiveTheme === "light"
                            ? "bg-[#006a4e] text-white"
                            : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <Sun size={14} /> লাইট
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        aria-pressed={effectiveTheme === "dark"}
                        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                          effectiveTheme === "dark"
                            ? "bg-[#006a4e] text-white"
                            : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <Moon size={14} /> ডার্ক
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="mt-4" aria-label="অ্যাকাউন্ট">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  অ্যাকাউন্ট
                </p>

                {authLoading ? (
                  <div className="mt-2 rounded-xl border border-[var(--border-color)] p-4 text-sm text-[var(--muted-foreground)]">
                    লগইন তথ্য যাচাই হচ্ছে…
                  </div>
                ) : isLoggedIn ? (
                  <div className="mt-2 rounded-xl border border-[var(--border-color)] p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#006a4e] text-white">
                        <User size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--foreground)]">
                          {user?.name || user?.email || "স্টাফ অ্যাকাউন্ট"}
                        </p>
                        {user?.email ? (
                          <p className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)]">
                            {user.email}
                          </p>
                        ) : null}
                        {user?.role ? (
                          <span className="mt-2 inline-flex rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[10px] font-bold text-[var(--muted-foreground)]">
                            {user.role}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Link
                        href={FEATURE_ROUTES.admin}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-3 py-2.5 text-sm font-bold text-[var(--primary-foreground)] no-underline transition-opacity hover:opacity-90"
                      >
                        <ShieldCheck size={15} /> ড্যাশবোর্ড
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/70 dark:hover:bg-red-950/20"
                      >
                        <LogOut size={15} /> লগআউট
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-[var(--border-color)] p-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)]">
                        <LogIn size={18} />
                      </span>
                      <div>
                        <p className="text-sm font-bold">স্টাফ লগইন</p>
                        <p className="mt-1 text-[11px] leading-5 text-[var(--muted-foreground)]">
                          অনুমোদিত স্টাফ বা অ্যাডমিন অ্যাকাউন্ট দিয়ে প্রবেশ করুন।
                        </p>
                      </div>
                    </div>
                    <Link
                      href={FEATURE_ROUTES.login}
                      onClick={() => setSidebarOpen(false)}
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-3 text-sm font-bold text-[var(--primary-foreground)] no-underline transition-opacity hover:opacity-90"
                    >
                      <LogIn size={16} /> {FEATURE_LABELS.login.bn}
                    </Link>
                  </div>
                )}
              </section>

              <section className="mt-5 border-t border-[var(--border-color)] pt-4" aria-label="সাইট মেনু">
                <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  সাইট মেনু
                </p>

                <div className="space-y-1">
                  {visibleGroups.map((group) => {
                    const GroupIcon = group.icon;
                    const groupActive = groupIsActive(pathname, group);
                    const expanded = sidebarGroup === group.id;

                    return (
                      <div key={group.id} className="rounded-xl">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setSidebarGroup(expanded ? null : group.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors ${
                            groupActive
                              ? "bg-[var(--secondary)] text-[var(--foreground)]"
                              : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--foreground)]">
                            <GroupIcon size={16} />
                          </span>
                          <span className="min-w-0 flex-1">{group.label}</span>
                          <ChevronDown
                            size={16}
                            className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                          />
                        </button>

                        {expanded ? (
                          <div className="ml-7 mt-1 space-y-1 border-l border-[var(--border-color)] pl-3">
                            {group.items.map((item) => {
                              const ItemIcon = item.icon;
                              const itemActive = activePath(pathname, item.href);
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-colors ${
                                    itemActive
                                      ? "bg-[#006a4e] text-white"
                                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                                  }`}
                                >
                                  <ItemIcon size={16} className="shrink-0" />
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
