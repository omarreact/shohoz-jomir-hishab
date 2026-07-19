"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Map,
  BookOpen,
  User,
  ShieldCheck,
  Bell,
  Menu,
  X,
  LogIn,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";

import { t } from "@/src/locales";

const NAV_LINKS = [
  { href: "/", label: t.nav.home },
  { href: "/dap-map", label: t.nav.mapWorkspaces },
  { href: "/khatiyan", label: t.nav.tools },
  { href: "/blog", label: t.nav.blog },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const handleSelectResult = (result: any) => {
    // If not on map, redirect to map with query parameter or similar.
    // For now, dispatch the event in case they're on the map workspace route.
    window.dispatchEvent(new CustomEvent("smart-search-result", { detail: result }));
  };

  return (
    <>
      <header
        className={`sticky-top w-100 transition-all ${
          scrolled ? "glass-panel shadow-sm" : "bg-transparent"
        }`}
        style={{ zIndex: 1030, borderBottom: scrolled ? "none" : "1px solid var(--border-color)" }}
      >
        <div className="container px-4">
          <div className="d-flex align-items-center justify-content-between py-3">
            {/* Logo area */}
            <div className="d-flex align-items-center gap-4">
              <Link href="/" className="text-decoration-none d-flex align-items-center gap-2">
                <div className="bg-primary text-dark rounded d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                  <Map size={20} />
                </div>
                <h5 className="fw-bold mb-0 text-white d-none d-sm-block">
                  LandBD <span className="text-primary">3.0</span>
                </h5>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="d-none d-lg-flex align-items-center gap-4">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-decoration-none fw-medium transition-all ${
                      isActive ? "text-primary" : "text-secondary hover-text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="d-flex align-items-center gap-3">
              {/* Search Shortcut */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-none d-md-flex align-items-center gap-2 text-secondary"
                style={{ backgroundColor: "var(--background)", border: "1px solid var(--border-color)" }}
              >
                <Search size={14} />
                <span className="ms-1" style={{ fontSize: "13px" }}>{t.nav.searchShortcut.split(' ')[0]}</span>
                <span className="badge bg-secondary rounded-pill ms-1" style={{ fontSize: "10px" }}>Ctrl K</span>
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="btn btn-light rounded-circle p-2 d-md-none d-flex align-items-center justify-content-center"
              >
                <Search size={18} className="text-white" />
              </button>

              {/* User / Auth Menu */}
              {isLoggedIn ? (
                <div className="d-flex align-items-center gap-3">
                  <button className="btn btn-link p-0 text-secondary position-relative">
                    <Bell size={20} />
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-dark rounded-circle">
                      <span className="visually-hidden">New alerts</span>
                    </span>
                  </button>

                  <div className="dropdown">
                    <button
                      className="btn btn-light rounded-pill px-3 py-1 d-flex align-items-center gap-2"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ border: "1px solid var(--border-color)" }}
                    >
                      <User size={16} className="text-white" />
                      <span className="fw-medium text-white d-none d-md-block" style={{ fontSize: "14px" }}>{t.nav.account}</span>
                      <ChevronDown size={14} className="text-white" />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" style={{ borderRadius: "var(--radius-md)", minWidth: "200px" }}>
                      <li>
                        <Link href="/admin" className="dropdown-item py-2 d-flex align-items-center gap-2 fw-medium text-white">
                          <ShieldCheck size={16} className="text-primary" /> {t.nav.adminDashboard}
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button onClick={handleLogout} className="dropdown-item py-2 d-flex align-items-center gap-2 fw-medium text-danger">
                          <LogOut size={16} /> {t.nav.logout}
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-primary btn-sm rounded-pill px-4 fw-medium d-none d-md-flex align-items-center shadow-sm"
                >
                  <LogIn size={16} className="me-2" /> {t.nav.login}
                </Link>
              )}

              {/* Mobile Hamburger */}
              <button
                className="btn btn-light rounded p-2 d-lg-none d-flex align-items-center justify-content-center border-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ backgroundColor: "var(--card-bg-secondary)" }}
              >
                {isMobileMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="d-lg-none border-top py-3 animate-fade-in" style={{ backgroundColor: "var(--card-bg)" }}>
              <div className="d-flex flex-column gap-2">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-decoration-none fw-medium py-2 px-3 rounded transition-all ${
                        isActive ? "bg-primary bg-opacity-10 text-primary" : "text-secondary hover-bg-light"
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
                    className="btn btn-primary rounded-pill fw-medium py-2 mt-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn size={16} className="me-2" /> {t.nav.login}
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
