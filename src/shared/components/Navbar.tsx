"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  Ruler,
  Users,
  Home,
  BookOpen,
  LogOut,
  LogIn,
  Menu,
  MoonStar,
  MapPin,
  Map,
  FileText,
  Search,
  User,
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";
import { t } from "@/src/locales";
import { useTheme } from "next-themes";

const NAV_LINKS = [
  { href: "/", label: "হোম", Icon: Home },
  { href: "/khatiyan", label: "খতিয়ান", Icon: Calculator },
  { href: "/land-measurement", label: "জমি মাপ", Icon: Ruler },
];

function DesktopNavItem({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  
  return (
    <li className="list-none mx-1">
      <Link
        href={href}
        className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap transition-all no-underline ${
          isActive 
            ? "bg-[#006a4e]/10 text-[#006a4e] font-bold" 
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <Icon size={18} className={`mr-2 shrink-0 ${isActive ? "text-[#006a4e]" : ""}`} />
        {label}
      </Link>
    </li>
  );
}

function BottomNavItem({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`no-underline flex flex-col items-center p-2 transition-all ${
        isActive ? "text-[#006a4e]" : "text-slate-500 dark:text-slate-400"
      }`}
    >
      <div className={`p-1.5 rounded-full transition-all ${isActive ? "bg-[#006a4e]/10" : ""}`}>
        <Icon size={22} className={isActive ? "text-[#006a4e]" : ""} />
      </div>
      <span className={`text-[11px] mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}

function OffcanvasNavItem({
  href,
  label,
  Icon,
  onClick
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <li className="list-none mb-2">
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center px-4 py-3 rounded-xl transition-all no-underline ${
          isActive 
            ? "bg-[#006a4e]/10 text-[#006a4e] font-bold" 
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
      >
        <Icon size={20} className={`mr-3 ${isActive ? "text-[#006a4e]" : ""}`} />
        {label}
      </Link>
    </li>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isLoggedIn: authLoggedIn, loading: authLoading, logout } = useAuth();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading) setIsLoggedIn(authLoggedIn);
  }, [authLoggedIn, authLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleSelectResult = (result: any) => {
    window.dispatchEvent(new CustomEvent("smart-search-result", { detail: result }));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          body { padding-bottom: 75px !important; }
        }
      `}} />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-[1030] border-b border-slate-200 dark:border-[#23332d] py-2 lg:py-3 bg-white/80 dark:bg-[#131c19]/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand */}
          <Link href="/" className="no-underline flex items-center shrink-0">
            <div className="bg-[#006a4e] text-white rounded-full p-2 mr-3 flex items-center justify-center shadow-sm w-[38px] h-[38px]">
              <Calculator size={20} />
            </div>
            <h4 className="font-bold text-xl m-0 hidden sm:block text-slate-800 dark:text-white">
              সহজ <span className="text-[#006a4e]">জমির হিসাব</span>
            </h4>
            <h5 className="font-bold text-lg m-0 sm:hidden text-[#006a4e] mt-1">
              সহজ জমির হিসাব
            </h5>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-end w-full gap-4">
            <ul className="flex items-center m-0 p-0 mx-auto">
              {NAV_LINKS.map(link => (
                <DesktopNavItem key={link.href} href={link.href} label={link.label} Icon={link.Icon} />
              ))}
            </ul>
            
            <div className="flex items-center gap-3">
              <button
                aria-label="Search"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Search size={18} />
              </button>
              
              {isLoggedIn ? (
                <>
                  <Link
                    href="/admin"
                    className="bg-[#006a4e] text-white rounded-full px-5 py-2 font-bold text-sm hover:bg-[#005a42] transition-colors no-underline shadow-sm"
                  >
                    ড্যাশবোর্ড
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="border border-[#f42a41] text-[#f42a41] rounded-full px-4 py-2 text-sm font-bold flex items-center hover:bg-[#f42a41] hover:text-white transition-colors cursor-pointer"
                  >
                    <LogOut size={16} className="mr-2" /> লগআউট
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="border border-[#006a4e] text-[#006a4e] rounded-full px-5 py-2 text-sm font-bold flex items-center hover:bg-[#006a4e] hover:text-white transition-colors no-underline"
                >
                  <LogIn size={16} className="mr-2" /> লগিন
                </Link>
              )}

              <button
                aria-label="Open mobile menu"
                className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm cursor-pointer"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[1040] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131c19] flex justify-around items-center pb-2 pt-1 px-2">
        {NAV_LINKS.map(link => (
          <BottomNavItem key={link.href} href={link.href} label={link.label} Icon={link.Icon} />
        ))}
        {isLoggedIn && <BottomNavItem href="/porcha" label="পর্চা" Icon={FileText} />}
        
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400 bg-transparent border-none cursor-pointer"
        >
          <div className="p-1">
            <Menu size={22} />
          </div>
          <span className="text-[11px] mt-0.5 font-medium">মেনু</span>
        </button>
      </div>

      {/* Offcanvas Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1050]" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-[#131c19] z-[1060] shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-[#006a4e] text-white rounded-full p-2 mr-3 flex items-center justify-center shadow-sm w-[32px] h-[32px]">
                  <Calculator size={16} />
                </div>
                <h5 className="font-bold text-[#006a4e] m-0 text-lg">
                  সহজ জমির হিসাব
                </h5>
              </div>
              <button aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <h6 className="text-slate-400 font-bold text-xs mb-3">প্রধান মেনু</h6>
              <ul className="m-0 p-0 mb-6">
                {NAV_LINKS.map(link => (
                  <OffcanvasNavItem key={link.href} href={link.href} label={link.label} Icon={link.Icon} onClick={() => setIsMobileMenuOpen(false)} />
                ))}
                {isLoggedIn && <OffcanvasNavItem href="/porcha" label="পর্চা" Icon={FileText} onClick={() => setIsMobileMenuOpen(false)} />}
              </ul>

              <h6 className="text-slate-400 font-bold text-xs mb-3">অন্যান্য সেবা</h6>
              <ul className="m-0 p-0 mb-auto">
                <OffcanvasNavItem href="/faraez" label="ফারায়েজ" Icon={Users} onClick={() => setIsMobileMenuOpen(false)} />
                <OffcanvasNavItem href="/rajuk-test" label="রাজউক ম্যাপ" Icon={MapPin} onClick={() => setIsMobileMenuOpen(false)} />
                <OffcanvasNavItem href="/dap-map" label="ফুল ড্যাপ ম্যাপ" Icon={Map} onClick={() => setIsMobileMenuOpen(false)} />
                <OffcanvasNavItem href="/blog" label="ব্লগ" Icon={BookOpen} onClick={() => setIsMobileMenuOpen(false)} />
              </ul>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                {mounted && (
                  <div className="flex items-center justify-between p-4 mb-4 rounded-2xl bg-[#006a4e]/10 border border-[#006a4e]/20">
                    <span className="font-bold text-[#006a4e] text-sm flex items-center">
                      <MoonStar size={16} className="mr-2" /> থিম পরিবর্তন
                    </span>
                    <button
                      aria-label="Toggle theme"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="w-8 h-8 rounded-full bg-white dark:bg-[#131c19] text-[#006a4e] flex items-center justify-center shadow-sm cursor-pointer border-none"
                    >
                      {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                  </div>
                )}

                {isLoggedIn ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-[#006a4e] text-white w-full rounded-full flex items-center justify-center py-3 font-bold no-underline"
                    >
                      ড্যাশবোর্ড
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="border border-[#f42a41] text-[#f42a41] w-full rounded-full flex items-center justify-center py-3 font-bold bg-transparent cursor-pointer"
                    >
                      <LogOut size={18} className="mr-2" /> লগআউট করুন
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-[#006a4e] text-white w-full rounded-full flex items-center justify-center py-3 font-bold shadow-sm no-underline"
                  >
                    <LogIn size={18} className="mr-2" /> অ্যাডমিন লগিন
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {isSearchOpen && (
        <SmartSearchPalette
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={handleSelectResult}
        />
      )}
    </>
  );
}
