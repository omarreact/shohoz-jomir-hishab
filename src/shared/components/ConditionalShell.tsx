"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Keep the existing service-worker cleanup until the dedicated PWA cleanup
  // PR so access-control changes remain isolated and easy to regression-test.
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

  const isGeospatialMap =
    pathname === "/geospatial-map" || pathname?.startsWith("/geospatial-map/");

  const isWarishSanad =
    pathname === "/warishsanad" ||
    pathname?.startsWith("/warishsanad/") ||
    pathname === "/warish" ||
    pathname?.startsWith("/warish/");

  const isMaintenanceRoute =
    pathname === "/maintenance" || pathname?.startsWith("/maintenance/");

  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");
  const isSystemRoute = pathname?.startsWith("/403");
  const isControlPlane = isAdminRoute || isLoginRoute || isSystemRoute;

  // Access has already been decided by proxy.ts. These routes bypass normal
  // application chrome only for layout/geometry reasons.
  if (isGeospatialMap || isWarishSanad || isMaintenanceRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      {!isControlPlane ? <HistoryShortcut /> : null}
      <Footer />
      {!isControlPlane ? <MobileFloatingNav /> : null}
    </div>
  );
}
