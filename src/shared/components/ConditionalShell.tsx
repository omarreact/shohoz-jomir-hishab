"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import GisNavbar from "@/src/shared/components/GisNavbar";
import Footer from "@/src/shared/components/Footer";
import MaintenanceGate from "@/src/shared/components/MaintenanceGate";

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");
  const isGisRoute = pathname?.startsWith("/dap-map");

  if (isAdminRoute || isLoginRoute) return <>{children}</>;

  if (isGisRoute) {
    return (
      <div style={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative" }}>
        <GisNavbar />
        <main className="w-100 h-100">{children}</main>
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
