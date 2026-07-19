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
  LogOut
} from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import SmartSearchPalette from "@/src/features/search/components/SmartSearchPalette";
import { t } from "@/src/locales";

export default function GisNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const handleSelectResult = (result: any) => {
    window.dispatchEvent(new CustomEvent("smart-search-result", { detail: result }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <>
    <div
      className="position-absolute top-0 start-0 w-100 p-3 z-3"
      style={{ pointerEvents: "none" }}
    >
      <nav
        className="navbar navbar-expand-lg rounded-4 shadow-sm px-3 py-2 mx-auto d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          pointerEvents: "auto",
          maxWidth: "1400px",
          opacity: 0.95
        }}
      >
        <div className="d-flex align-items-center gap-4">
          <Link
            href="/"
            className="navbar-brand d-flex align-items-center text-decoration-none"
          >
            <div
              className="bg-primary text-dark rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "38px", height: "38px" }}
            >
              <Map size={20} />
            </div>
            <h5 className="fw-bold mb-0 text-white d-none d-sm-block">
              LandBD <span className="text-primary">3.0</span>
            </h5>
          </Link>

          {/* Quick Search Shortcut */}
          <button 
            className="btn btn-outline-secondary rounded-pill px-3 py-2 shadow-sm d-none d-md-flex align-items-center gap-2 transition-all"
            onClick={() => setIsSearchOpen(true)}
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border-color)", fontSize: "14px" }}
          >
            <Search size={16} />
            <span className="text-muted">{t.hero.searchPlaceholder}</span>
            <span className="badge bg-secondary rounded-pill ms-2" style={{ fontSize: "10px" }}>Ctrl K</span>
          </button>
        </div>

        <div className="d-none d-lg-flex align-items-center gap-2">
          <Link href="/dap-map" className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold hover-text-primary">
            {t.nav.mapWorkspaces}
          </Link>
          <Link href="/khatiyan" className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold hover-text-primary">
            {t.nav.tools}
          </Link>
          <Link href="/blog" className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold hover-text-primary">
            {t.nav.blog}
          </Link>

          <div className="vr mx-2 bg-secondary opacity-25"></div>

          {isLoggedIn ? (
            <div className="dropdown ms-2">
              <button
                className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-2 dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <User size={16} /> {t.nav.account}
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3" style={{ backgroundColor: "var(--card-bg)" }}>
                <li>
                  <Link href="/admin" className="dropdown-item py-2 d-flex align-items-center gap-2 fw-bold text-primary">
                    <ShieldCheck size={16} /> {t.nav.adminDashboard}
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button onClick={handleLogout} className="dropdown-item py-2 text-danger d-flex align-items-center gap-2">
                    <LogOut size={16} /> {t.nav.logout}
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm ms-2 d-flex align-items-center"
            >
              <LogIn size={16} className="me-2" /> {t.nav.login}
            </Link>
          )}
        </div>

        <button
          className="btn btn-light rounded-circle p-2 d-lg-none shadow-sm border"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#gisSidebar"
          style={{ backgroundColor: "var(--card-bg-secondary)" }}
        >
          <Menu size={20} className="text-white" />
        </button>
      </nav>

      {/* Mobile Offcanvas for GIS Navbar */}
      <div className="offcanvas offcanvas-end border-0 shadow-lg" tabIndex={-1} id="gisSidebar" style={{ pointerEvents: "auto", backgroundColor: "var(--card-bg)" }}>
        <div className="offcanvas-header border-bottom py-3">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
             <Map size={20} className="text-primary" /> LandBD
          </h5>
          <button type="button" className="btn-close btn-close-white shadow-none" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column gap-3 p-4">
          <Link href="/dap-map" className="btn btn-outline-secondary text-start py-3 rounded-3 fw-bold">{t.nav.mapWorkspaces}</Link>
          <Link href="/khatiyan" className="btn btn-outline-secondary text-start py-3 rounded-3 fw-bold">{t.nav.tools}</Link>
          <Link href="/blog" className="btn btn-outline-secondary text-start py-3 rounded-3 fw-bold">{t.nav.blog}</Link>
          
          <div className="mt-auto">
            {isLoggedIn ? (
              <Link href="/admin" className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-dark">{t.nav.adminDashboard}</Link>
            ) : (
              <Link href="/login" className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-dark">{t.nav.login}</Link>
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
