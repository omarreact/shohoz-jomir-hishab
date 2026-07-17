"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Map,
  Menu,
  LogIn,
  LogOut,
  ShieldCheck,
  ChevronDown,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { t } from "@/src/locales";

export default function GisNavbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
      <nav
        className={cn(
          "flex items-center justify-between rounded-2xl px-4 py-2.5 mx-auto gap-2 transition-all duration-300 relative z-50 mt-4 max-w-[calc(100%-2rem)]",
          "bg-background/80 backdrop-blur-xl shadow-lg border border-white/10"
        )}
      >
        {/* Left section: Logo + Search */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center no-underline hover-transform">
            <div
              className="bg-primary text-primary-foreground rounded-xl p-2 mr-3 flex items-center justify-center shadow-glow"
              style={{ width: "40px", height: "40px" }}
            >
              <Map size={24} />
            </div>
            <h5 className="font-black mb-0 text-foreground hidden sm:block tracking-tight text-xl">
              LandBD <span className="text-primary">4.1</span>
            </h5>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex gap-2 rounded-full border-white/10 bg-background/50 text-muted-foreground hover:text-foreground"
          >
            <Search size={14} />
            <span className="text-xs font-medium">
              {t.hero.searchPlaceholder}
            </span>
            <span className="inline-flex items-center rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
              Ctrl K
            </span>
          </Button>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/dap-map"
            className={cn(
              "px-3 py-1.5 text-sm font-bold no-underline rounded-lg transition-colors",
              pathname?.startsWith("/dap-map")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-accent",
            )}
          >
            {t.nav.mapWorkspaces}
          </Link>
          <Link
            href="/khatiyan"
            className={cn(
              "px-3 py-1.5 text-sm font-bold no-underline rounded-lg transition-colors",
              pathname?.startsWith("/khatiyan")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-accent",
            )}
          >
            {t.nav.tools}
          </Link>
          <Link
            href="/blog"
            className={cn(
              "px-3 py-1.5 text-sm font-bold no-underline rounded-lg transition-colors",
              pathname?.startsWith("/blog")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-accent",
            )}
          >
            {t.nav.blog}
          </Link>

          <div className="w-px h-5 bg-border mx-1" />

          {isLoggedIn ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold no-underline rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            >
              <ShieldCheck size={14} className="text-primary" />{" "}
              {t.nav.adminDashboard}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold no-underline rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            >
              <LogIn size={14} /> {t.nav.login}
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div className="hidden lg:flex items-center">
              <Link
                href="/admin"
                className="px-4 py-1.5 text-sm font-bold rounded-full bg-primary text-primary-foreground no-underline hover:bg-primary/90 transition-colors shadow-sm"
              >
                <ShieldCheck size={16} className="inline mr-1.5" />{" "}
                {t.nav.adminDashboard}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-full bg-primary text-primary-foreground no-underline hover:bg-primary/90 transition-colors shadow-sm"
            >
              <LogIn size={16} /> {t.nav.login}
            </Link>
          )}

          {/* Mobile Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="flex lg:hidden rounded-lg p-2 bg-card border border-border"
                type="button"
              >
                <Menu size={20} className="text-muted-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col" style={{ backgroundColor: "var(--card-bg)" }}>
              <SheetHeader className="p-4 border-b border-border text-left">
                <SheetTitle className="flex items-center gap-2 text-foreground">
                  <Map size={20} className="text-primary" /> LandBD
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 p-4">
                <Link
                  href="/dap-map"
                  className="block px-4 py-3 rounded-xl border border-border text-sm font-bold no-underline text-foreground hover:bg-accent transition-colors"
                >
                  {t.nav.mapWorkspaces}
                </Link>
                <Link
                  href="/khatiyan"
                  className="block px-4 py-3 rounded-xl border border-border text-sm font-bold no-underline text-foreground hover:bg-accent transition-colors"
                >
                  {t.nav.tools}
                </Link>
                <Link
                  href="/blog"
                  className="block px-4 py-3 rounded-xl border border-border text-sm font-bold no-underline text-foreground hover:bg-accent transition-colors"
                >
                  {t.nav.blog}
                </Link>
              </div>
              <div className="mt-auto p-4 border-t border-border">
                {isLoggedIn ? (
                  <Link
                    href="/admin"
                    className="block w-full text-center rounded-full bg-primary text-primary-foreground py-3 font-bold no-underline hover:bg-primary/90 transition-colors"
                  >
                    {t.nav.adminDashboard}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="block w-full text-center rounded-full bg-primary text-primary-foreground py-3 font-bold no-underline hover:bg-primary/90 transition-colors"
                  >
                    {t.nav.login}
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {isSearchOpen && (
        <SmartSearchPalette
          onClose={() => setIsSearchOpen(false)}
          onSelectResult={handleSelectResult}
        />
      )}
    </>
  );
}
