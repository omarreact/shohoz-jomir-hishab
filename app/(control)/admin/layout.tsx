"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  FileText,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  PenTool,
  QrCode,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";
import { getAdminNavigationRoles } from "@/src/shared/routing/route-registry";

type NavItem = {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  roles: string[];
};

const ALL_NAV_ITEMS: NavItem[] = [
  { name: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard, roles: [...getAdminNavigationRoles("/admin")] },
  { name: "ব্লগ ম্যানেজমেন্ট", path: "/admin/blog", icon: PenTool, roles: [...getAdminNavigationRoles("/admin/blog")] },
  { name: "কাস্টম পেজ", path: "/admin/custom-pages", icon: FileText, roles: [...getAdminNavigationRoles("/admin/custom-pages")] },
  { name: "ইউজার ম্যানেজমেন্ট", path: "/admin/users", icon: Users, roles: [...getAdminNavigationRoles("/admin/users")] },
  { name: "অপারেশন ও স্বাস্থ্য", path: "/admin/operations", icon: BarChart3, roles: [...getAdminNavigationRoles("/admin/operations")] },
  { name: "ডেটা মনিটর", path: "/admin/data-monitor", icon: BarChart3, roles: [...getAdminNavigationRoles("/admin/data-monitor")] },
  { name: "মানচিত্র ভিজিটর", path: "/admin/map-visits", icon: MapPin, roles: [...getAdminNavigationRoles("/admin/map-visits")] },
  { name: "QR ভেরিফিকেশন", path: "/admin/qr-verification", icon: QrCode, roles: [...getAdminNavigationRoles("/admin/qr-verification")] },
  { name: "পেইজ অ্যাক্সেস", path: "/admin/page-access", icon: ShieldAlert, roles: [...getAdminNavigationRoles("/admin/page-access")] },
  { name: "অডিট লগ", path: "/admin/audit-log", icon: History, roles: [...getAdminNavigationRoles("/admin/audit-log")] },
  { name: "জাতীয় পরিচয়পত্র যাচাই", path: "/admin/nid-verification", icon: ShieldCheck, roles: [...getAdminNavigationRoles("/admin/nid-verification")] },
  { name: "টেস্ট এপিআই", path: "/admin/test-api", icon: Globe, roles: [...getAdminNavigationRoles("/admin/test-api")] },
  { name: "কনটেন্ট CMS", path: "/admin/cms", icon: FileText, roles: [...getAdminNavigationRoles("/admin/cms")] },
  { name: "বিক্রয় ও অর্ডার", path: "/admin/orders", icon: BarChart3, roles: [...getAdminNavigationRoles("/admin/orders")] },
  { name: "সেবা ও মূল্য", path: "/admin/services", icon: BarChart3, roles: [...getAdminNavigationRoles("/admin/services")] },
  { name: "পেমেন্ট গেটওয়ে", path: "/admin/settings/payment", icon: Settings, roles: [...getAdminNavigationRoles("/admin/settings/payment")] },
  { name: "AI সহায়ক", path: "/admin/ai-assistant", icon: Globe, roles: [...getAdminNavigationRoles("/admin/ai-assistant")] },
  { name: "নিরাপত্তা", path: "/admin/security", icon: ShieldAlert, roles: [...getAdminNavigationRoles("/admin/security")] },
  { name: "সেটিংস", path: "/admin/settings", icon: Settings, roles: [...getAdminNavigationRoles("/admin/settings")] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [showAllModules, setShowAllModules] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [adminQuery, setAdminQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, loading: authChecking, logout } = useAuth();

  useEffect(() => {
    if (authChecking) return;
    if (!isLoggedIn) {
      router.replace("/login?from=" + encodeURIComponent(pathname || "/admin"));
      return;
    }
    if (user?.role && !isStaffRole(user.role)) {
      router.replace("/403");
    }
  }, [authChecking, isLoggedIn, pathname, router, user?.role]);

  const userRole = user?.role ?? null;
  const userName = user?.name ?? user?.email?.split("@")[0] ?? "";
  const navItems = useMemo(() => {
    if (!userRole) return [];
    return ALL_NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const isCurrent = (path: string) =>
    pathname === path || (path !== "/admin" && pathname.startsWith(path + "/"));

  const currentTitle =
    [...navItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => isCurrent(item.path))?.name ?? "ড্যাশবোর্ড";

  const query = adminQuery.trim().toLowerCase();
  const visibleItems = navItems.filter((item) =>
    !query || (item.name + " " + item.path).toLowerCase().includes(query),
  );

  function closeInlineNavigation() {
    setShowAllModules(false);
    setSearchVisible(false);
    setAdminQuery("");
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (authChecking || !isLoggedIn || (userRole && !isStaffRole(userRole))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[var(--brand-gold-soft)] border-t-[var(--brand-gold)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border-color)] bg-[var(--card-bg)] px-3 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin"
            onClick={closeInlineNavigation}
            aria-label="LandBD Admin ড্যাশবোর্ড"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold)] text-[var(--primary-foreground)] no-underline"
          >
            <ShieldCheck size={21} />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--brand-gold-text)]">
              LandBD Admin
            </p>
            <p className="truncate text-base font-extrabold sm:text-lg">
              {currentTitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchVisible((open) => !open);
              setAdminQuery("");
            }}
            aria-label={searchVisible ? "মডিউল সার্চ বন্ধ করুন" : "অ্যাডমিন মডিউল খুঁজুন"}
            aria-controls="admin-inline-search"
            aria-expanded={searchVisible}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
          >
            {searchVisible ? <X size={18} /> : <Search size={18} />}
          </button>
          <Link
            href="/"
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 text-xs font-bold text-[var(--muted-foreground)] no-underline hover:bg-[var(--muted)] sm:inline-flex"
          >
            <Globe size={17} /> লাইভ সাইট
          </Link>
          <span
            className="hidden max-w-40 truncate text-xs font-semibold text-[var(--muted-foreground)] md:inline"
            title={userName}
          >
            {userName}
          </span>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold)] text-sm font-extrabold text-[var(--primary-foreground)]"
            aria-label={userName}
          >
            {userName.charAt(0).toUpperCase()}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            className="h-10 min-w-10 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            aria-label="লগআউট"
            title="লগআউট"
          >
            <LogOut size={18} />
            <span className="hidden xl:inline">লগআউট</span>
          </Button>
        </div>
      </header>

      <section
        className="min-w-0 border-b border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-3 sm:px-6"
        aria-label="অ্যাডমিন পেজ নেভিগেশন"
      >
        <div className="flex min-w-0 items-center gap-2">
          <nav
            aria-label="অ্যাডমিন ট্যাব"
            className="flex min-w-0 flex-1 snap-x snap-mandatory items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]"
          >
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const selected = isCurrent(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeInlineNavigation}
                  aria-current={selected ? "page" : undefined}
                  className={[
                    "inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold no-underline transition-colors sm:text-sm",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]",
                    selected
                      ? "border-[var(--brand-gold)] bg-[var(--brand-gold-soft)] text-[var(--foreground)]"
                      : "border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  ].join(" ")}
                >
                  <Icon size={17} className="shrink-0" />
                  {item.name}
                </Link>
              );
            })}
            {!visibleItems.length && (
              <span className="py-3 text-sm text-[var(--muted-foreground)]">
                কোনো মডিউল পাওয়া যায়নি
              </span>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setShowAllModules((open) => !open)}
            aria-expanded={showAllModules}
            aria-controls="admin-module-grid"
            className={[
              "inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border px-3 text-xs font-extrabold sm:text-sm",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]",
              showAllModules
                ? "border-[var(--brand-gold)] bg-[var(--brand-gold-soft)]"
                : "border-[var(--border-color)] hover:bg-[var(--muted)]",
            ].join(" ")}
          >
            {showAllModules ? <X size={17} /> : <LayoutDashboard size={17} />}
            <span>{showAllModules ? "বন্ধ" : "সব মডিউল"}</span>
          </button>
        </div>

        {searchVisible && (
          <div id="admin-inline-search" className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3">
            <Search size={18} className="shrink-0 text-[var(--muted-foreground)]" />
            <label htmlFor="admin-module-query" className="sr-only">অ্যাডমিন মডিউল খুঁজুন</label>
            <input
              id="admin-module-query"
              type="search"
              autoComplete="off"
              value={adminQuery}
              onChange={(event) => setAdminQuery(event.target.value)}
              placeholder="ইউজার, ব্লগ, সেটিংস বা অন্য মডিউল খুঁজুন"
              className="h-12 min-w-0 w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        )}

        {showAllModules && (
          <nav
            id="admin-module-grid"
            aria-label="সব অ্যাডমিন মডিউল"
            className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--border-color)] pt-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          >
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const selected = isCurrent(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeInlineNavigation}
                  aria-current={selected ? "page" : undefined}
                  className={[
                    "flex min-h-14 min-w-0 items-center gap-2 rounded-xl border p-3 text-xs font-bold no-underline sm:text-sm",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]",
                    selected
                      ? "border-[var(--brand-gold)] bg-[var(--brand-gold-soft)] text-[var(--foreground)]"
                      : "border-[var(--border-color)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                  ].join(" ")}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="min-w-0 break-words">{item.name}</span>
                  {selected && <ChevronRight size={15} className="ml-auto shrink-0" />}
                </Link>
              );
            })}
          </nav>
        )}
      </section>

      <main id="admin-content" className="min-w-0 w-full flex-1 bg-[var(--background)] p-3 sm:p-6">
        {children}
      </main>
    </div>
  );
}
