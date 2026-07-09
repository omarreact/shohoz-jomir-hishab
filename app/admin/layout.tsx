"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Database,
  Settings,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Next.js hydration error সমাধানের জন্য
  useEffect(() => {
    setIsMounted(true);
    // ছোট স্ক্রিনে ডিফল্টভাবে সাইডবার বন্ধ রাখা
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const navItems = [
    { name: "ড্যাশবোর্ড", path: "/admin", icon: LayoutDashboard },
    { name: "ইউজার ম্যানেজমেন্ট", path: "/admin/users", icon: Users },
    { name: "রাজউক API কন্ট্রোল", path: "/admin/rajuk-config", icon: Database },
    { name: "সেটিংস", path: "/admin/settings", icon: Settings },
  ];

  if (!isMounted) return null; // Hydration রোধে

  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      <div
        className="bg-dark text-white transition-all overflow-hidden"
        style={{ width: isSidebarOpen ? "260px" : "80px", transition: "0.3s" }}
      >
        <div
          className="p-3 d-flex align-items-center justify-content-center border-bottom border-secondary"
          style={{ height: "70px" }}
        >
          <ShieldCheck size={28} className="text-success flex-shrink-0" />
          {isSidebarOpen && (
            <h5 className="mb-0 fw-bold ms-2 text-nowrap">Smart Admin</h5>
          )}
        </div>
        <ul className="nav flex-column p-2 mt-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li className="nav-item mb-2" key={item.path}>
                <Link
                  href={item.path}
                  className={`nav-link rounded-3 d-flex align-items-center ${isActive ? "bg-success text-white shadow-sm" : "text-light hover-bg-secondary"}`}
                >
                  <item.icon
                    size={20}
                    className={
                      isSidebarOpen
                        ? "me-3 flex-shrink-0"
                        : "mx-auto flex-shrink-0"
                    }
                  />
                  {isSidebarOpen && (
                    <span className="text-nowrap">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <nav
          className="navbar navbar-light bg-white shadow-sm px-4 border-bottom"
          style={{ height: "70px" }}
        >
          <button
            className="btn btn-light rounded-pill border-0"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <div className="d-flex align-items-center">
            <span className="me-3 fw-bold d-none d-md-inline">
              Welcome, Admin
            </span>
            <button className="btn btn-danger btn-sm rounded-pill px-3 d-flex align-items-center">
              <LogOut size={16} className="me-2" /> লগআউট
            </button>
          </div>
        </nav>
        <div className="p-4 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
