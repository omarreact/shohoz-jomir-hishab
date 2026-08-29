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
  const isGisRoute =
    pathname?.startsWith("/dap-map") || pathname?.startsWith("/geospatial-map");

  if (isAdminRoute || isLoginRoute) return <>{children}</>;

  if (isGisRoute) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Navbar />
        <main className="h-full w-full pb-20 md:pb-0">{children}</main>
        <HistoryShortcut />
        <MobileFloatingNav />
      </div>
    );
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
