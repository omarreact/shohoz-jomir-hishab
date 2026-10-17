import type { ReactNode } from "react";
import Navbar from "@/src/shared/components/Navbar";
import MobileAppHeader from "@/src/shared/components/MobileAppHeader";
import Footer from "@/src/shared/components/Footer";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";

/**
 * One native-feeling mobile shell for public app routes.
 * The desktop navbar remains intact. Navigation sheets are not mounted on mobile.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landbd-native-shell flex min-h-[100dvh] min-w-0 flex-1 flex-col">
      <div className="hidden md:block"><Navbar /></div>
      <MobileAppHeader />
      <main id="landbd-mobile-content" className="min-w-0 flex-1">{children}</main>
      <HistoryShortcut />
      <div className="hidden md:block"><Footer /></div>
      <MobileFloatingNav />
    </div>
  );
}
