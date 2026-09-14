"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Moon,
  PenTool,
  QrCode,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
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
    if (!isStaffRole(user?.role)) {
      router.replace("/403");
    }
  }, [authChecking, isLoggedIn, user?.role, pathname, router]);

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
    { name: "টেস্ট এপিআই", path: "/admin/test-api", icon: Globe, roles: ["Super Admin", "Admin"] },
    { name: "সেটিংস", path: "/admin/settings", icon: Settings, roles: ["Super Admin", "Admin"] },
  ];

  const navItems = allNavItems.filter(
    (item) => userRole && item.roles.some((role) => role.toLowerCase() === userRole.toLowerCase()),
  );

  const currentTitle =
    navItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))?.name ||
    "ড্যাশবোর্ড";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!isMounted || authChecking || !isLoggedIn || !isStaffRole(userRole)) {
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
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-gold)] text-[var(--primary-foreground)] shadow-sm">
              <ShieldCheck size={21} />
            </span>
            <span>
              <strong className="block text-base leading-tight text-[var(--foreground)]">LandBD Admin</strong>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">Control Center</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] lg:hidden"
            aria-label="সাইডবার বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--brand-gold)_18%,var(--border-color))] bg-[var(--brand-gold-faint)] p-4">
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
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-all ${
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
                  {item.name}
                </div>
                {isActive && <ChevronRight size={15} className="text-[#9a6700] dark:text-[#f7d36f]" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-color)] p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] lg:hidden"
              aria-label="সাইডবার খুলুন"
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9a6700] dark:text-[#f7d36f]">
                LandBD Admin
              </p>
              <h1 className="truncate text-lg font-extrabold text-[var(--foreground)]">{currentTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              aria-label="থিম পরিবর্তন"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
