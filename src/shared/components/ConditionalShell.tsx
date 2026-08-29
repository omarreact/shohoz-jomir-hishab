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
  const isGisRoute =
    pathname?.startsWith("/dap-map") || pathname?.startsWith("/geospatial-map");

  if (isAdminRoute || isLoginRoute) return <>{children}</>;

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {isGisRoute ? (
        <div className="relative h-screen w-screen overflow-hidden">
          <Navbar />
          <main className="h-full w-full pb-20 md:pb-0">{children}</main>
          <HistoryShortcut />
          <MobileFloatingNav />
        </div>
      ) : (
        <MaintenanceGate>
          <Navbar />
          <main className="flex-grow-1">{children}</main>
          <HistoryShortcut />
          <Footer />
          <MobileFloatingNav />
        </MaintenanceGate>
      )}
    </>
  );
}
