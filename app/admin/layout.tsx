"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, Menu, ShieldCheck, FileText, Globe, Sun, Moon, BarChart3, PenTool, X, ChevronRight } from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

const ADMIN_ROLES = ["super admin", "admin", "editor"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, loading: authChecking, logout } = useAuth();

  useEffect(() => { setIsMounted(true); if (window.innerWidth < 1024) setIsSidebarOpen(false); }, []);
  useEffect(() => {
    if (authChecking) return;
    if (!isLoggedIn) { router.replace(`/login?from=${encodeURIComponent(pathname || "/admin")}`); return; }
    const role = (user?.role || "").trim().toLowerCase();
    if (!ADMIN_ROLES.includes(role)) router.replace("/403");
  }, [authChecking, isLoggedIn, user?.role, pathname, router]);

  const userRole = user?.role ?? null;
  const userName = user?.name ?? user?.email?.split("@")[0] ?? "";
  const allNavItems = [
    { name: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ব্লগ ম্যানেজমেন্ট", path: "/admin/blog", icon: PenTool, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "কাস্টম পেজ", path: "/admin/custom-pages", icon: FileText, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ইউজার ম্যানেজমেন্ট", path: "/admin/users", icon: Users, roles: ["Super Admin", "Admin"] },
    { name: "ডেটা মনিটর", path: "/admin/data-monitor", icon: BarChart3, roles: ["Super Admin", "Admin"] },
    { name: "সেটিংস", path: "/admin/settings", icon: Settings, roles: ["Super Admin", "Admin"] },
  ];
  const navItems = allNavItems.filter(item => userRole && item.roles.some(r => r.toLowerCase() === userRole.toLowerCase()));
  const currentTitle = navItems.find(n => pathname === n.path || pathname.startsWith(`${n.path}/`))?.name || "ড্যাশবোর্ড";
  const handleLogout = async () => { await logout(); router.replace("/login"); };

  if (!isMounted || authChecking || !isLoggedIn || !ADMIN_ROLES.includes((userRole || "").trim().toLowerCase())) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--background)]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--foreground)]" /></div>;
  }

  return <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    {isSidebarOpen && <button aria-label="সাইডবার বন্ধ করুন" className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

    <aside className={`fixed inset-y-3 left-3 z-50 flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-md transition-all duration-200 ${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-[110%] lg:w-20 lg:translate-x-0"}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-color)] px-4">
        <Link href="/admin" className={`flex items-center gap-3 no-underline ${!isSidebarOpen ? "lg:justify-center lg:w-full" : ""}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"><ShieldCheck size={18} /></span>
          <span className={`font-bold tracking-tight ${!isSidebarOpen ? "lg:hidden" : ""}`}>LandBD Admin</span>
        </Link>
        <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] lg:hidden"><X size={18} /></button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className={`px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] ${!isSidebarOpen ? "lg:hidden" : ""}`}>Workspace</div>
        {navItems.map(item => {
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return <Link href={item.path} key={item.path} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-colors ${active ? "bg-[var(--foreground)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"}`}>
            <item.icon size={18} />
            <span className={!isSidebarOpen ? "lg:hidden" : ""}>{item.name}</span>
            {active && isSidebarOpen && <ChevronRight size={15} className="ml-auto opacity-60" />}
          </Link>;
        })}
      </nav>

      <div className="border-t border-[var(--border-color)] p-3">
        <button onClick={handleLogout} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 ${!isSidebarOpen ? "lg:justify-center" : ""}`}>
          <LogOut size={18} /><span className={!isSidebarOpen ? "lg:hidden" : ""}>লগআউট</span>
        </button>
      </div>
    </aside>

    <div className={`min-h-screen transition-all duration-200 ${isSidebarOpen ? "lg:pl-[292px]" : "lg:pl-24"}`}>
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
        <div className="flex h-14 items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_90%,transparent)] px-3 shadow-sm backdrop-blur-xl sm:px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(v => !v)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"><Menu size={19} /></button>
            <div><h1 className="text-sm font-semibold sm:text-base">{currentTitle}</h1><p className="hidden text-xs text-[var(--muted-foreground)] sm:block">LandBD workspace</p></div>
          </div>
          <div className="flex items-center gap-2">
            {isMounted && <button aria-label="থিম পরিবর্তন" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] hover:bg-[var(--secondary)]">{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}</button>}
            <Link href="/" className="hidden no-underline sm:block"><Button variant="outline" size="sm"><Globe size={15} /> ওয়েবসাইট</Button></Link>
            <div className="hidden items-center gap-2 border-l border-[var(--border-color)] pl-3 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-bold">{userName.charAt(0).toUpperCase()}</div>
              <div><div className="text-xs font-semibold">{userName || "Admin"}</div><div className="text-[10px] text-[var(--muted-foreground)]">{userRole}</div></div>
            </div>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>
    </div>
  </div>;
}
