"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import GisNavbar from "@/src/shared/components/GisNavbar";
import Footer from "@/src/shared/components/Footer";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  const { isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    // Skip maintenance check for admin and login routes
    if (isAdminRoute || isLoginRoute) {
      setMaintenanceLoading(false);
      return;
    }

    // Fetch maintenance flag — don't wait for auth, it's a public endpoint.
    // Authenticated users bypass maintenance mode via the auth check below.
    fetch("/api/public/maintenance")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.maintenanceMode === true) setIsMaintenance(true);
      })
      .catch(() => {
        // If the endpoint fails, show the site normally
      })
      .finally(() => setMaintenanceLoading(false));
  }, [isAdminRoute, isLoginRoute]);

  // For admin and login routes: render children directly (no navbar/footer)
  if (isAdminRoute || isLoginRoute) {
    return <>{children}</>;
  }

  if (maintenanceLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (isMaintenance && !authLoading && !isLoggedIn) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4 fade-in"
        style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}
      >
        <div className="mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-warning"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <h1 className="fw-bolder mb-3 text-white">সাইট মেইনটেন্যান্স চলছে</h1>
        <p
          className="lead opacity-75"
          style={{ maxWidth: "500px" }}
        >
          আমাদের ওয়েবসাইট আপডেট করার কাজ চলছে। সাময়িক এই অসুবিধার জন্য আমরা
          আন্তরিকভাবে দুঃখিত। খুব শীঘ্রই আমরা ফিরে আসবো!
        </p>
      </div>
    );
  }

  const isGisRoute = pathname?.startsWith("/dap-map");

  if (isGisRoute) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <GisNavbar />
        <main className="w-100 h-100">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </>
  );
}
