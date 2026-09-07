"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  ShieldCheck, ShieldAlert,
  FileText,
  Globe,
  Sun,
  Moon,
  BarChart3,
  PenTool,
  MapPin,
  X,
  ChevronRight,
  QrCode
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
    { name: "QR ভেরিফিকেশন", path: "/admin/qr-verification", icon: QrCode, roles: ["Super Admin", "Admin", "Editor"] },{ name: "পেইজ অ্যাক্সেস", path: "/admin/page-access", icon: ShieldAlert, roles: ["Super Admin"] },
    { name: "টেস্ট এপিআই", path: "/admin/test-api", icon: Globe, roles: ["Super Admin", "Admin"] },
    { name: "সেটিংস", path: "/admin/settings", icon: Settings, roles: ["Super Admin", "Admin"] },
  ];
  
  const navItems = allNavItems.filter(
    (item) => userRole && item.roles.some((r) => r.toLowerCase() === userRole.toLowerCase()),
  );
  
  const currentTitle =
    navItems.find((n) => pathname === n.path || pathname.startsWith(`${n.path}/`))?.name ||
    "ড্যাশবোর্ড";
    
  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!isMounted || authChecking || !isLoggedIn || !isStaffRole(userRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--foreground)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="h-6 w-6 text-[#006a4e]" />
            LandBD Admin
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              {userRole}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(`${item.path}/`));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#006a4e]/10 text-[#006a4e] dark:bg-[#006a4e]/20 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-[#006a4e] dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-400"} />
                  {item.name}
                </div>
                {isActive && <ChevronRight size={16} className="text-[#006a4e] dark:text-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> লগআউট
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006a4e] lg:hidden dark:text-slate-400 dark:hover:bg-slate-800">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006a4e] dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006a4e] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
