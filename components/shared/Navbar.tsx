"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { t } from "@/src/locales";

const NAV_LINKS = [
  { href: "/", label: t.nav.home },
  { href: "/dap-map", label: t.nav.mapWorkspaces },
  { href: "/khatiyan", label: t.nav.tools },
  { href: "/blog", label: t.nav.blog },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

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
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleSelectResult = (result: Record<string, unknown>) => {
    window.dispatchEvent(
      new CustomEvent("smart-search-result", { detail: result }),
    );
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 w-full transition-all duration-300 z-50",
          scrolled ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-white/10 py-1" : "bg-background/60 backdrop-blur-lg border-b border-white/5 py-3",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            {/* Logo area */}
            <div className="flex items-center gap-4">
              <Link href="/" className="no-underline flex items-center gap-3 hover-transform">
                <div
                  className="bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-glow"
                  style={{ width: "40px", height: "40px" }}
                >
                  <Map size={24} />
                </div>
                <h5 className="font-black mb-0 text-foreground hidden sm:block tracking-tight text-xl">
                  LandBD <span className="text-primary">4.1</span>
                </h5>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "no-underline font-semibold text-[15px] transition-colors relative group py-2",
                      pathname === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {link.label}
                    <span className={cn(
                      "absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full transform origin-left transition-transform duration-300",
                      pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )} />
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search Shortcut */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex gap-2 rounded-full border-white/10 bg-background/50 text-muted-foreground hover:text-foreground"
              >
                <Search size={14} />
                <span className="text-xs font-medium">
                  {t.nav.searchShortcut.split(" ")[0]}
                </span>
                <span className="inline-flex items-center rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
                  Ctrl K
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsSearchOpen(true)}
                className="flex md:hidden rounded-full"
              >
                <Search size={18} />
              </Button>

              {/* User / Auth Menu */}
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(239,83,80,0.8)]">
                      <span className="sr-only">New alerts</span>
                    </span>
                  </Button>

                  {/* Dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 rounded-full border-white/10 bg-background/50 hover:bg-background/80"
                      aria-expanded={isDropdownOpen}
                    >
                      <User size={16} className="text-muted-foreground" />
                      <span className="font-medium text-foreground text-sm hidden md:block">
                        {t.nav.account}
                      </span>
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground"
                      />
                    </Button>
                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-right border-white/10">
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors no-underline"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <ShieldCheck size={16} className="text-primary" />{" "}
                            {t.nav.adminDashboard}
                          </Link>
                          <hr className="my-0 border-white/10" />
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <LogOut size={16} /> {t.nav.logout}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Button size="sm" className="hidden md:flex rounded-full" onClick={() => router.push("/login")}>
                  <LogIn size={16} /> {t.nav.login}
                </Button>
              )}

              {/* Mobile Hamburger */}
              <Button
                variant="outline"
                size="icon-sm"
                className="flex lg:hidden rounded-lg border-white/10 bg-background/50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X size={20} className="text-muted-foreground" />
                ) : (
                  <Menu size={20} className="text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div
              className="lg:hidden border-t border-border py-3 animate-fade-in"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "no-underline font-medium py-2 px-3 rounded-lg transition-colors text-sm",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="mt-2 rounded-full bg-primary text-primary-foreground font-medium py-2 px-4 text-center text-sm no-underline"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn size={16} className="inline mr-2" /> {t.nav.login}
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
