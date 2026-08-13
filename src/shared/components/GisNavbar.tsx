"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Map,
  LogIn,
  User,
  ShieldCheck,
  LogOut,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";
import { t } from "@/src/locales";

export default function GisNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn: authLoggedIn, loading: authLoading, logout } = useAuth();

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

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (result: any) => {
    window.dispatchEvent(new CustomEvent("smart-search-result", { detail: result }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
      {/* ── Outer wrapper: covers viewport, passes clicks through to the map ── */}
      <div className="pointer-events-none absolute top-0 left-0 w-full p-3 z-[1000]">

        {/* ── Navbar card ── */}
        <nav className="pointer-events-auto mx-auto flex max-w-[1400px] items-center justify-between rounded-2xl border border-white/[0.08] bg-[#161b22]/95 px-4 py-2 shadow-lg backdrop-blur-md">

          {/* ── Left: Logo + Search ── */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f6c343] shadow-sm">
                <Map size={20} className="text-[#0d1117]" />
              </div>
              <h5 className="mb-0 hidden text-lg font-bold text-white sm:block">
                LandBD <span className="text-[#f6c343]">3.0</span>
              </h5>
            </Link>

            {/* Quick Search Shortcut */}
            <button
              className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-[#0d1117] px-3 py-2 text-sm transition-colors hover:border-[#f6c343]/40 md:flex"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={16} className="text-[#b7bdc8]" />
              <span className="text-[#b7bdc8]">{t.hero.searchPlaceholder}</span>
              <span className="ml-2 rounded-full bg-[#1f2937] px-2 py-0.5 text-[10px] text-[#b7bdc8]">
                Ctrl K
              </span>
            </button>
          </div>

          {/* ── Right: Desktop nav links ── */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/dap-map"
              className="px-3 py-1 text-sm font-semibold text-[#b7bdc8] no-underline transition-colors hover:text-[#f6c343]"
            >
              {t.nav.mapWorkspaces}
            </Link>
            <Link
              href="/khatiyan"
              className="px-3 py-1 text-sm font-semibold text-[#b7bdc8] no-underline transition-colors hover:text-[#f6c343]"
            >
              {t.nav.tools}
            </Link>
            <Link
              href="/blog"
              className="px-3 py-1 text-sm font-semibold text-[#b7bdc8] no-underline transition-colors hover:text-[#f6c343]"
            >
              {t.nav.blog}
            </Link>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-white/10" />

            {isLoggedIn ? (
              /* ── Account dropdown (state-driven) ── */
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-[#f6c343]/40 px-3 py-1.5 text-sm font-semibold text-[#f6c343] transition-colors hover:bg-[#f6c343]/10"
                >
                  <User size={16} /> {t.nav.account}
                  <svg
                    className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#161b22] shadow-xl">
                    <Link
                      href="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#f6c343] no-underline transition-colors hover:bg-white/5"
                    >
                      <ShieldCheck size={16} /> {t.nav.adminDashboard}
                    </Link>
                    <div className="border-t border-white/[0.08]" />
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 transition-colors hover:bg-white/5"
                    >
                      <LogOut size={16} /> {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 flex items-center gap-2 rounded-full bg-[#f6c343] px-4 py-1.5 text-sm font-bold text-[#0d1117] shadow-sm no-underline transition-colors hover:bg-[#d4a532]"
              >
                <LogIn size={16} /> {t.nav.login}
              </Link>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#1f2937] shadow-sm lg:hidden"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu size={20} className="text-white" />
          </button>
        </nav>

        {/* ── Mobile slide panel (state-driven, replaces Bootstrap offcanvas) ── */}
        {/* Backdrop */}
        <div
          className={`pointer-events-auto fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={`pointer-events-auto fixed top-0 right-0 z-[1200] flex h-full w-72 flex-col border-l border-white/[0.08] bg-[#161b22] shadow-2xl transition-transform duration-300 ease-in-out ${
            isMobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
            <h5 className="flex items-center gap-2 text-lg font-bold text-white">
              <Map size={20} className="text-[#f6c343]" /> LandBD
            </h5>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Panel body */}
          <div className="flex flex-1 flex-col gap-3 p-4">
            <Link
              href="/dap-map"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg border border-white/[0.08] px-4 py-3 text-left font-semibold text-[#b7bdc8] no-underline transition-colors hover:border-[#f6c343]/30 hover:text-[#f6c343]"
            >
              {t.nav.mapWorkspaces}
            </Link>
            <Link
              href="/khatiyan"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg border border-white/[0.08] px-4 py-3 text-left font-semibold text-[#b7bdc8] no-underline transition-colors hover:border-[#f6c343]/30 hover:text-[#f6c343]"
            >
              {t.nav.tools}
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-lg border border-white/[0.08] px-4 py-3 text-left font-semibold text-[#b7bdc8] no-underline transition-colors hover:border-[#f6c343]/30 hover:text-[#f6c343]"
            >
              {t.nav.blog}
            </Link>

            {/* Bottom action */}
            <div className="mt-auto">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f6c343] py-3 font-bold text-[#0d1117] no-underline transition-colors hover:bg-[#d4a532]"
                  >
                    <ShieldCheck size={16} /> {t.nav.adminDashboard}
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      handleLogout();
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut size={16} /> {t.nav.logout}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f6c343] py-3 font-bold text-[#0d1117] no-underline transition-colors hover:bg-[#d4a532]"
                >
                  <LogIn size={16} /> {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <SmartSearchPalette
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={handleSelectResult}
        />
      )}
    </>
  );
}
