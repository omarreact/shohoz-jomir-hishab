"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
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
