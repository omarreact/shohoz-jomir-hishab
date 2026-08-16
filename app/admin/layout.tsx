"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Database,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
  FileText,
  Globe,
  Sun,
  Moon,
  BarChart3,
  MapPin,
  ChevronLeft,
  ChevronRight,
  PenTool,
} from "lucide-react";
import { Button } from "@/src/shared/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, loading: authChecking, logout } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authChecking && !isLoggedIn) {
      router.push("/login");
    }
  }, [authChecking, isLoggedIn, router]);

  const userRole = user?.role ?? null;
  const userName = user?.name ?? user?.email?.split("@")[0] ?? "";

  const allNavItems = [
    {
      name: "ড্যাশবোর্ড",
      path: "/admin",
      icon: LayoutDashboard,
      roles: ["Super Admin", "Admin", "Editor"],
    },
    {
      name: "ব্লগ ম্যানেজমেন্ট",
      path: "/admin/blog",
      icon: PenTool,
      roles: ["Super Admin", "Admin", "Editor"],
    },
    {
      name: "কাস্টম পেজ",
      path: "/admin/custom-pages",
      icon: FileText,
      roles: ["Super Admin", "Admin", "Editor"],
    },
    {
      name: "ইউজার ম্যানেজমেন্ট",
      path: "/admin/users",
      icon: Users,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "রাজউক API কন্ট্রোল",
      path: "/admin/rajuk-config",
      icon: Database,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "ডেটা মনিটর",
      path: "/admin/data-monitor",
      icon: BarChart3,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "রাজউক টেস্ট",
      path: "/admin/rajuk-test",
      icon: MapPin,
      roles: ["Super Admin", "Admin"],
    },
    {
      name: "সেটিংস",
      path: "/admin/settings",
      icon: Settings,
      roles: ["Super Admin", "Admin"],
    },
  ];

  const navItems = allNavItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!isMounted || authChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006a4e]" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
              isSidebarOpen ? "w-full" : "w-0 lg:w-full lg:justify-center"
            }`}
          >
            <ShieldCheck className="h-8 w-8 text-[#006a4e] flex-shrink-0" />
            <h5
              className={`font-bold text-lg whitespace-nowrap transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "lg:hidden opacity-0"
              }`}
            >
              Smart Admin
            </h5>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path ||
              pathname.startsWith(`${item.path}/`);
            return (
              <Link
                href={item.path}
                key={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#006a4e] text-white shadow-sm font-medium"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                } ${!isSidebarOpen ? "lg:justify-center" : ""}`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span
                  className={`transition-opacity duration-300 ${
                    isSidebarOpen ? "opacity-100" : "lg:hidden opacity-0"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 space-y-2">
          <Button
            variant="outline"
            className={`w-full flex items-center justify-start gap-2 ${
              !isSidebarOpen ? "lg:justify-center px-0 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800" : ""
            }`}
            onClick={handleLogout}
          >
            <LogOut size={18} className="text-red-500" />
            <span className={!isSidebarOpen ? "lg:hidden" : "text-red-500 font-medium"}>লগআউট</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 h-screen overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Top Navbar */}
        <header className="flex-shrink-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold hidden sm:block text-slate-900 dark:text-white">
              {navItems.find(
                (n) =>
                  pathname === n.path || pathname.startsWith(`${n.path}/`)
              )?.name || "ড্যাশবোর্ড"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 rounded-full"
              >
                <Globe size={16} /> ওয়েবসাইটে যান
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-3 pl-4 ml-4 border-l border-slate-200 dark:border-slate-800">
              <div className="h-10 w-10 rounded-full bg-[#006a4e]/10 text-[#006a4e] border border-[#006a4e]/20 flex items-center justify-center font-bold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold leading-none text-slate-900 dark:text-white mb-1">
                  {userName || "Admin"}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
