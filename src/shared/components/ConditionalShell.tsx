"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MaintenanceGate from "@/src/shared/components/MaintenanceGate";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Remove legacy PWA/offline state left by older deployments.
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ("caches" in window) {
      void caches.keys().then((keys) => {
        keys.forEach((key) => {
          void caches.delete(key);
        });
      });
    }
  }, []);

  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");
  // Full-viewport GIS sandboxes only (no shared chrome).
  const isIsolatedMapSandbox = pathname?.startsWith("/dap-map");

  if (isAdminRoute || isLoginRoute || isIsolatedMapSandbox) {
    return <>{children}</>;
  }

  const isProductMapRoute =
    pathname?.startsWith("/geospatial-map") || pathname?.startsWith("/mouza-map");

  return (
    <MaintenanceGate>
      {/* Explicit flex column so Navbar + main + Footer fill the viewport.
          Without this, ThemeProvider / fragment ancestors break body flex and
          map containers collapse to 0px → blank white MapLibre canvas. */}
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main
          className={
            isProductMapRoute
              ? "relative flex min-h-0 w-full flex-1 flex-col"
              : "flex-grow-1"
          }
        >
          {children}
        </main>
        <HistoryShortcut />
        {/* Product maps own the viewport — footer creates a large dead white band on mobile. */}
        {!isProductMapRoute && <Footer />}
        <MobileFloatingNav />
      </div>
    </MaintenanceGate>
  );
}
