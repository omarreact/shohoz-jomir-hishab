import type { ReactNode } from "react";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";
import MobileFloatingNav from "@/src/shared/components/MobileFloatingNav";
import HistoryShortcut from "@/src/shared/components/HistoryShortcut";

/** Public chrome is owned by a route group, never guessed from pathname. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      <HistoryShortcut />
      <Footer />
      <MobileFloatingNav />
    </div>
  );
}
