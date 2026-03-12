"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Ruler, Users, Home, BookOpen, LogOut, LogIn, Menu, MoonStar } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import ThemeToggle from "./ThemeToggle";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
// import LanguageToggle from "./LanguageToggle";

function DesktopNavItem({ href, label, Icon }: { href: string; label: string; Icon: ComponentType<{ size?: number; className?: string }> }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <li className="nav-item mx-1 mb-2 mb-lg-0">
      <Link href={href} className={`nav-link d-flex align-items-center px-3 py-2 rounded-pill transition-all ${active ? "active bg-success bg-opacity-10 text-success fw-bold" : "text-secondary"}`}>
        <Icon size={18} className={`me-2 ${active ? "text-success" : ""}`} /> {label}
      </Link>
    </li>
  );
}

function BottomNavItem({ href, label, Icon }: { href: string; label: string; Icon: ComponentType<{ size?: number; className?: string }> }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`text-decoration-none d-flex flex-column align-items-center p-2 transition-all ${active ? "text-success" : "text-secondary"}`}>
      <div className={`p-1 rounded-pill transition-all ${active ? "bg-success bg-opacity-10" : ""}`}>
        <Icon size={22} className={active ? "text-success" : ""} />
      </div>
      <span style={{ fontSize: "11px", marginTop: "2px", fontWeight: active ? "700" : "500" }}>{label}</span>
    </Link>
  );
}

