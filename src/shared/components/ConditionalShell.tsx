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
    // Remove legacy PWA/offline state left by older deployments. This is a
    // one-time browser cleanup; the application no longer registers a service
    // worker or provides offline fallbacks.
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
  const isMapRoute =
    pathname?.startsWith("/dap-map") ||
    pathname?.startsWith("/geospatial-map") ||
    pathname?.startsWith("/mouza-map");

  // GIS routes are deliberately isolated from the application shell. MapLibre owns
  // the full viewport and must not inherit shared navigation or maintenance UI.
  if (isAdminRoute || isLoginRoute || isMapRoute) {
    return <>{children}</>;
  }

  return (
    <MaintenanceGate>
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      <HistoryShortcut />
      <Footer />
      <MobileFloatingNav />
    </MaintenanceGate>
  );
}
