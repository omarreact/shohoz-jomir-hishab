import type { ReactNode } from "react";
import Navbar from "@/src/shared/components/Navbar";
import Footer from "@/src/shared/components/Footer";

/**
 * One consistent public chrome on all viewports:
 * header dropdown navigation (desktop hover / mobile accordion),
 * full-width content, and footer. No sidebar/drawer/bottom navigation.
 * Admin and immersive map routes keep their independent layouts.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="landbd-clean-shell flex min-h-[100dvh] min-w-0 flex-1 flex-col">
      <Navbar />
      <main id="landbd-mobile-content" className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
