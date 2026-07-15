"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Map,
  Download,
  BookOpen,
  Info,
  LogIn,
  User,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function GisNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      className="position-absolute top-0 start-0 w-100 p-3 z-3"
      style={{ pointerEvents: "none" }}
    >
      <nav
        className="navbar navbar-expand-lg rounded-4 shadow-sm px-3 py-2 mx-auto d-flex justify-content-between align-items-center"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          pointerEvents: "auto",
          maxWidth: "1400px",
        }}
      >
        <div className="d-flex align-items-center gap-4">
          <Link
            href="/"
            className="navbar-brand d-flex align-items-center text-decoration-none"
          >
            <div
              className="bg-success text-white rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "38px", height: "38px" }}
            >
              <Map size={20} />
            </div>
            <h5 className="fw-bold mb-0 text-dark d-none d-sm-block">
              LandBD <span className="text-success">2.0</span>
            </h5>
          </Link>

          {/* Quick Search Shortcut (Triggers floating search panel later) */}
          <button className="btn btn-light rounded-pill px-3 py-2 text-muted border shadow-sm d-none d-md-flex align-items-center gap-2 hover-bg-light transition-all">
            <Search size={16} />
            <span>Search plots, mouzas, coordinates...</span>
            <span className="badge bg-secondary rounded-pill ms-2">Ctrl+K</span>
          </button>
        </div>

        <div className="d-none d-lg-flex align-items-center gap-2">
          <Link href="/dap-map" className="btn btn-sm btn-link text-dark text-decoration-none fw-bold hover-text-success">
            Map
          </Link>
          <Link href="/khatiyan" className="btn btn-sm btn-link text-dark text-decoration-none fw-bold hover-text-success">
            Tools
          </Link>
          <Link href="/downloads" className="btn btn-sm btn-link text-dark text-decoration-none fw-bold hover-text-success">
            Downloads
          </Link>
          <Link href="/blog" className="btn btn-sm btn-link text-dark text-decoration-none fw-bold hover-text-success">
            Blog
          </Link>
          <Link href="/about" className="btn btn-sm btn-link text-dark text-decoration-none fw-bold hover-text-success">
            About
          </Link>

          <div className="vr mx-2 bg-secondary opacity-25"></div>

          {isLoggedIn ? (
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-2 dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <User size={16} /> My Account
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                <li>
                  <Link href="/admin" className="dropdown-item py-2 d-flex align-items-center gap-2 fw-bold text-primary">
                    <ShieldCheck size={16} /> Admin Dashboard
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item py-2 text-danger">Logout</button>
                </li>
              </ul>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-sm btn-success rounded-pill px-4 fw-bold shadow-sm"
            >
              <LogIn size={16} className="me-2" /> Login
            </Link>
          )}
        </div>

        <button
          className="btn btn-light rounded-circle p-2 d-lg-none shadow-sm border"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#gisSidebar"
        >
          <Menu size={20} />
        </button>
      </nav>

      {/* Mobile Offcanvas for GIS Navbar */}
      <div className="offcanvas offcanvas-end border-0 shadow-lg" tabIndex={-1} id="gisSidebar" style={{ pointerEvents: "auto" }}>
        <div className="offcanvas-header border-bottom py-3">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
             <Map size={20} className="text-success" /> LandBD
          </h5>
          <button type="button" className="btn-close shadow-none" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body d-flex flex-column gap-3 p-4">
          <Link href="/dap-map" className="btn btn-light text-start py-3 rounded-3 fw-bold">Map</Link>
          <Link href="/khatiyan" className="btn btn-light text-start py-3 rounded-3 fw-bold">Tools</Link>
          <Link href="/downloads" className="btn btn-light text-start py-3 rounded-3 fw-bold">Downloads</Link>
          <Link href="/blog" className="btn btn-light text-start py-3 rounded-3 fw-bold">Blog</Link>
          <Link href="/about" className="btn btn-light text-start py-3 rounded-3 fw-bold">About</Link>
          
          <div className="mt-auto">
            {isLoggedIn ? (
              <Link href="/admin" className="btn btn-primary w-100 py-3 rounded-pill fw-bold">Admin Dashboard</Link>
            ) : (
              <Link href="/login" className="btn btn-success w-100 py-3 rounded-pill fw-bold">Login</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
