"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MaintenanceGate from "@/src/shared/components/MaintenanceGate";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
