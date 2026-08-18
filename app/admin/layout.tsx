"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, Menu, ShieldCheck, FileText, Globe, Sun, Moon, BarChart3, ChevronLeft, PenTool } from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

const ADMIN_ROLES = ["super admin", "admin", "editor"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); const [isMounted, setIsMounted] = useState(false); const { theme, setTheme } = useTheme(); const pathname = usePathname(); const router = useRouter(); const { user, isLoggedIn, loading: authChecking, logout } = useAuth();
  useEffect(() => { setIsMounted(true); if (window.innerWidth < 1024) setIsSidebarOpen(false); }, []);
  useEffect(() => { if (authChecking) return; if (!isLoggedIn) { router.replace(`/login?from=${encodeURIComponent(pathname || "/admin")}`); return; } const role = (user?.role || "").trim().toLowerCase(); if (!ADMIN_ROLES.includes(role)) router.replace("/403"); }, [authChecking, isLoggedIn, user?.role, pathname, router]);
  const userRole = user?.role ?? null; const userName = user?.name ?? user?.email?.split("@")[0] ?? "";
  const allNavItems = [
    { name: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ব্লগ ম্যানেজমেন্ট", path: "/admin/blog", icon: PenTool, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "কাস্টম পেজ", path: "/admin/custom-pages", icon: FileText, roles: ["Super Admin", "Admin", "Editor"] },
    { name: "ইউজার ম্যানেজমেন্ট", path: "/admin/users", icon: Users, roles: ["Super Admin", "Admin"] },
    { name: "ডেটা মনিটর", path: "/admin/data-monitor", icon: BarChart3, roles: ["Super Admin", "Admin"] },
    { name: "সেটিংস", path: "/admin/settings", icon: Settings, roles: ["Super Admin", "Admin"] },
  ];
  const navItems = allNavItems.filter(item => userRole && item.roles.some(r => r.toLowerCase() === userRole.toLowerCase()));
  const handleLogout = async () => { await logout(); router.replace("/login"); };
  if (!isMounted || authChecking || !isLoggedIn || !ADMIN_ROLES.includes((userRole || "").trim().toLowerCase())) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#006a4e]" /></div>;
  return <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
    {isSidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 ${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:w-20 lg:translate-x-0"}`}>
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800"><div className={`flex items-center gap-2 overflow-hidden ${isSidebarOpen ? "w-full" : "lg:w-full lg:justify-center"}`}><ShieldCheck className="h-8 w-8 shrink-0 text-[#006a4e]" /><h5 className={`whitespace-nowrap text-lg font-bold ${isSidebarOpen ? "" : "lg:hidden"}`}>Smart Admin</h5></div><button onClick={() => setIsSidebarOpen(false)} className="lg:hidden"><ChevronLeft size={24}/></button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{navItems.map(item => { const active = pathname === item.path || pathname.startsWith(`${item.path}/`); return <Link href={item.path} key={item.path} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${active ? "bg-[#006a4e] text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}><item.icon size={20}/><span className={!isSidebarOpen ? "lg:hidden" : ""}>{item.name}</span></Link>; })}</nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800"><Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}><LogOut size={18} className="text-red-500"/><span className={!isSidebarOpen ? "lg:hidden" : "text-red-500"}>লগআউট</span></Button></div>
    </aside>
    <div className={`flex h-screen flex-1 flex-col overflow-hidden transition-all ${isSidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6"><div className="flex items-center gap-4"><button onClick={() => setIsSidebarOpen(v => !v)}><Menu size={24}/></button><h1 className="hidden text-xl font-bold sm:block">{navItems.find(n => pathname === n.path || pathname.startsWith(`${n.path}/`))?.name || "ড্যাশবোর্ড"}</h1></div><div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Sun className="dark:hidden"/><Moon className="hidden dark:block"/></Button><Link href="/"><Button variant="outline" size="sm" className="hidden gap-2 sm:flex"><Globe size={16}/> ওয়েবসাইটে যান</Button></Link><div className="hidden items-center gap-3 border-l pl-4 md:flex dark:border-slate-800"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006a4e]/10 font-bold text-[#006a4e]">{userName.charAt(0).toUpperCase()}</div><div><div className="text-sm font-semibold">{userName || "Admin"}</div><div className="text-xs text-slate-500">{userRole}</div></div></div></div></header>
      <main className="flex-1 overflow-auto bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8"><div className="mx-auto h-full max-w-7xl">{children}</div></main>
    </div>
  </div>;
}
