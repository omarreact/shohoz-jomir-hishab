"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Calculator, ChevronDown, FileSearch, FileText, Home, LogIn, LogOut,
  Map, Menu, Ruler, Search, ShieldCheck, UserRound, Users, X, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole, isStaffRole } from "@/src/modules/auth/roles";
import { NAV_SECTIONS, isFeatureRouteActive } from "@/src/shared/config/navigation";
import { buildLoginHref } from "@/src/modules/auth/loginRedirect";
import { FEATURE_LABELS, FEATURE_ROUTES, type FeatureRouteKey } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type NavLink = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavLink[] };

const ICONS: Partial<Record<FeatureRouteKey, LucideIcon>> = {
  home: Home, records: FileSearch, dlrmsKhatian: Search, settlementKhatian: FileText,
  mouzaPorchaReport: FileText, landMeasurement: Ruler, inheritance: Users,
  landMap: Map, mouzaDownload: Map, mapQa: Map, documents: FileText,
  warish: Users, warishSanad: FileText, history: BookOpen, blog: BookOpen,
  faq: BookOpen, contact: Users, privacy: ShieldCheck, terms: FileText,
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  records: FileSearch, calculations: Calculator, maps: Map, documents: FileText, guides: BookOpen,
};

const STATIC_GROUPS: NavGroup[] = NAV_SECTIONS.map((section) => ({
  id: section.id, label: section.label, icon: GROUP_ICONS[section.id] ?? FileText,
  items: section.keys.map((key) => ({
    href: FEATURE_ROUTES[key], label: FEATURE_LABELS[key].bn,
    icon: ICONS[key] ?? FileText, adminOnly: key === "mapQa",
  })),
}));

const surface =
  "border border-slate-200 bg-white/95 shadow-[0_12px_36px_rgba(16,45,34,.1)] backdrop-blur-xl";
const action =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold " +
  "text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

function active(path: string, href: string) {
  return isFeatureRouteActive(path, href);
}

