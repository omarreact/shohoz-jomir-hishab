"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MaintenanceGate from "@/src/shared/components/MaintenanceGate";

const GIS_PREFIXES = ["/dap-map", "/geospatial-map", "/lios-map"] as const;

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");
  const isGisRoute = GIS_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isAdminRoute || isLoginRoute) return <>{children}</>;

  if (isGisRoute) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <Navbar />
        <main className="h-full w-full">{children}</main>
      </div>
    );
  }

  return (
    <MaintenanceGate>
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      <Footer />
    </MaintenanceGate>
  );
}
