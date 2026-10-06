"use client";

import React, { useEffect, useState } from "react";
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
  Menu,
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [adminSearchOpen, setAdminSearchOpen] = useState(false);
  const [adminQuery, setAdminQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, loading: authChecking, logout } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (authChecking) return;
    if (!isLoggedIn) {
      router.replace(`/login?from=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (user?.role && !isStaffRole(user.role)) {
      router.replace("/403");
    }
  }, [authChecking, isLoggedIn, pathname, router, user?.role]);

  const userRole = user?.role ?? null;
  const userName = user?.name ?? user?.email?.split("@")[0] ?? "";

  const allNavItems = [
    { name: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ব্লগ ম্যানেজমেন্ট", path: "/admin/blog", icon: PenTool, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "কাস্টম পেজ", path: "/admin/custom-pages", icon: FileText, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ইউজার ম্যানেজমেন্ট", path: "/admin/users", icon: Users, roles: ["Super Admin", "Admin"] },
    { name: "ডেটা মনিটর", path: "/admin/data-monitor", icon: BarChart3, roles: ["Super Admin", "Admin"] },
    { name: "মানচিত্র ভিজিটর", path: "/admin/map-visits", icon: MapPin, roles: ["Super Admin", "Admin"] },
    { name: "QR ভেরিফিকেশন", path: "/admin/qr-verification", icon: QrCode, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "পেইজ অ্যাক্সেস", path: "/admin/page-access", icon: ShieldAlert, roles: ["Super Admin"] },
    { name: "অডিট লগ", path: "/admin/audit-log", icon: History, roles: ["Super Admin"] },
    { name: "টেস্ট এপিআই", path: "/admin/test-api", icon: Globe, roles: ["Super Admin", "Admin"] },
    { name: "সেটিংস", path: "/admin/settings", icon: Settings, roles: ["Super Admin", "Admin"] },
  ];

  const navItems = allNavItems.filter(
    (item) => userRole && item.roles.includes(userRole),
  );

  const currentTitle =
    navItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))?.name ||
    "ড্যাশবোর্ড";

  const adminSearchResults = navItems.filter((item) =>
    !adminQuery.trim() || `${item.name} ${item.path}`.toLowerCase().includes(adminQuery.trim().toLowerCase()),
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!isMounted || authChecking || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[var(--brand-gold-soft)] border-t-[var(--brand-gold)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-[var(--border-color)] bg-[var(--card-bg)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full"
        }`}
      >
        <div className="flex h-18 items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <Link href="/admin" className="flex items-center gap-3 no-underline">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--brand-gold)] text-[var(--primary-foreground)] shadow-sm">
              <ShieldCheck size={21} />
            </span>
            <span>
              <strong className="block text-base leading-tight text-[var(--foreground)]">LandBD Admin</strong>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Control Center</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-color)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] lg:hidden"
            aria-label="সাইডবার বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-[14px] border border-[color-mix(in_srgb,var(--brand-gold)_18%,var(--border-color))] bg-[var(--brand-gold-faint)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-gold)] text-sm font-extrabold text-[var(--primary-foreground)]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[var(--foreground)]">{userName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          ম্যানেজমেন্ট
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(`${item.path}/`));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center justify-between rounded-[12px] px-3 py-2.5 text-sm font-semibold no-underline transition-all ${
                  isActive
                    ? "bg-[var(--brand-gold-soft)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-[var(--brand-gold)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 truncate">{item.name}</span>
                  {item.path === "/admin/test-api" ? (
                    <span className="rounded-md border border-[var(--border-color)] bg-[var(--canvas)] px-1.5 py-0.5 text-[9px] font-black tracking-[.08em] text-[var(--muted-foreground)]">
                      INTERNAL
                    </span>
                  ) : null}
                </div>
                {isActive && <ChevronRight size={15} className="text-[var(--brand-gold-text)]" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-color)] p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> লগআউট
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-18 shrink-0 items-center justify-between border-b border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_96%,transparent)] px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[var(--border-color)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] lg:hidden"
              aria-label="সাইডবার খুলুন"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--brand-gold-text)]">
                LandBD Admin
              </p>
              <h1 className="truncate text-lg font-extrabold text-[var(--foreground)]">{currentTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setAdminSearchOpen(true)}
              className="flex h-10 items-center gap-2 rounded-[12px] border border-[var(--border-color)] bg-white px-3 text-xs font-bold text-[var(--muted-foreground)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--brand-green-faint)] hover:text-[var(--foreground)]"
              aria-label="অ্যাডমিন মেনু সার্চ করুন"
            >
              <Search size={16} />
              <span className="hidden md:inline">সার্চ</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="hidden h-10 items-center gap-2 rounded-[12px] border border-[var(--border-color)] bg-white px-3 text-xs font-bold text-[var(--muted-foreground)] no-underline shadow-[var(--shadow-xs)] transition hover:bg-[var(--brand-green-faint)] hover:text-[var(--foreground)] sm:flex"
            >
              <Globe size={16} />
              লাইভ সাইট
            </Link>
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-bold text-[var(--foreground)]">{userName}</p>
              <p className="text-[11px] text-[var(--muted-foreground)]">{userRole}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-gold)] font-extrabold text-[var(--primary-foreground)] shadow-sm ring-2 ring-[var(--card-bg)]">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--background)]">
          {children}
        </main>
      </div>

      {adminSearchOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 p-4 pt-20 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="অ্যাডমিন সার্চ"
          onMouseDown={() => setAdminSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[14px] border border-[var(--border-color)] bg-white shadow-[var(--shadow-lg)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4">
              <Search size={18} className="text-[var(--survey-teal)]" />
              <input
                autoFocus
                value={adminQuery}
                onChange={(event) => setAdminQuery(event.target.value)}
                placeholder="ইউজার, ডেটা, সেটিংস বা টুল খুঁজুন…"
                className="h-14 flex-1 bg-transparent text-sm font-semibold text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="button"
                onClick={() => setAdminSearchOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-color)] text-[var(--muted-foreground)]"
                aria-label="সার্চ বন্ধ করুন"
              >
                <X size={17} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {adminSearchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setAdminSearchOpen(false)}
                    className="flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm font-bold text-[var(--foreground)] no-underline transition hover:bg-[var(--brand-green-faint)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--canvas)] text-[var(--primary)]">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {item.path === "/admin/test-api" ? <span className="landbd-status-chip">INTERNAL</span> : null}
                  </Link>
                );
              })}
              {!adminSearchResults.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">কোনো মডিউল পাওয়া যায়নি</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