function OffcanvasNavItem({ href, label, Icon }: { href: string; label: string; Icon: ComponentType<{ size?: number; className?: string }> }) {
  const pathname = usePathname();
  const active = pathname === href;
  
  return (
    <li className="nav-item mb-2" data-bs-dismiss="offcanvas">
      <Link href={href} className={`nav-link d-flex align-items-center px-3 py-3 rounded-3 transition-all ${active ? "bg-success bg-opacity-10 text-success fw-bold" : "text-secondary hover-bg-light"}`}>
        <Icon size={20} className={`me-3 ${active ? "text-success" : ""}`} /> {label}
      </Link>
    </li>
  );
}

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    void import("bootstrap/dist/js/bootstrap.bundle.min.js");
    return () => unsubscribe();
  }, []);

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
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 991.98px) {
          body {
            padding-bottom: 75px !important;
          }
        }
      `}} />

      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom sticky-top shadow-sm py-2 py-lg-3" style={{ backgroundColor: "var(--card-bg)", backdropFilter: "blur(10px)" }}>
        <div className="container">
          
          <Link href="/" className="navbar-brand d-flex align-items-center text-decoration-none me-auto">
            <div className="bg-success text-white rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '38px', height: '38px' }}>
              <Calculator size={20} />
            </div>
            <h4 className="fw-bold mb-0 d-none d-sm-block">
              <span className="text-dark">সহজ</span> <span className="text-success">জমির হিসাব</span>
            </h4>
            <h5 className="fw-bold mb-0 d-block d-sm-none text-success mt-1">
              সহজ জমির হিসাব
            </h5>
          </Link>

          <div className="d-none d-lg-flex align-items-center gap-3 w-100 justify-content-end">
            <ul className="navbar-nav mx-auto">
              <DesktopNavItem href="/" label="হোম" Icon={Home} />
              <DesktopNavItem href="/khatiyan" label="খতিয়ান" Icon={Calculator} />
              <DesktopNavItem href="/land-measurement" label="জমি মাপ" Icon={Ruler} />
              <DesktopNavItem href="/faraez" label="ফারায়েজ" Icon={Users} />
              <DesktopNavItem href="/blog" label="ব্লগ" Icon={BookOpen} />
            </ul>
            {/* <LanguageToggle /> */}
            {isLoggedIn ? (
                <>
                  <Link href="/admin" className="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                    ড্যাশবোর্ড
                  </Link>
                  <button onClick={handleLogout} className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center">
                    <LogOut size={16} className="me-1" /> লগআউট
                  </button>
                </>
              ) : (
                <Link href="/login" className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center">
                  <LogIn size={16} className="me-1" /> লগিন
                </Link>
              )}
              
              {/* <ThemeToggle /> */}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="d-lg-none fixed-bottom shadow-lg border-top d-flex justify-content-around align-items-center pb-2 pt-1 px-2" style={{ backgroundColor: "var(--card-bg)", zIndex: 1040 }}>
        <BottomNavItem href="/" label="হোম" Icon={Home} />
        <BottomNavItem href="/khatiyan" label="খতিয়ান" Icon={Calculator} />
        <BottomNavItem href="/land-measurement" label="জমি মাপ" Icon={Ruler} />
        <BottomNavItem href="/faraez" label="ফারায়েজ" Icon={Users} />
        
        <button 
          className="btn btn-link text-decoration-none d-flex flex-column align-items-center p-2 text-secondary border-0 bg-transparent shadow-none" 
          data-bs-toggle="offcanvas" 
          data-bs-target="#mobileOffcanvas"
          aria-controls="mobileOffcanvas"
        >
          <div className="p-1">
            <Menu size={22} />
          </div>
          <span style={{ fontSize: "11px", marginTop: "2px", fontWeight: "500" }}>মেনু</span>
        </button>
      </div>

      {/* Offcanvas Menu */}
      <div className="offcanvas offcanvas-start border-end-0 shadow" tabIndex={-1} id="mobileOffcanvas" style={{ backgroundColor: "var(--card-bg)", width: "280px" }}>
        <div className="offcanvas-header border-bottom py-3">
          <div className="d-flex align-items-center">
            <div className="bg-success text-white rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
              <Calculator size={16} />
            </div>
            <h5 className="offcanvas-title fw-bold text-success mb-0">সহজ জমির হিসাব</h5>
          </div>
          <button type="button" className="btn-close text-reset shadow-none" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        
        <div className="offcanvas-body d-flex flex-column px-3 py-4">
          <ul className="navbar-nav mb-auto">
            <OffcanvasNavItem href="/" label="হোম" Icon={Home} />
            <OffcanvasNavItem href="/khatiyan" label="খতিয়ান ক্যালকুলেটর" Icon={Calculator} />
            <OffcanvasNavItem href="/land-measurement" label="জমি মাপ ক্যালকুলেটর" Icon={Ruler} />
            <OffcanvasNavItem href="/faraez" label="ফারায়েজ (উত্তরাধিকার)" Icon={Users} />
            <OffcanvasNavItem href="/blog" label="আইন বিষয়ক ব্লগ" Icon={BookOpen} />
          </ul>

          <div className="mt-auto pt-4 border-top">
            <div className="d-flex align-items-center justify-content-between p-3 mb-4 rounded-4 bg-success bg-opacity-10 border border-success border-opacity-25">
              <span className="fw-bold text-success small d-flex align-items-center">
                <MoonStar size={16} className="me-2" /> থিম পরিবর্তন
              </span>
              <ThemeToggle />
            </div>
          
            {isLoggedIn ? (
              <div className="d-flex flex-column gap-2">
                <div data-bs-dismiss="offcanvas">
                  <Link href="/admin" className="btn btn-primary w-100 rounded-pill d-flex align-items-center justify-content-center py-2 fw-bold">
                    ড্যাশবোর্ড
                  </Link>
                </div>
                <button onClick={handleLogout} data-bs-dismiss="offcanvas" className="btn btn-outline-danger w-100 rounded-pill d-flex align-items-center justify-content-center py-2 fw-bold">
                  <LogOut size={18} className="me-2" /> লগআউট করুন
                </button>
              </div>
            ) : (
              <div data-bs-dismiss="offcanvas">
                <Link href="/login" className="btn btn-success w-100 rounded-pill d-flex align-items-center justify-content-center py-2 text-white shadow-sm fw-bold">
                  <LogIn size={18} className="me-2" /> অ্যাডমিন লগিন
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}