export default function Navbar() {
  const pathname = usePathname() || "/";
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth();
  const isAdmin = isLoggedIn && isAdminRole(user?.role);
  const canSeeAdmin = isLoggedIn && isStaffRole(user?.role);

  const [cmsGroups, setCmsGroups] = useState<NavGroup[]>([]);
  const [openDesktop, setOpenDesktop] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/public/navigation", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { sections: [] })
      .then((payload: { sections?: Array<{ title: string; links: Array<{ href: string; label: string }> }> }) => {
        if (!mounted) return;
        setCmsGroups((payload.sections ?? []).map((section, index) => ({
          id: "cms-" + index,
          label: section.title,
          icon: FileText,
          items: (section.links ?? [])
            .filter((link) => link.href.startsWith("/") && !link.href.startsWith("//"))
            .map((link) => ({ href: link.href, label: link.label, icon: FileText })),
        })).filter((group) => group.items.length > 0));
      }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const groups = useMemo(
    () => [...STATIC_GROUPS, ...(cmsGroups.length ? [{
      id: "cms-more", label: "আরও", icon: FileText,
      items: cmsGroups.flatMap((group) => group.items.map((item) => ({
        ...item, label: group.label + " · " + item.label,
      }))),
    }] : [])]
      .map((group) => ({ ...group, items: group.items.filter((item) => !item.adminOnly || isAdmin) }))
      .filter((group) => group.items.length > 0),
    [cmsGroups, isAdmin],
  );

  const searchLinks = useMemo(() => [
    { href: "/", label: "হোম", icon: Home },
    ...groups.flatMap((group) => group.items),
    ...(canSeeAdmin ? [{ href: FEATURE_ROUTES.admin, label: "অ্যাডমিন ড্যাশবোর্ড", icon: ShieldCheck }] : []),
  ], [groups, canSeeAdmin]);
  const matches = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("bn-BD");
    return searchLinks.filter((item) => !q ||
      (item.label + " " + item.href).toLocaleLowerCase("bn-BD").includes(q));
  }, [searchQuery, searchLinks]);

  useEffect(() => {
    setOpenDesktop(null);
    setMobileOpen(false);
    setMobileGroup(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setMobileOpen(false);
        setOpenDesktop(null);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setOpenDesktop(null);
      }
    };
    const onOutside = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenDesktop(null);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, []);

  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  async function signOut() {
    await logout();
    window.location.assign("/");
  }

  function closeMobileMenu() { setMobileOpen(false); setMobileGroup(null); }
  const menuLink = (item: NavLink, compact = false) => {
    const Icon = item.icon;
    const isCurrent = active(pathname, item.href);
    return (
      <Link
        key={item.href + (compact ? "-mobile" : "-desktop")}
        href={item.href}
        aria-current={isCurrent ? "page" : undefined}
        onClick={() => { setOpenDesktop(null); closeMobileMenu(); }}
        className={[
          "flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-colors",
          isCurrent ? "bg-emerald-50 text-emerald-800" :
            "text-slate-700 hover:bg-slate-50 hover:text-emerald-800",
        ].join(" ")}
      >
        <Icon size={17} className="shrink-0" />
        <span className="min-w-0 flex-1">{item.label}</span>
        {isCurrent && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />}
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-[1100] w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-[68px] w-full max-w-[1500px] items-center gap-3 px-3 sm:px-6">
          <Link href="/" aria-label={SITE_CONFIG.name + " — হোম"}
            className="flex min-w-0 shrink-0 items-center gap-2.5 no-underline">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-800 text-white shadow-sm">
              <Calculator size={21} />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-[18px] font-extrabold tracking-tight text-slate-950">
                {SITE_CONFIG.name}
              </strong>
              <span className="block truncate text-[10px] font-medium leading-4 text-slate-500">
                {SITE_CONFIG.shortName}
              </span>
            </span>
          </Link>

          <div ref={navRef} className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
            <Link href="/" aria-current={pathname === "/" ? "page" : undefined}
              className={action + (pathname === "/" ? " bg-emerald-50 text-emerald-800" : "")}>
              <Home size={16} /> হোম
            </Link>
            {groups.map((group) => {
              const GroupIcon = group.icon;
              const activeGroup = group.items.some((item) => active(pathname, item.href));
              const isOpen = openDesktop === group.id;
              return (
                <div key={group.id} className="relative"
                  onMouseEnter={() => setOpenDesktop(group.id)}
                  onMouseLeave={() => setOpenDesktop(null)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenDesktop(null);
                  }}>
                  <button type="button" aria-expanded={isOpen} aria-haspopup="true"
                    onClick={() => setOpenDesktop(isOpen ? null : group.id)}
                    className={action + (activeGroup ? " bg-emerald-50 text-emerald-800" : "")}>
                    <GroupIcon size={16} />
                    {group.label}
                    <ChevronDown size={14} className={"transition-transform " + (isOpen ? "rotate-180" : "")} />
                  </button>
                  {isOpen && (
                    <div className="absolute left-1/2 top-full z-[1200] w-[270px] -translate-x-1/2 pt-2">
                      <div className={surface + " rounded-2xl p-2"}>
                        <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          {group.label}
                        </p>
                        {group.items.map((item) => menuLink(item))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => { setSearchOpen(true); closeMobileMenu(); }}
              className={action + " border border-slate-200"} aria-label="সাইট সার্চ করুন"
              title="সার্চ · Ctrl+K">
              <Search size={18} /><span className="hidden xl:inline">সার্চ</span>
            </button>
            {canSeeAdmin ? (
              <Link href={FEATURE_ROUTES.admin} className={action + " hidden border border-slate-200 sm:inline-flex"}>
                <ShieldCheck size={16} /><span className="hidden xl:inline">ড্যাশবোর্ড</span>
              </Link>
            ) : null}
            {!authLoading && (
              isLoggedIn ? (
                <div className="group relative hidden lg:block">
                  <Link href="/my-purchases" className={action + " border border-slate-200"} aria-label="অ্যাকাউন্ট">
                    <UserRound size={18} /> অ্যাকাউন্ট
                  </Link>
                  <div className="invisible absolute right-0 top-full z-[1200] w-56 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <div className={surface + " rounded-2xl p-2"}>
                      <Link href="/my-purchases" className={action + " w-full justify-start"}>আমার অ্যাকাউন্ট</Link>
                      <button type="button" className={action + " w-full justify-start"} onClick={() => void signOut()}>
                        <LogOut size={16} /> লগআউট
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href={buildLoginHref(pathname)} className={action + " hidden border border-emerald-200 text-emerald-800 lg:inline-flex"}>
                  <LogIn size={16} /> লগইন
                </Link>
              )
            )}
            <button type="button"
              aria-expanded={mobileOpen} aria-controls="landbd-mobile-header-menu"
              aria-label={mobileOpen ? "মেনু বন্ধ করুন" : "হেডার মেনু খুলুন"}
              onClick={() => { setMobileOpen((value) => !value); setOpenDesktop(null); }}
              className={action + " border border-slate-200 lg:hidden"}>
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {/* Full-width header dropdown, not an off-canvas drawer/sidebar. */}
        {mobileOpen && (
          <div id="landbd-mobile-header-menu"
            className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-slate-100 bg-white px-3 pb-4 shadow-xl sm:px-6 lg:hidden">
            <nav className="mx-auto max-w-screen-sm space-y-1 pt-3" aria-label="মোবাইল হেডার নেভিগেশন">
              {menuLink({ href: "/", label: "হোম", icon: Home }, true)}
              {groups.map((group) => {
                const Icon = group.icon;
                const expanded = mobileGroup === group.id;
                const current = group.items.some((item) => active(pathname, item.href));
                return (
                  <div key={group.id} className="rounded-xl">
                    <button type="button" aria-expanded={expanded}
                      onClick={() => setMobileGroup(expanded ? null : group.id)}
                      className={"flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold " +
                        (current ? "bg-emerald-50 text-emerald-800" : "text-slate-800 hover:bg-slate-50")}>
                      <Icon size={18} /><span className="flex-1">{group.label}</span>
                      <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
                    </button>
                    {expanded && (
                      <div className="ml-4 space-y-0.5 border-l-2 border-emerald-100 pl-2">
                        {group.items.map((item) => menuLink(item, true))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                {isLoggedIn ? (
                  <>
                    <Link className={action + " w-full justify-start"} href="/my-purchases" onClick={closeMobileMenu}>
                      <UserRound size={17} /> আমার অ্যাকাউন্ট
                    </Link>
                    {canSeeAdmin && <Link className={action + " w-full justify-start"} href={FEATURE_ROUTES.admin} onClick={closeMobileMenu}>
                      <ShieldCheck size={17} /> ড্যাশবোর্ড
                    </Link>}
                    <button type="button" onClick={() => void signOut()} className={action + " w-full justify-start"}>
                      <LogOut size={17} /> লগআউট
                    </button>
                  </>
                ) : !authLoading ? (
                  <Link className={action + " w-full justify-start border border-emerald-100 text-emerald-800"}
                    href={buildLoginHref(pathname)} onClick={closeMobileMenu}>
                    <LogIn size={17} /> লগইন
                  </Link>
                ) : null}
              </div>
            </nav>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[1300] flex items-start justify-center bg-slate-950/50 px-3 pt-[10dvh] backdrop-blur-sm print:hidden"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="সাইট সার্চ"
            className={surface + " w-full max-w-xl overflow-hidden rounded-2xl"}>
            <div className="flex items-center gap-3 border-b border-slate-200 px-4">
              <Search size={20} className="text-emerald-700" />
              <input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
                placeholder="খতিয়ান, ম্যাপ, রিপোর্ট বা সেবা খুঁজুন…" />
              <button type="button" className={action} onClick={() => setSearchOpen(false)} aria-label="সার্চ বন্ধ">
                <X size={19}/>
              </button>
            </div>
            <div className="max-h-[60dvh] space-y-1 overflow-y-auto p-2">
              {matches.map((item) => menuLink(item))}
              {!matches.length && <p className="p-6 text-center text-sm text-slate-500">কোনো পেজ পাওয়া যায়নি।</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
