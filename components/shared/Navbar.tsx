"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Map,
  User,
  ShieldCheck,
  Bell,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";
import { t } from "@/src/locales";
import { useTheme } from "next-themes";

const NAV_LINKS = [
  { href: "/", label: t.nav.home },
  { href: "/dap-map", label: t.nav.mapWorkspaces },
  { href: "/khatiyan", label: t.nav.tools },
  { href: "/blog", label: t.nav.blog },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isLoggedIn: authLoggedIn, loading: authLoading, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      <header className={`sticky top-0 w-full z-[1030] transition-all duration-300 border-b border-[#1E293B] ${scrolled ? 'bg-[#0F172A]/95 backdrop-blur-md shadow-md' : 'bg-[#0F172A]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="no-underline flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg accent-bg flex items-center justify-center text-[#0F172A]">
                <Map size={18} />
              </div>
              <h5 className="font-bold text-white text-xl hidden sm:block m-0">
                LandBD <span className="accent-text">3.0</span>
              </h5>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`no-underline font-medium transition-colors duration-200 text-sm ${
                      isActive
                        ? "text-[#f6c343]"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search — desktop pill */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-300 text-sm transition-colors hover:text-white border border-slate-700 bg-slate-800/50 hover:bg-slate-800"
              >
                <Search size={14} />
                <span>{t.nav.searchShortcut.split(" ")[0]}</span>
                <span className="bg-slate-700/50 text-[10px] px-1.5 py-0.5 rounded text-slate-300">
                  Ctrl K
                </span>
              </button>

              {/* Search — mobile icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <Search size={18} />
              </button>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors border border-transparent hover:border-slate-700"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}

              {/* Auth */}
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  {/* Notification bell */}
                  <button className="relative p-2 text-slate-300 hover:text-[#f6c343] transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#0F172A]" />
                  </button>

                  {/* Account dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-white text-sm"
                    >
                      <User size={16} />
                      <span className="hidden md:block font-medium">{t.nav.account}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-700 bg-[#1E293B] shadow-2xl z-50 overflow-hidden">
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-white text-sm font-medium hover:bg-slate-700 transition-colors no-underline"
                        >
                          <ShieldCheck size={16} className="text-[#f6c343]" />
                          {t.nav.adminDashboard}
                        </Link>
                        <div className="border-t border-slate-700" />
                        <button
                          onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 text-sm font-medium hover:bg-slate-700 transition-colors"
                        >
                          <LogOut size={16} />
                          {t.nav.logout}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-[#f6c343] text-[#0F172A] text-sm font-bold hover:bg-[#d4a532] transition-colors no-underline shadow-sm"
                >
                  <LogIn size={16} />
                  {t.nav.login}
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-700"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-[#1E293B] py-4 bg-[#0F172A] animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`no-underline font-medium py-2.5 px-4 rounded-lg transition-colors text-sm ${
                        isActive
                          ? "bg-[#1E293B] text-[#f6c343]"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 justify-center mt-3 py-2.5 px-4 rounded-full bg-[#f6c343] text-[#0F172A] font-bold text-sm no-underline hover:bg-[#d4a532] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn size={16} />
                    {t.nav.login}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {isSearchOpen && (
        <SmartSearchPalette
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={handleSelectResult}
        />
      )}
    </>
  );
}
