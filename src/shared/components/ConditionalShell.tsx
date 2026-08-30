"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MaintenanceGate from "@/src/shared/components/MaintenanceGate";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";
import ServiceWorkerRegistration from "@/src/shared/components/ServiceWorkerRegistration";
import { useNetworkStatus } from "@/src/shared/hooks/useNetworkStatus";

function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[2000] flex h-8 items-center justify-center bg-amber-100 px-3 text-xs font-bold text-amber-900 shadow-sm dark:bg-amber-950 dark:text-amber-100"
    >
      অফলাইন মোড · খতিয়ান ও ফারায়েজ ক্যালকুলেটর চালু আছে
    </div>
  );
}

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isLoginRoute = pathname?.startsWith("/login");
  const isMapRoute =
    pathname?.startsWith("/dap-map") ||
    pathname?.startsWith("/geospatial-map") ||
    pathname?.startsWith("/mouza-map");

  // GIS routes are deliberately isolated from the application shell. MapLibre owns
  // the full viewport and must not inherit Navbar, mobile navigation, history UI,
  // maintenance gates, or the network/offline listener.
  if (isAdminRoute || isLoginRoute || isMapRoute) {
    return (
      <>
        {isMapRoute ? null : <ServiceWorkerRegistration />}
        {children}
      </>
    );
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      <MaintenanceGate>
        <Navbar />
        <main className="flex-grow-1">{children}</main>
        <HistoryShortcut />
        <Footer />
        <MobileFloatingNav />
      </MaintenanceGate>
    </>
  );
}
