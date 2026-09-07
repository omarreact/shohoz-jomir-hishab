"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MaintenanceGate from "@/src/shared/components/MaintenanceGate";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";
import PageAccessGate from "@/src/shared/components/PageAccessGate";

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
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

  const isGeospatialMap = pathname === "/geospatial-map" || pathname?.startsWith("/geospatial-map/");
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");
  const isSystemRoute = pathname?.startsWith("/403");
  const isControlPlane = isAdminRoute || isLoginRoute || isSystemRoute;

  // The GIS viewport is the single route that intentionally bypasses all app chrome.
  if (isGeospatialMap) {
    return <PageAccessGate>{children}</PageAccessGate>;
  }

  const pageContent = isControlPlane ? children : <PageAccessGate>{children}</PageAccessGate>;
  const shell = (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="flex-grow-1">{pageContent}</main>
      {!isControlPlane ? <HistoryShortcut /> : null}
      <Footer />
      {!isControlPlane ? <MobileFloatingNav /> : null}
    </div>
  );

  // Admin/login/system routes keep their own availability semantics, but still
  // receive the global Navbar/Footer required by the application shell.
  if (isControlPlane) return shell;

  return <MaintenanceGate>{shell}</MaintenanceGate>;
}
